import { terrainHeight } from './terrain-noise.js';

const GROUND_SMOOTHING      = 0.001;
const RECONCILE_SMOOTHING   = 0.0001;
const RECONCILE_SNAP_THRESH = 2.0;

export function terrainSpeedMultiplier(height) {
  if (height < -0.5) return 0.5;
  if (height > 2.5) return 0.6;
  return 1.0;
}

const KNOCK_FRICTION = 0.05;

export class CharacterController {
  #character;
  #input;
  #chunks;
  #network;
  #knockVx = 0;
  #knockVz = 0;

  constructor(character, input, chunks, network) {
    this.#character = character;
    this.#input     = input;
    this.#chunks    = chunks;
    this.#network   = network;
  }

  applyKnockback(dx, dz, strength) {
    this.#knockVx = dx * strength;
    this.#knockVz = dz * strength;
  }

  update(delta, serverY) {
    this.#character.update(delta, this.#input.keys);
    const pos = this.#character.position;

    // Apply knockback velocity
    if (this.#knockVx !== 0 || this.#knockVz !== 0) {
      pos.x += this.#knockVx * delta;
      pos.z += this.#knockVz * delta;
      const decay = Math.pow(KNOCK_FRICTION, delta);
      this.#knockVx *= decay;
      this.#knockVz *= decay;
      // Zero out when negligible
      if (Math.abs(this.#knockVx) < 0.01 && Math.abs(this.#knockVz) < 0.01) {
        this.#knockVx = 0;
        this.#knockVz = 0;
      }
    }

    const predictedY = terrainHeight(pos.x, pos.z);
    pos.y += (predictedY - pos.y) * (1 - Math.pow(GROUND_SMOOTHING, delta));

    if (serverY !== null) {
      const drift = Math.abs(serverY - pos.y);
      if (drift > RECONCILE_SNAP_THRESH) {
        pos.y = serverY;
      } else {
        pos.y += (serverY - pos.y) * (1 - Math.pow(RECONCILE_SMOOTHING, delta));
      }
    }

    this.#chunks.update(pos.x, pos.z);
    this.#network.queueUpdate(pos.x, pos.z, this.#character.rotationY);
  }
}
