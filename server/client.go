package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gorilla/websocket"
)

const (
	writeWait      = 10 * time.Second       // deadline for each write
	pongWait       = 60 * time.Second       // max silence before disconnect
	pingPeriod     = (pongWait * 9) / 10    // how often to send pings
	maxMessageSize = 512                    // bytes — join + player-update are both small
)

type Client struct {
	id     string
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	joined atomic.Bool // safe for concurrent reads without c.mu

	mu           sync.Mutex
	name         string
	color        int
	x, y, z, ry float64
	dirty        bool
	score        int
}

func newClient(hub *Hub, conn *websocket.Conn) *Client {
	return &Client{
		id:   generateID(),
		hub:  hub,
		conn: conn,
		send: make(chan []byte, 256),
	}
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})

	for {
		_, raw, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("read error for %s: %v", c.id, err)
			}
			break
		}
		c.handleMessage(raw)
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				log.Printf("write error for %s: %v", c.id, err)
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleMessage(raw []byte) {
	var msg Message
	if err := json.Unmarshal(raw, &msg); err != nil {
		c.sendError("invalid-message", "Invalid message format")
		return
	}

	switch msg.Type {
	case "join":
		c.handleJoin(msg.Payload)
	case "player-update":
		if c.joined.Load() {
			c.handlePlayerUpdate(msg.Payload)
		}
	}
}

func (c *Client) handleJoin(raw json.RawMessage) {
	if c.joined.Load() {
		return
	}

	var payload JoinPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		c.sendError("invalid-message", "Invalid join payload")
		return
	}

	name, errMsg := validateName(payload.Name)
	if errMsg != "" {
		c.sendError("invalid-name", errMsg)
		return
	}

	c.mu.Lock()
	c.name  = name
	c.color = payload.Color
	c.mu.Unlock()
	c.joined.Store(true)

	// Send welcome + world state to this client
	c.hub.send(c.id, "welcome", WelcomePayload{ID: c.id, Seed: terrainSeed})
	c.hub.send(c.id, "world-state", WorldStatePayload{
		Players: c.hub.worldState(),
		Scores:  c.hub.scores(),
	})

	// Send current goal if active
	c.hub.goalMu.Lock()
	if c.hub.goalActive {
		c.hub.send(c.id, "goal-spawn", GoalSpawnPayload{
			X: c.hub.goalX, Y: c.hub.goalY, Z: c.hub.goalZ,
		})
	}
	c.hub.goalMu.Unlock()

	// Notify all other clients
	c.hub.broadcast(c.id, "player-joined", PlayerJoinedPayload{
		ID:    c.id,
		Name:  name,
		Color: payload.Color,
	})

	log.Printf("player joined: %s (%s)", c.id, name)
}

func (c *Client) handlePlayerUpdate(raw json.RawMessage) {
	var payload PlayerUpdatePayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return
	}

	c.mu.Lock()
	c.x     = payload.X
	c.z     = payload.Z
	c.ry    = payload.RY
	c.dirty = true
	c.mu.Unlock()
}

func (c *Client) sendError(code, message string) {
	c.hub.send(c.id, "error", ErrorPayload{Code: code, Message: message})
}

func generateID() string {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		log.Fatalf("failed to generate ID: %v", err)
	}
	return hex.EncodeToString(b)
}
