import * as THREE from 'three';
import { mulberry32, terrainHeight } from './terrain-noise.js';

const COUNT = 15;
const SPAWN_RANGE = 60;
const COLLECT_RADIUS_SQ = 4; // 2^2
const BOOST_DURATION = 5;
const RESPAWN_DELAY = 15;
const ORB_COLOR = 0x00ffff;
const ORB_RADIUS = 0.4;

export class SpeedBoostManager {
  #scene;
  #orbs = [];       // { mesh, x, z, baseY, active, respawnTimer }
  #boostTimer = 0;
  #elapsed = 0;

  constructor(scene, seed) {
    this.#scene = scene;
    this.#spawn(seed);
  }

  #spawn(seed) {
    const rng = mulberry32(seed + 9999);
    const geo = new THREE.SphereGeometry(ORB_RADIUS, 12, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: ORB_COLOR,
      transparent: true,
      opacity: 0.7,
      fog: false,
    });

    for (let i = 0; i < COUNT; i++) {
      const x = (rng() - 0.5) * SPAWN_RANGE * 2;
      const z = (rng() - 0.5) * SPAWN_RANGE * 2;
      const baseY = terrainHeight(x, z) + 1;

      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.position.set(x, baseY, z);
      this.#scene.add(mesh);

      this.#orbs.push({ mesh, x, z, baseY, active: true, respawnTimer: 0 });
    }
  }

  get boostActive() {
    return this.#boostTimer > 0;
  }

  update(playerPos, delta) {
    this.#elapsed += delta;

    if (this.#boostTimer > 0) this.#boostTimer -= delta;

    const px = playerPos.x;
    const pz = playerPos.z;

    for (const orb of this.#orbs) {
      if (orb.active) {
        // Animate: bob + spin
        orb.mesh.position.y = orb.baseY + 0.3 * Math.sin(this.#elapsed * 2 + orb.x);
        orb.mesh.rotation.y = this.#elapsed * 1.5;

        // Check collection
        const dx = orb.x - px;
        const dz = orb.z - pz;
        if (dx * dx + dz * dz < COLLECT_RADIUS_SQ) {
          orb.active = false;
          orb.respawnTimer = RESPAWN_DELAY;
          this.#scene.remove(orb.mesh);
          this.#boostTimer = BOOST_DURATION;
        }
      } else {
        orb.respawnTimer -= delta;
        if (orb.respawnTimer <= 0) {
          orb.active = true;
          orb.baseY = terrainHeight(orb.x, orb.z) + 1;
          orb.mesh.position.set(orb.x, orb.baseY, orb.z);
          this.#scene.add(orb.mesh);
        }
      }
    }

    return this.#boostTimer > 0;
  }

  reset(seed) {
    this.dispose();
    this.#orbs = [];
    this.#boostTimer = 0;
    this.#elapsed = 0;
    this.#spawn(seed);
  }

  dispose() {
    for (const orb of this.#orbs) {
      if (orb.active) this.#scene.remove(orb.mesh);
      orb.mesh.geometry.dispose();
      orb.mesh.material.dispose();
    }
  }
}
