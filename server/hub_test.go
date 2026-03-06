package main

import (
	"encoding/json"
	"testing"
	"time"
)

func TestSpawnGoalWithinRange(t *testing.T) {
	h := newHub()
	h.goalMu.Lock()
	for i := 0; i < 100; i++ {
		h.spawnGoal()
		if h.goalX < -goalSpawnRange || h.goalX > goalSpawnRange {
			t.Errorf("goalX = %f out of range [-%f, %f]", h.goalX, goalSpawnRange, goalSpawnRange)
		}
		if h.goalZ < -goalSpawnRange || h.goalZ > goalSpawnRange {
			t.Errorf("goalZ = %f out of range [-%f, %f]", h.goalZ, goalSpawnRange, goalSpawnRange)
		}
		if !h.goalActive {
			t.Error("goalActive should be true after spawnGoal")
		}
	}
	h.goalMu.Unlock()
}

func TestSpawnGoalYMatchesTerrain(t *testing.T) {
	h := newHub()
	h.goalMu.Lock()
	h.spawnGoal()
	expected := terrainHeight(h.goalX, h.goalZ)
	if h.goalY != expected {
		t.Errorf("goalY = %f, want terrainHeight = %f", h.goalY, expected)
	}
	h.goalMu.Unlock()
}

func testClient(hub *Hub, id string) *Client {
	c := &Client{
		id:   id,
		hub:  hub,
		send: make(chan []byte, 256),
	}
	c.joined.Store(true)
	return c
}

func TestCheckGoalReachedDetectsProximity(t *testing.T) {
	h := newHub()

	// Place goal at known position
	h.goalMu.Lock()
	h.goalActive = true
	h.goalX = 50
	h.goalZ = 50
	h.goalY = terrainHeight(50, 50)
	h.goalMu.Unlock()

	// Add a client at the goal position
	c := testClient(h, "player1")
	c.mu.Lock()
	c.name = "Alice"
	c.x = 50
	c.z = 50
	c.mu.Unlock()

	h.mu.Lock()
	h.clients[c.id] = c
	h.mu.Unlock()

	// Run check under RLock (as broadcastTick does)
	h.mu.RLock()
	h.checkGoalReached()
	h.mu.RUnlock()

	h.goalMu.Lock()
	if h.goalActive {
		t.Error("goal should be inactive after being reached")
	}
	if h.goalRespawnAt.IsZero() {
		t.Error("goalRespawnAt should be set")
	}
	h.goalMu.Unlock()

	// Client should have received goal-reached message
	select {
	case data := <-c.send:
		var msg Message
		json.Unmarshal(data, &msg)
		if msg.Type != "goal-reached" {
			t.Errorf("message type = %q, want %q", msg.Type, "goal-reached")
		}
		var payload GoalReachedPayload
		json.Unmarshal(msg.Payload, &payload)
		if payload.WinnerID != "player1" {
			t.Errorf("winnerId = %q, want %q", payload.WinnerID, "player1")
		}
		if payload.WinnerName != "Alice" {
			t.Errorf("winnerName = %q, want %q", payload.WinnerName, "Alice")
		}
	default:
		t.Error("client did not receive goal-reached message")
	}
}

func TestCheckGoalReachedIgnoresFarPlayer(t *testing.T) {
	h := newHub()

	h.goalMu.Lock()
	h.goalActive = true
	h.goalX = 50
	h.goalZ = 50
	h.goalY = 0
	h.goalMu.Unlock()

	c := testClient(h, "player1")
	c.mu.Lock()
	c.x = 0
	c.z = 0
	c.mu.Unlock()

	h.mu.Lock()
	h.clients[c.id] = c
	h.mu.Unlock()

	h.mu.RLock()
	h.checkGoalReached()
	h.mu.RUnlock()

	h.goalMu.Lock()
	if !h.goalActive {
		t.Error("goal should remain active when no player is near")
	}
	h.goalMu.Unlock()
}

func TestCheckGoalRespawnsAfterDelay(t *testing.T) {
	h := newHub()

	// Set goal as inactive with past respawn time
	h.goalMu.Lock()
	h.goalActive = false
	h.goalRespawnAt = time.Now().Add(-1 * time.Second)
	h.goalMu.Unlock()

	c := testClient(h, "player1")
	h.mu.Lock()
	h.clients[c.id] = c
	h.mu.Unlock()

	h.mu.RLock()
	h.checkGoalReached()
	h.mu.RUnlock()

	h.goalMu.Lock()
	if !h.goalActive {
		t.Error("goal should have respawned after delay elapsed")
	}
	h.goalMu.Unlock()

	// Client should have received goal-spawn
	select {
	case data := <-c.send:
		var msg Message
		json.Unmarshal(data, &msg)
		if msg.Type != "goal-spawn" {
			t.Errorf("message type = %q, want %q", msg.Type, "goal-spawn")
		}
	default:
		t.Error("client did not receive goal-spawn message")
	}
}
