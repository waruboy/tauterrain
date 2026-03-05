import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();

const SCALE = 0.04;  // frequency — lower = broader hills
const AMPLITUDE = 2; // max height in world units

/**
 * Returns the terrain height at world position (x, z).
 * Deterministic: same input always returns the same value.
 */
export function terrainHeight(x, z) {
  return noise2D(x * SCALE, z * SCALE) * AMPLITUDE;
}
