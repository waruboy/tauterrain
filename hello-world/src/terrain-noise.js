import { createNoise2D } from 'simplex-noise';

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const seed = (typeof window !== 'undefined')
  ? Number(new URLSearchParams(window.location.search).get('seed')) || 1
  : 1;
const noise2D = createNoise2D(mulberry32(seed));

const SCALE     = 0.04; // base frequency
const AMPLITUDE = 4;    // max height in world units
const OCTAVES   = 4;    // number of noise layers
const LACUNARITY = 2;   // frequency multiplier per octave
const PERSISTENCE = 0.5; // amplitude multiplier per octave

/**
 * Returns the terrain height at world position (x, z).
 * Uses fractional Brownian motion (FBM) for natural-looking terrain.
 */
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
