package main

import (
	"encoding/json"
	"testing"
)

func TestEncodeWelcome(t *testing.T) {
	data, err := encode("welcome", WelcomePayload{ID: "abc123", Seed: 1})
	if err != nil {
		t.Fatalf("encode error: %v", err)
	}

	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}
	if msg.Type != "welcome" {
		t.Errorf("type = %q, want %q", msg.Type, "welcome")
	}

	var payload WelcomePayload
	if err := json.Unmarshal(msg.Payload, &payload); err != nil {
		t.Fatalf("unmarshal payload error: %v", err)
	}
	if payload.ID != "abc123" {
		t.Errorf("id = %q, want %q", payload.ID, "abc123")
	}
	if payload.Seed != 1 {
		t.Errorf("seed = %d, want %d", payload.Seed, 1)
	}
}

func TestEncodeGoalSpawn(t *testing.T) {
	data, err := encode("goal-spawn", GoalSpawnPayload{X: 1.5, Y: 2.5, Z: 3.5})
	if err != nil {
		t.Fatalf("encode error: %v", err)
	}

	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}
	if msg.Type != "goal-spawn" {
		t.Errorf("type = %q, want %q", msg.Type, "goal-spawn")
	}

	var payload GoalSpawnPayload
	if err := json.Unmarshal(msg.Payload, &payload); err != nil {
		t.Fatalf("unmarshal payload error: %v", err)
	}
	if payload.X != 1.5 || payload.Y != 2.5 || payload.Z != 3.5 {
		t.Errorf("payload = %+v, want {1.5, 2.5, 3.5}", payload)
	}
}

func TestEncodeGoalReached(t *testing.T) {
	data, err := encode("goal-reached", GoalReachedPayload{
		WinnerID: "id1", WinnerName: "Alice", GoalX: 10, GoalZ: 20,
	})
	if err != nil {
		t.Fatalf("encode error: %v", err)
	}

	var msg Message
	json.Unmarshal(data, &msg)

	var payload GoalReachedPayload
	json.Unmarshal(msg.Payload, &payload)

	if payload.WinnerID != "id1" {
		t.Errorf("winnerId = %q, want %q", payload.WinnerID, "id1")
	}
	if payload.WinnerName != "Alice" {
		t.Errorf("winnerName = %q, want %q", payload.WinnerName, "Alice")
	}
}
