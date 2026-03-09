package main

import (
	"log"
	"math"
	"math/rand/v2"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const (
	goalRadius       = 3.0
	goalRespawnDelay = 5 * time.Second
	goalSpawnRange   = 80.0

	bumpRadius       = 1.5
	bumpRadiusSq     = bumpRadius * bumpRadius
	bumpCooldownTime = 500 * time.Millisecond
)

const terrainSeed = 1

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Hub struct {
	mu         sync.RWMutex
	clients    map[string]*Client // keyed by ID
	register   chan *Client
	unregister chan *Client

	goalMu        sync.Mutex
	goalActive    bool
	goalX, goalY, goalZ float64
	goalRespawnAt time.Time

	bumpCooldowns map[string]time.Time
}

func newHub() *Hub {
	return &Hub{
		clients:       make(map[string]*Client),
		register:      make(chan *Client),
		unregister:    make(chan *Client),
		bumpCooldowns: make(map[string]time.Time),
	}
}

func (h *Hub) spawnGoal() {
	h.goalX = (rand.Float64()*2 - 1) * goalSpawnRange
	h.goalZ = (rand.Float64()*2 - 1) * goalSpawnRange
	h.goalY = terrainHeight(h.goalX, h.goalZ)
	h.goalActive = true
	h.goalRespawnAt = time.Time{}
	log.Printf("goal spawned at (%.1f, %.1f, %.1f)", h.goalX, h.goalY, h.goalZ)
}

func (h *Hub) checkGoalReached() {
	h.goalMu.Lock()
	defer h.goalMu.Unlock()

	if !h.goalActive {
		if !h.goalRespawnAt.IsZero() && time.Now().After(h.goalRespawnAt) {
			h.spawnGoal()
			h.broadcastAllLocked("goal-spawn", GoalSpawnPayload{
				X: h.goalX, Y: h.goalY, Z: h.goalZ,
			})
		}
		return
	}

	radiusSq := goalRadius * goalRadius
	for _, c := range h.clients {
		if !c.joined.Load() {
			continue
		}
		c.mu.Lock()
		dx := c.x - h.goalX
		dz := c.z - h.goalZ
		distSq := dx*dx + dz*dz
		name := c.name
		id := c.id
		c.mu.Unlock()

		if distSq <= radiusSq {
			c.mu.Lock()
			c.score++
			c.mu.Unlock()
			h.goalActive = false
			h.goalRespawnAt = time.Now().Add(goalRespawnDelay)
			log.Printf("goal reached by %s (%s)", id, name)
			h.broadcastAllLocked("goal-reached", GoalReachedPayload{
				WinnerID:   id,
				WinnerName: name,
				GoalX:      h.goalX,
				GoalZ:      h.goalZ,
				Scores:     h.scoresLocked(),
			})
			return
		}
	}
}

func (h *Hub) broadcastAllLocked(msgType string, payload any) {
	data, err := encode(msgType, payload)
	if err != nil {
		log.Printf("encode error: %v", err)
		return
	}
	for _, c := range h.clients {
		select {
		case c.send <- data:
		default:
		}
	}
}

func (h *Hub) run() {
	h.goalMu.Lock()
	h.spawnGoal()
	h.goalMu.Unlock()

	ticker := time.NewTicker(200 * time.Millisecond) // 5Hz
	defer ticker.Stop()

	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.id] = client
			h.mu.Unlock()
			log.Printf("client connected: %s (%d total)", client.id, len(h.clients))

		case client := <-h.unregister:
			wasJoined := client.joined.Load()
			h.mu.Lock()
			if _, ok := h.clients[client.id]; ok {
				delete(h.clients, client.id)
				close(client.send)
				log.Printf("client disconnected: %s (%d total)", client.id, len(h.clients))
			}
			h.mu.Unlock()

			// Clean up bump cooldown entries involving this player
			for key := range h.bumpCooldowns {
				if len(client.id) > 0 && containsID(key, client.id) {
					delete(h.bumpCooldowns, key)
				}
			}

			if wasJoined {
				h.broadcast(client.id, "player-left", PlayerLeftPayload{ID: client.id})
			}

		case <-ticker.C:
			h.broadcastTick()
		}
	}
}

func (h *Hub) broadcastTick() {
	h.mu.RLock()
	defer h.mu.RUnlock()

	if len(h.clients) == 0 {
		return
	}

	updates := make([]PlayerStateUpdate, 0, len(h.clients))
	for _, c := range h.clients {
		if !c.joined.Load() {
			continue
		}

		c.mu.Lock()
		if !c.dirty {
			c.mu.Unlock()
			continue
		}
		y := terrainHeight(c.x, c.z)
		c.y = y
		c.dirty = false
		update := PlayerStateUpdate{ID: c.id, X: c.x, Y: y, Z: c.z, RY: c.ry}
		c.mu.Unlock()

		updates = append(updates, update)
	}

	if len(updates) == 0 {
		return
	}

	data, err := encode("players-update", PlayersUpdatePayload{Players: updates})
	if err != nil {
		log.Printf("encode error: %v", err)
		return
	}

	for _, c := range h.clients {
		select {
		case c.send <- data:
		default:
			log.Printf("send buffer full for %s, dropping message", c.id)
		}
	}

	h.checkGoalReached()
	h.checkPlayerCollisions()
}

func bumpPairKey(id1, id2 string) string {
	if id1 < id2 {
		return id1 + ":" + id2
	}
	return id2 + ":" + id1
}

func containsID(pairKey, id string) bool {
	return strings.HasPrefix(pairKey, id+":") || strings.HasSuffix(pairKey, ":"+id)
}

// checkPlayerCollisions detects collisions between player pairs and broadcasts knockback.
// Must be called with h.mu held for reading.
func (h *Hub) checkPlayerCollisions() {
	type playerPos struct {
		id   string
		x, z float64
	}

	players := make([]playerPos, 0, len(h.clients))
	for _, c := range h.clients {
		if !c.joined.Load() {
			continue
		}
		c.mu.Lock()
		players = append(players, playerPos{id: c.id, x: c.x, z: c.z})
		c.mu.Unlock()
	}

	now := time.Now()

	for i := 0; i < len(players); i++ {
		for j := i + 1; j < len(players); j++ {
			a, b := players[i], players[j]
			dx := b.x - a.x
			dz := b.z - a.z
			distSq := dx*dx + dz*dz
			if distSq > bumpRadiusSq || distSq < 0.001 {
				continue
			}

			key := bumpPairKey(a.id, b.id)
			if last, ok := h.bumpCooldowns[key]; ok && now.Sub(last) < bumpCooldownTime {
				continue
			}
			h.bumpCooldowns[key] = now

			dist := math.Sqrt(distSq)
			nx := dx / dist
			nz := dz / dist

			h.broadcastAllLocked("player-bump", PlayerBumpPayload{
				ID1: a.id,
				ID2: b.id,
				DX1: -nx,
				DZ1: -nz,
				DX2: nx,
				DZ2: nz,
			})
		}
	}
}

func (h *Hub) broadcast(excludeID string, msgType string, payload any) {
	data, err := encode(msgType, payload)
	if err != nil {
		log.Printf("encode error: %v", err)
		return
	}

	h.mu.RLock()
	defer h.mu.RUnlock()
	for id, c := range h.clients {
		if id == excludeID {
			continue
		}
		select {
		case c.send <- data:
		default:
			log.Printf("send buffer full for %s, dropping message", id)
		}
	}
}

func (h *Hub) send(clientID string, msgType string, payload any) {
	data, err := encode(msgType, payload)
	if err != nil {
		log.Printf("encode error: %v", err)
		return
	}

	h.mu.RLock()
	client, ok := h.clients[clientID]
	h.mu.RUnlock()
	if !ok {
		return
	}

	select {
	case client.send <- data:
	default:
		log.Printf("send buffer full for %s, dropping message", clientID)
	}
}

func (h *Hub) worldState() []PlayerInfo {
	h.mu.RLock()
	defer h.mu.RUnlock()

	players := make([]PlayerInfo, 0, len(h.clients))
	for _, c := range h.clients {
		if !c.joined.Load() {
			continue
		}
		c.mu.Lock()
		players = append(players, PlayerInfo{
			ID:    c.id,
			Name:  c.name,
			Color: c.color,
			X:     c.x,
			Y:     c.y,
			Z:     c.z,
			RY:    c.ry,
		})
		c.mu.Unlock()
	}
	return players
}

func (h *Hub) scores() []ScoreEntry {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.scoresLocked()
}

// scoresLocked requires h.mu to be held (read or write).
func (h *Hub) scoresLocked() []ScoreEntry {
	entries := make([]ScoreEntry, 0, len(h.clients))
	for _, c := range h.clients {
		if !c.joined.Load() {
			continue
		}
		c.mu.Lock()
		entries = append(entries, ScoreEntry{ID: c.id, Name: c.name, Score: c.score})
		c.mu.Unlock()
	}
	sort.Slice(entries, func(i, j int) bool { return entries[i].Score > entries[j].Score })
	return entries
}

func (h *Hub) handleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("upgrade error: %v", err)
		return
	}

	client := newClient(h, conn)
	h.register <- client

	go client.writePump()
	go client.readPump()
}
