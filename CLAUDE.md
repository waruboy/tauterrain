# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This workspace contains a `hello-world/` subdirectory — a Three.js 3D scene built with Vite. All commands below should be run from within `hello-world/`.

## Commands

```bash
# Install dependencies
cd hello-world && npm install

# Start dev server (auto-opens browser at http://localhost:5200)
npm run dev

# Build for production (outputs to hello-world/dist/, includes sourcemaps)
npm run build

# Preview production build
npm run preview
```

## Architecture

- `index.html` — entry point; loads `src/main.js` as an ES module
- `src/main.js` — all scene logic: sets up a Three.js WebGL renderer, scene, perspective camera, and a green wireframe rotating cube using `requestAnimationFrame`
- `vite.config.js` — dev server on port 5200, production builds include sourcemaps

The project uses ES modules (`"type": "module"` in package.json). Three.js is imported as `import * as THREE from 'three'`.
