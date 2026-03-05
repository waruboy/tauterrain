package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"sync"

	"github.com/gorilla/websocket"
)

type Client struct {
	id     string
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	joined bool

	mu           sync.Mutex
	name         string
	color        int
	x, y, z, ry float64
	dirty        bool
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
	defer c.conn.Close()

	for msg := range c.send {
		if err := c.conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			log.Printf("write error for %s: %v", c.id, err)
			return
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
		if c.joined {
			c.handlePlayerUpdate(msg.Payload)
		}
	}
}

func (c *Client) handleJoin(raw json.RawMessage) {
	if c.joined {
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
	c.joined = true
	c.mu.Unlock()

	// Send welcome + world state to this client
	c.hub.send(c.id, "welcome", WelcomePayload{ID: c.id, Seed: terrainSeed})
	c.hub.send(c.id, "world-state", WorldStatePayload{Players: c.hub.worldState()})

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
	rand.Read(b)
	return hex.EncodeToString(b)
}
