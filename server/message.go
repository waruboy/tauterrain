package main

import "encoding/json"

type Message struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type JoinPayload struct {
	Name  string `json:"name"`
	Color int    `json:"color"`
}

type PlayerUpdatePayload struct {
	X  float64 `json:"x"`
	Z  float64 `json:"z"`
	RY float64 `json:"ry"`
}

type WelcomePayload struct {
	ID   string `json:"id"`
	Seed int    `json:"seed"`
}

type PlayerInfo struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Color int     `json:"color"`
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
	Z     float64 `json:"z"`
	RY    float64 `json:"ry"`
}

type ScoreEntry struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Score int    `json:"score"`
}

type WorldStatePayload struct {
	Players []PlayerInfo `json:"players"`
	Scores  []ScoreEntry `json:"scores"`
}

type PlayerJoinedPayload struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Color int    `json:"color"`
}

type PlayerLeftPayload struct {
	ID string `json:"id"`
}

type PlayerStateUpdate struct {
	ID string  `json:"id"`
	X  float64 `json:"x"`
	Y  float64 `json:"y"`
	Z  float64 `json:"z"`
	RY float64 `json:"ry"`
}

type PlayersUpdatePayload struct {
	Players []PlayerStateUpdate `json:"players"`
}

type ErrorPayload struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type GoalSpawnPayload struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

type GoalReachedPayload struct {
	WinnerID   string       `json:"winnerId"`
	WinnerName string       `json:"winnerName"`
	GoalX      float64      `json:"goalX"`
	GoalZ      float64      `json:"goalZ"`
	Scores     []ScoreEntry `json:"scores"`
}

type PlayerBumpPayload struct {
	ID1 string  `json:"id1"`
	ID2 string  `json:"id2"`
	DX1 float64 `json:"dx1"`
	DZ1 float64 `json:"dz1"`
	DX2 float64 `json:"dx2"`
	DZ2 float64 `json:"dz2"`
}

func encode(msgType string, payload any) ([]byte, error) {
	p, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	return json.Marshal(Message{Type: msgType, Payload: p})
}
