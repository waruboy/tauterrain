import * as THREE from 'three';

export class Character {
  #group;

  #moveSpeed = 4;
  #turnSpeed = 2;

  constructor() {
    this.#group = this.#build();
  }

  get object()    { return this.#group; }
  get position()  { return this.#group.position; }
  get rotationY() { return this.#group.rotation.y; }

  update(delta, keys) {
    if (keys['ArrowLeft'])  this.#group.rotation.y += this.#turnSpeed * delta;
    if (keys['ArrowRight']) this.#group.rotation.y -= this.#turnSpeed * delta;

    const dir = this.#group.rotation.y;
    if (keys['ArrowUp']) {
      this.#group.position.x += Math.sin(dir) * this.#moveSpeed * delta;
      this.#group.position.z += Math.cos(dir) * this.#moveSpeed * delta;
    }
    if (keys['ArrowDown']) {
      this.#group.position.x -= Math.sin(dir) * this.#moveSpeed * delta;
      this.#group.position.z -= Math.cos(dir) * this.#moveSpeed * delta;
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

    const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.4), capMaterial);
    capBrim.position.set(0, 2.25, 0.575);

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
