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

type WorldStatePayload struct {
	Players []PlayerInfo `json:"players"`
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

func encode(msgType string, payload any) ([]byte, error) {
	p, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	return json.Marshal(Message{Type: msgType, Payload: p})
}
