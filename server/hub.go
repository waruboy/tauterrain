package main

import (
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
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
}

func newHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) run() {
	ticker := time.NewTicker(50 * time.Millisecond) // 20Hz
	defer ticker.Stop()

	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.id] = client
			h.mu.Unlock()
			log.Printf("client connected: %s (%d total)", client.id, len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.id]; ok {
				delete(h.clients, client.id)
				close(client.send)
				log.Printf("client disconnected: %s (%d total)", client.id, len(h.clients))
			}
			h.mu.Unlock()

			if client.joined {
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
		if !c.joined {
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
		if !c.joined {
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
