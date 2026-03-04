import * as THREE from 'three';

export class Ground {
  #mesh;

  constructor() {
    this.#mesh = this.#build();
  }

  get object() { return this.#mesh; }

  #build() {
    const size = 64;
    const tileCount = 8;
    const tileSize = size / tileCount;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    for (let row = 0; row < tileCount; row++) {
      for (let col = 0; col < tileCount; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#888888' : '#444444';
        ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    const geometry = new THREE.PlaneGeometry(20, 20);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }
}
