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
