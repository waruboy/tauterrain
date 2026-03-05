import { TerrainChunk } from './TerrainChunk.js';
import { CHUNK_SIZE } from './terrain-constants.js';
const LOAD_DISTANCE     = 3;
const UNLOAD_DISTANCE   = 4; // hysteresis — prevents boundary thrashing
const LOAD_DIST_SQ   = LOAD_DISTANCE   * LOAD_DISTANCE;
const UNLOAD_DIST_SQ = UNLOAD_DISTANCE * UNLOAD_DISTANCE;

export class ChunkManager {
  #scene;
  #loaded = new Map(); // key: "x,z" -> TerrainChunk

  constructor(scene) {
    this.#scene = scene;
  }

  reset() {
    for (const [key, chunk] of this.#loaded) {
      this.#scene.remove(chunk.object);
      chunk.object.geometry.dispose();
      this.#loaded.delete(key);
    }
  }

  update(playerX, playerZ) {
    const cx = Math.floor(playerX / CHUNK_SIZE);
    const cz = Math.floor(playerZ / CHUNK_SIZE);

    // Load chunks within circular radius
    for (let dx = -LOAD_DISTANCE; dx <= LOAD_DISTANCE; dx++) {
      for (let dz = -LOAD_DISTANCE; dz <= LOAD_DISTANCE; dz++) {
        if (dx * dx + dz * dz > LOAD_DIST_SQ) continue;
        const key = `${cx + dx},${cz + dz}`;
        if (!this.#loaded.has(key)) {
          const chunk = new TerrainChunk(cx + dx, cz + dz);
          this.#scene.add(chunk.object);
          this.#loaded.set(key, chunk);
        }
      }
    }

    // Unload chunks outside unload radius (hysteresis)
    for (const [key, chunk] of this.#loaded) {
      const [kx, kz] = key.split(',').map(Number);
      const dx = kx - cx;
      const dz = kz - cz;
      if (dx * dx + dz * dz > UNLOAD_DIST_SQ) {
        this.#scene.remove(chunk.object);
        chunk.object.geometry.dispose();
        this.#loaded.delete(key);
      }
    }
  }
}
