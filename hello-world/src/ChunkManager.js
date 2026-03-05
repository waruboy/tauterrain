import { TerrainChunk } from './TerrainChunk.js';

const CHUNK_SIZE = 16;
const RENDER_DISTANCE = 3; // chunks in each direction

export class ChunkManager {
  #scene;
  #loaded = new Map(); // key: "x,z" -> TerrainChunk

  constructor(scene) {
    this.#scene = scene;
  }

  update(playerX, playerZ) {
    const cx = Math.round(playerX / CHUNK_SIZE);
    const cz = Math.round(playerZ / CHUNK_SIZE);

    // Load chunks within render distance
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        const key = `${cx + dx},${cz + dz}`;
        if (!this.#loaded.has(key)) {
          const chunk = new TerrainChunk(cx + dx, cz + dz);
          this.#scene.add(chunk.object);
          this.#loaded.set(key, chunk);
        }
      }
    }

    // Unload chunks outside render distance
    for (const [key, chunk] of this.#loaded) {
      const [kx, kz] = key.split(',').map(Number);
      if (Math.abs(kx - cx) > RENDER_DISTANCE || Math.abs(kz - cz) > RENDER_DISTANCE) {
        this.#scene.remove(chunk.object);
        chunk.object.geometry.dispose();
        this.#loaded.delete(key);
      }
    }
  }
}
