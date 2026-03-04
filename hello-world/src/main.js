import * as THREE from 'three';
import { Timer } from 'three/addons/misc/Timer.js';

export class App {
  #scene;
  #camera;
  #renderer;
  #ground;
  #character;
  #timer;
  #keys = {};

  #moveSpeed = 4;
  #turnSpeed = 2;

  constructor() {
    this.#scene = new THREE.Scene();
    this.#camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.#renderer = new THREE.WebGLRenderer();

    this.#renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.#renderer.domElement);

    this.#ground = this.#createGround();
    this.#scene.add(this.#ground);

    this.#character = this.#createCharacter();
    this.#scene.add(this.#character);

    this.#camera.position.set(0, 8, 5);
    this.#camera.lookAt(0, 0, 0);

    this.#timer = new Timer();
    this.#timer.connect(document);

    window.addEventListener('keydown', (e) => { this.#keys[e.key] = true; });
    window.addEventListener('keyup',   (e) => { this.#keys[e.key] = false; });
    window.addEventListener('resize',  () => this.#onResize());
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

  #createCharacter() {
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

  #createGround() {
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
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    return ground;
  }

  #updateCharacter(delta) {
    if (this.#keys['ArrowLeft'])  this.#character.rotation.y += this.#turnSpeed * delta;
    if (this.#keys['ArrowRight']) this.#character.rotation.y -= this.#turnSpeed * delta;

    const dir = this.#character.rotation.y;
    if (this.#keys['ArrowUp']) {
      this.#character.position.x += Math.sin(dir) * this.#moveSpeed * delta;
      this.#character.position.z += Math.cos(dir) * this.#moveSpeed * delta;
    }
    if (this.#keys['ArrowDown']) {
      this.#character.position.x -= Math.sin(dir) * this.#moveSpeed * delta;
      this.#character.position.z -= Math.cos(dir) * this.#moveSpeed * delta;
    }
  }

  #onResize() {
    this.#camera.aspect = window.innerWidth / window.innerHeight;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(window.innerWidth, window.innerHeight);
  }

  get characterPosition() { return this.#character.position; }
  get characterRotationY() { return this.#character.rotation.y; }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.#timer.update();
    const delta = this.#timer.getDelta();
    this.#updateCharacter(delta);
    this.#renderer.render(this.#scene, this.#camera);
  }
}

const app = new App();
app.animate();
