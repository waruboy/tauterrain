# TauTerrain

A multiplayer 3D terrain game built with Three.js and Go. Players navigate a procedurally generated terrain, race to reach goal markers, bump into each other, and compete for the highest score.

## Features

- **Procedural terrain** — infinite chunks generated with simplex noise, loaded dynamically around the player
- **Multiplayer** — real-time player sync over WebSockets at 20Hz with automatic reconnection
- **Goal system** — collectible goal markers spawn on the terrain; first player to reach one scores a point, with a new goal respawning after a delay
- **Player collisions** — bump into other players to knock them back
- **Speed boosts** — pick up speed boost items scattered across the terrain
- **Terrain-based speed** — movement speed varies based on terrain height
- **HUD** — FPS counter, scoreboard, goal compass, and speed indicator

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | Three.js, Vite, ES Modules        |
| Backend  | Go, gorilla/websocket              |
| Terrain  | Simplex noise (shared client/server) |
| Testing  | Vitest (client), Go test (server)  |

## Getting Started

### Prerequisites

- Node.js (v18+)
- Go (1.24+)

### Run the server (development)

```bash
# Terminal 1 — start the Go server (default port 3000)
cd server
go run .

# Terminal 2 — start the Vite dev server (port 5200)
cd hello-world
npm install
npm run dev
```

Open http://localhost:5200 in your browser. The dev client connects to the Go server on `ws://localhost:3000/ws`.

### Production build

```bash
# Build the frontend
cd hello-world
npm run build

# Run the Go server — it serves the built frontend from hello-world/dist/
cd ../server
go run .
```

Open http://localhost:3000.

### Run tests

```bash
# Client tests
cd hello-world
npm test

# Server tests
cd server
go test ./...
```

## Project Structure

```
├── hello-world/            # Three.js frontend (Vite)
│   ├── src/
│   │   ├── main.js             # Entry point
│   │   ├── App.js              # Main game loop and orchestration
│   │   ├── Character.js        # Local player character
│   │   ├── CharacterController.js  # Movement, knockback, speed
│   │   ├── CameraController.js # Third-person camera follow
│   │   ├── ChunkManager.js     # Terrain chunk loading/unloading
│   │   ├── TerrainChunk.js     # Individual terrain chunk mesh
│   │   ├── terrain-noise.js    # Simplex noise terrain generation
│   │   ├── terrain-constants.js
│   │   ├── Ground.js           # Ground plane
│   │   ├── NetworkManager.js   # WebSocket client with reconnection
│   │   ├── PlayerManager.js    # Remote player management
│   │   ├── RemotePlayer.js     # Remote player rendering
│   │   ├── InputHandler.js     # Keyboard input
│   │   ├── SceneSetup.js       # Renderer, scene, camera init
│   │   ├── GoalMarker.js       # Goal pickup visual
│   │   ├── GoalCompass.js      # HUD compass pointing to goal
│   │   ├── SpeedBoostManager.js# Speed boost spawning/collection
│   │   ├── SpeedIndicator.js   # HUD speed display
│   │   ├── Scoreboard.js       # HUD scoreboard
│   │   ├── FpsCounter.js       # HUD FPS counter
│   │   ├── JoinScreen.js       # Name/color selection screen
│   │   └── WinnerAnnouncement.js # Goal-reached notification
│   └── index.html
├── server/                 # Go WebSocket server
│   ├── main.go                 # HTTP server, static file serving
│   ├── hub.go                  # Game hub: player sync, goals, collisions
│   ├── client.go               # Per-connection read/write pumps
│   ├── message.go              # JSON message types
│   ├── terrain.go              # Server-side terrain height
│   ├── noise.go                # Simplex noise (matches client)
│   └── validate.go             # Input validation
└── CLAUDE.md
```
