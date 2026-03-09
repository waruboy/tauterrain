# AGENT.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

TauTerrain is a multiplayer 3D terrain game. Players navigate procedurally generated infinite terrain, race to collect goal markers for points, bump each other, and compete for high scores. Built with Three.js (frontend) and Go (backend), synced over WebSockets.

## Commands

```bash
# Install frontend dependencies
cd hello-world && npm install

# Development — run both servers concurrently
cd hello-world && npm run dev    # Vite dev server on port 5200
cd server && go run .            # Go server on port 3000

# Production build
cd hello-world && npm run build
cd server && go run .            # Serves built frontend from hello-world/dist/ on port 3000

# Tests
cd hello-world && npm test       # Vitest (client)
cd server && go test ./...       # Go test (server)
```

## Tech Stack

- **Frontend:** Three.js, Vite, ES Modules (port 5200 dev)
- **Backend:** Go, gorilla/websocket (port 3000)
- **Terrain:** Simplex noise, shared between client and server
- **Testing:** Vitest (client), Go test (server)
- **Requirements:** Node.js v18+, Go 1.24+

## Architecture

### Frontend (`hello-world/src/`)

- `main.js` — Entry point
- `App.js` — Main game loop and orchestration
- `Character.js` / `CharacterController.js` — Local player model and movement (knockback, speed)
- `CameraController.js` — Third-person camera follow
- `ChunkManager.js` / `TerrainChunk.js` / `terrain-noise.js` / `terrain-constants.js` — Procedural terrain chunk system
- `NetworkManager.js` — WebSocket client with exponential backoff reconnection (1s → 30s)
- `PlayerManager.js` / `RemotePlayer.js` — Remote player sync and rendering
- `InputHandler.js` — Keyboard input
- `SceneSetup.js` — Renderer, scene, camera init
- `GoalManager.js` / `GoalMarker.js` — Goal system (3m collection radius, 5s respawn delay)
- `GoalCompass.js` — HUD compass pointing to goal
- `SpeedBoostManager.js` — 15 speed boost orbs (2x speed for 5s)
- `HudManager.js` / `Scoreboard.js` / `FpsCounter.js` / `SpeedIndicator.js` — HUD elements
- `JoinScreen.js` — Name/color selection screen
- `WinnerAnnouncement.js` — Goal-reached notification

### Backend (`server/`)

- `main.go` — HTTP server, static file serving (port configurable via `PORT` env var)
- `hub.go` — Game hub: player registration, goal spawning/collision, player bumping (1.5m radius, 500ms cooldown)
- `client.go` — Per-connection WebSocket read/write pumps
- `message.go` — JSON message type definitions
- `terrain.go` / `noise.go` — Server-side terrain height lookup (matches client noise)
- `validate.go` — Input validation

### Networking

- JSON-based WebSocket protocol with message types: join, player-update, welcome, world-state, goal-spawn, player-bump, goal-reached, etc.
- Client sends position updates at 20Hz; server broadcasts world state at 20Hz
- Dev: client on port 5200 connects to `ws://localhost:3000/ws`
- Production: Go server serves frontend from `hello-world/dist/`

## Key Conventions

- ES modules throughout (`"type": "module"` in package.json)
- Three.js imported as `import * as THREE from 'three'`
- Terrain generation uses identical simplex noise on both client and server for consistency
- `SERVER_URL` in `NetworkManager.js` supports dynamic environment configuration
