import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class App {
  #scene;
  #camera;
  #renderer;
  #cube;
  #controls;

  constructor() {
    this.#scene = new THREE.Scene();
    this.#camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.#renderer = new THREE.WebGLRenderer();

    this.#renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.#renderer.domElement);

    this.#cube = this.#createCube();
    this.#scene.add(this.#cube);

    this.#camera.position.z = 5;

    this.#controls = new OrbitControls(this.#camera, this.#renderer.domElement);
    this.#controls.listenToKeyEvents(window);

    window.addEventListener('resize', () => this.#onResize());
  }

  #createCube() {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    return new THREE.Mesh(geometry, material);
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
