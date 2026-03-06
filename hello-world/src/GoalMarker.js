import * as THREE from 'three';

const PILLAR_HEIGHT = 30;
const PILLAR_RADIUS = 0.5;
const BEACON_COLOR  = 0xffdd00;
const RING_RADIUS   = 3;

export class GoalMarker {
  #group;
  #ring;
  #elapsed = 0;

  constructor() {
    this.#group = new THREE.Group();

    const pillarGeo = new THREE.CylinderGeometry(PILLAR_RADIUS, PILLAR_RADIUS, PILLAR_HEIGHT, 8);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: BEACON_COLOR,
      transparent: true,
      opacity: 0.6,
      fog: false,
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.y = PILLAR_HEIGHT / 2;
    this.#group.add(pillar);

    const ringGeo = new THREE.RingGeometry(RING_RADIUS - 0.1, RING_RADIUS, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: BEACON_COLOR,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    this.#ring = new THREE.Mesh(ringGeo, ringMat);
    this.#ring.rotation.x = -Math.PI / 2;
    this.#ring.position.y = 0.1;
    this.#group.add(this.#ring);
  }

  get object() { return this.#group; }

  setPosition(x, y, z) {
    this.#group.position.set(x, y, z);
  }

  update(delta) {
    this.#elapsed += delta;
    const scale = 1 + 0.1 * Math.sin(this.#elapsed * 3);
    this.#ring.scale.set(scale, scale, 1);
  }

  dispose() {
    this.#group.traverse((child) => {
      if (child.isMesh) {
        child.geometry.dispose();
        child.material.dispose();
      }
    });
  }
}
