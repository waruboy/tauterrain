import * as THREE from 'three';
import { Timer } from 'three';
import { Ground } from './Ground.js';
import { Character } from './Character.js';

export class App {
  #scene;
  #camera;
  #renderer;
  #timer;
  #character;
  #keys = {};
  #lookAt = new THREE.Vector3();

  constructor() {
    this.#scene = new THREE.Scene();
    this.#camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.#renderer = new THREE.WebGLRenderer();

    this.#renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.#renderer.domElement);

    this.#scene.add(new Ground().object);

    this.#character = new Character();
    this.#scene.add(this.#character.object);

    this.#camera.position.set(0, 8, 5);
    this.#camera.lookAt(0, 0, 0);

    this.#timer = new Timer();
    this.#timer.connect(document);

    window.addEventListener('keydown', (e) => { this.#keys[e.key] = true; });
    window.addEventListener('keyup',   (e) => { this.#keys[e.key] = false; });
    window.addEventListener('resize',  () => this.#onResize());
  }

  #onResize() {
    this.#camera.aspect = window.innerWidth / window.innerHeight;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.#timer.update();
    const delta = this.#timer.getDelta();
    this.#character.update(delta, this.#keys);

    const pos = this.#character.position;
    const angle = this.#character.rotationY;
    const target = new THREE.Vector3(
      pos.x - Math.sin(angle) * 5,
      pos.y + 8,
      pos.z - Math.cos(angle) * 5,
    );
    this.#camera.position.lerp(target, 1 - Math.pow(0.01, delta));
    const lookAtTarget = new THREE.Vector3(
      pos.x + Math.sin(angle) * 3,
      pos.y,
      pos.z + Math.cos(angle) * 3,
    );
    this.#lookAt.lerp(lookAtTarget, 1 - Math.pow(0.01, delta));
    this.#camera.lookAt(this.#lookAt);

    this.#renderer.render(this.#scene, this.#camera);
  }
}
