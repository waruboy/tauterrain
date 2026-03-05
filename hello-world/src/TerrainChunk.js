import * as THREE from 'three';
import { terrainHeight } from './terrain-noise.js';
import { CHUNK_SIZE } from './terrain-constants.js';
const SEGMENTS   = 16;

const SAND  = new THREE.Color(0xd4c27a);
const GRASS = new THREE.Color(0x4a7c4e);
const ROCK  = new THREE.Color(0x7a7060);
const SNOW  = new THREE.Color(0xeeeeee);

const SAND_MAX   = -0.5; // below this → sand
const ROCK_START =  2.5; // above this → rock/snow transition
const SNOW_RANGE =  1.5; // height units over which rock blends into snow

function heightColor(y, target) {
  if (y < SAND_MAX)    return target.copy(SAND);
  if (y < ROCK_START)  return target.lerpColors(GRASS, ROCK, (y - SAND_MAX) / (ROCK_START - SAND_MAX));
  return target.lerpColors(ROCK, SNOW, Math.min((y - ROCK_START) / SNOW_RANGE, 1));
}

const sharedMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });

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
    const colors = new Float32Array(positions.count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < positions.count; i++) {
      const wx = positions.getX(i) + chunkX * CHUNK_SIZE;
      const wz = positions.getZ(i) + chunkZ * CHUNK_SIZE;
      const y = terrainHeight(wx, wz);
      positions.setY(i, y);
      heightColor(y, color);
      colors[i * 3]     = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    positions.needsUpdate = true;
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, sharedMaterial);
    mesh.position.set(chunkX * CHUNK_SIZE, 0, chunkZ * CHUNK_SIZE);
    return mesh;
  }
}
