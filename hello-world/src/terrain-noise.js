import { createNoise2D } from 'simplex-noise';

export function mulberry32(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const SCALE       = 0.04;
const AMPLITUDE   = 5;
const OCTAVES     = 4;
const LACUNARITY  = 2;
const PERSISTENCE = 0.5;

// Default to URL seed so single-player / offline dev works without a server
const urlSeed = (typeof window !== 'undefined')
  ? Number(new URLSearchParams(window.location.search).get('seed')) || 1
  : 1;

let noise2D = createNoise2D(mulberry32(urlSeed));

/**
 * Re-initialise noise with a seed from the server.
 * Call this before any chunks are generated with the new seed.
 */
export function initTerrain(seed) {
  noise2D = createNoise2D(mulberry32(seed));
}

export function terrainHeight(x, z) {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let max = 0;

  for (let i = 0; i < OCTAVES; i++) {
    value += noise2D(x * SCALE * frequency, z * SCALE * frequency) * amplitude;
    max += amplitude;
    amplitude *= PERSISTENCE;
    frequency *= LACUNARITY;
  }

  return (value / max) * AMPLITUDE;
}
