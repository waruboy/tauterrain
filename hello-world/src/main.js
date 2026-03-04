import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class App {
  #scene;
  #camera;
  #renderer;
  #ground;
  #controls;

  constructor() {
    this.#scene = new THREE.Scene();
    this.#camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.#renderer = new THREE.WebGLRenderer();

    this.#renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.#renderer.domElement);

    this.#ground = this.#createGround();
    this.#scene.add(this.#ground);

    this.#camera.position.z = 5;

    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
    this.#controls.listenToKeyEvents(window);

    window.addEventListener('resize', () => this.#onResize());
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

  #onResize() {
    this.#camera.aspect = window.innerWidth / window.innerHeight;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.#controls.update();
    this.#renderer.render(this.#scene, this.#camera);
  }
}

const app = new App();
app.animate();
