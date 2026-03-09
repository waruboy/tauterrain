import * as THREE from 'three';

export class Character {
  #group;

  #moveSpeed = 6;
  #turnSpeed = 2;
  #speedMultiplier = 1;

  constructor() {
    this.#group = this.#build();
  }

  get object()    { return this.#group; }
  get position()  { return this.#group.position; }
  get rotationY() { return this.#group.rotation.y; }
  set speedMultiplier(v) { this.#speedMultiplier = v; }

  setColor(color) {
    this.#group.traverse((obj) => {
      if (obj.isMesh && !obj.userData.cap) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => { m.color.set(color); });
        } else {
          obj.material.color.set(color);
        }
      }
    });
  }

  update(delta, keys) {
    if (keys['a'])  this.#group.rotation.y += this.#turnSpeed * delta;
    if (keys['d']) this.#group.rotation.y -= this.#turnSpeed * delta;

    const dir = this.#group.rotation.y;
    if (keys['w']) {
      this.#group.position.x += Math.sin(dir) * this.#moveSpeed * this.#speedMultiplier * delta;
      this.#group.position.z += Math.cos(dir) * this.#moveSpeed * this.#speedMultiplier * delta;
    }
    if (keys['s']) {
      this.#group.position.x -= Math.sin(dir) * this.#moveSpeed * this.#speedMultiplier * delta;
      this.#group.position.z -= Math.cos(dir) * this.#moveSpeed * this.#speedMultiplier * delta;
    }
  }

  #sideMaterials() {
    return [
      new THREE.MeshBasicMaterial({ color: 0xff4444 }), // right  (+x)
      new THREE.MeshBasicMaterial({ color: 0x4444ff }), // left   (-x)
      new THREE.MeshBasicMaterial({ color: 0xffff44 }), // top    (+y)
      new THREE.MeshBasicMaterial({ color: 0x444444 }), // bottom (-y)
      new THREE.MeshBasicMaterial({ color: 0x44ff44 }), // front  (+z)
      new THREE.MeshBasicMaterial({ color: 0xff8800 }), // back   (-z)
    ];
  }

  #build() {
    const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.75), this.#sideMaterials());
    body.position.y = 0.75;

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), this.#sideMaterials());
    head.position.y = 1.875;

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), this.#sideMaterials());
    rightArm.position.set(0.65, 0.75, 0);
    rightArm.rotation.z = -Math.PI / 4;

    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), this.#sideMaterials());
    leftArm.position.set(-0.65, 0.75, 0);

    const capMaterial = new THREE.MeshBasicMaterial({ color: 0x222266 });

    const capCrown = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.25, 0.85), capMaterial);
    capCrown.position.set(0, 2.375, 0);
    capCrown.userData.cap = true;

    const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.4), capMaterial);
    capBrim.position.set(0, 2.25, 0.575);
    capBrim.userData.cap = true;

    const group = new THREE.Group();
    group.add(body);
    group.add(head);
    group.add(rightArm);
    group.add(leftArm);
    group.add(capCrown);
    group.add(capBrim);
    return group;
  }
}
