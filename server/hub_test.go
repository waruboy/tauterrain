package main

import (
	"encoding/json"
	"math"
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
		if len(payload.Scores) == 0 {
			t.Error("scores should not be empty after goal reached")
		} else if payload.Scores[0].Score != 1 {
			t.Errorf("winner score = %d, want 1", payload.Scores[0].Score)
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

func TestCheckPlayerCollisionsDetectsBump(t *testing.T) {
	h := newHub()

	c1 := testClient(h, "p1")
	c1.mu.Lock()
	c1.x = 10
	c1.z = 10
	c1.mu.Unlock()

	c2 := testClient(h, "p2")
	c2.mu.Lock()
	c2.x = 11 // distance = 1.0, within bumpRadius (1.5)
	c2.z = 10
	c2.mu.Unlock()

	h.mu.Lock()
	h.clients[c1.id] = c1
	h.clients[c2.id] = c2
	h.mu.Unlock()

	h.mu.RLock()
	h.checkPlayerCollisions()
	h.mu.RUnlock()

	// Both clients should receive a player-bump message
	for _, c := range []*Client{c1, c2} {
		select {
		case data := <-c.send:
			var msg Message
			json.Unmarshal(data, &msg)
			if msg.Type != "player-bump" {
				t.Errorf("client %s: message type = %q, want %q", c.id, msg.Type, "player-bump")
			}
			var payload PlayerBumpPayload
			json.Unmarshal(msg.Payload, &payload)
			if payload.ID1 != "p1" && payload.ID1 != "p2" {
				t.Errorf("unexpected id1: %s", payload.ID1)
			}
			// Verify knockback directions are normalized and opposite
			len1 := math.Sqrt(payload.DX1*payload.DX1 + payload.DZ1*payload.DZ1)
			if math.Abs(len1-1.0) > 0.01 {
				t.Errorf("knockback direction 1 not normalized: length = %f", len1)
			}
			// Directions should be opposite
			if math.Abs(payload.DX1+payload.DX2) > 0.01 || math.Abs(payload.DZ1+payload.DZ2) > 0.01 {
				t.Error("knockback directions should be opposite")
			}
		default:
			t.Errorf("client %s did not receive player-bump message", c.id)
		}
	}
}

func TestCheckPlayerCollisionsIgnoresDistantPlayers(t *testing.T) {
	h := newHub()

	c1 := testClient(h, "p1")
	c1.mu.Lock()
	c1.x = 0
	c1.z = 0
	c1.mu.Unlock()

	c2 := testClient(h, "p2")
	c2.mu.Lock()
	c2.x = 100
	c2.z = 100
	c2.mu.Unlock()

	h.mu.Lock()
	h.clients[c1.id] = c1
	h.clients[c2.id] = c2
	h.mu.Unlock()

	h.mu.RLock()
	h.checkPlayerCollisions()
	h.mu.RUnlock()

	select {
	case <-c1.send:
		t.Error("c1 should not have received a message")
	default:
	}
	select {
	case <-c2.send:
		t.Error("c2 should not have received a message")
	default:
	}
}

func TestCheckPlayerCollisionsCooldown(t *testing.T) {
	h := newHub()

	c1 := testClient(h, "p1")
	c1.mu.Lock()
	c1.x = 10
	c1.z = 10
	c1.mu.Unlock()

	c2 := testClient(h, "p2")
	c2.mu.Lock()
	c2.x = 11
	c2.z = 10
	c2.mu.Unlock()

	h.mu.Lock()
	h.clients[c1.id] = c1
	h.clients[c2.id] = c2
	h.mu.Unlock()

	// First collision
	h.mu.RLock()
	h.checkPlayerCollisions()
	h.mu.RUnlock()

	// Drain messages from first bump
	for range 2 {
		select {
		case <-c1.send:
		default:
		}
		select {
		case <-c2.send:
		default:
		}
	}

	// Second collision immediately — should be suppressed by cooldown
	h.mu.RLock()
	h.checkPlayerCollisions()
	h.mu.RUnlock()

	select {
	case <-c1.send:
		t.Error("c1 should not receive a second bump within cooldown")
	default:
	}
	select {
	case <-c2.send:
		t.Error("c2 should not receive a second bump within cooldown")
	default:
	}
}
