import * as THREE from 'three';
import { terrainHeight } from './terrain-noise.js';

const CHUNK_SIZE = 16;  // world units per chunk
const SEGMENTS = 16;    // vertex subdivisions per chunk

export class TerrainChunk {
  #mesh;

  constructor(chunkX, chunkZ) {
    this.#mesh = this.#build(chunkX, chunkZ);
  }

  get object() { return this.#mesh; }

  #build(chunkX, chunkZ) {
    const geometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, SEGMENTS, SEGMENTS);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const wx = positions.getX(i) + chunkX * CHUNK_SIZE;
      const wz = positions.getZ(i) + chunkZ * CHUNK_SIZE;
      positions.setY(i, terrainHeight(wx, wz));
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({ color: 0x4a7c4e });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(chunkX * CHUNK_SIZE, 0, chunkZ * CHUNK_SIZE);
    return mesh;
  }
}
