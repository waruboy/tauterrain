import * as THREE from 'three';
import { Timer } from 'three';
import { ChunkManager } from './ChunkManager.js';
import { CameraController } from './CameraController.js';
import { InputHandler } from './InputHandler.js';
import { terrainHeight } from './terrain-noise.js';
import { Character } from './Character.js';

const SKY_COLOR = 0x87ceeb;

// Fog
const FOG_DENSITY = 0.018;

// Lighting
const AMBIENT_INTENSITY = 0.4;
const DIR_INTENSITY     = 1.2;
const DIR_LIGHT_POS     = new THREE.Vector3(50, 80, 30);

// Character
const GROUND_SMOOTHING = 0.001;

export class App {
  #scene;
  #camera;
  #renderer;
  #timer;
  #character;
  #input;
  #cameraController;
  #chunks;

  constructor() {
    this.#scene    = new THREE.Scene();
    this.#camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.#renderer = new THREE.WebGLRenderer();

    this.#renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.#renderer.domElement);

    this.#setupScene();
    window.addEventListener('resize', () => this.#onResize());
  }

  #setupScene() {
    this.#scene.background = new THREE.Color(SKY_COLOR);
    this.#scene.fog = new THREE.FogExp2(SKY_COLOR, FOG_DENSITY);

    this.#setupLights();

    this.#chunks    = new ChunkManager(this.#scene);
    this.#character = new Character();
    this.#scene.add(this.#character.object);

    this.#input            = new InputHandler();
    this.#cameraController = new CameraController(this.#camera);

    this.#timer = new Timer();
    this.#timer.connect(document);
  }

  #setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, AMBIENT_INTENSITY);
    this.#scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, DIR_INTENSITY);
    dirLight.position.copy(DIR_LIGHT_POS);
    this.#scene.add(dirLight);
  }

  #onResize() {
    this.#camera.aspect = window.innerWidth / window.innerHeight;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(window.innerWidth, window.innerHeight);
  }

  #updateCharacter(delta) {
    this.#character.update(delta, this.#input.keys);
    const pos = this.#character.position;
    const groundY = terrainHeight(pos.x, pos.z);
    pos.y += (groundY - pos.y) * (1 - Math.pow(GROUND_SMOOTHING, delta));
    this.#chunks.update(pos.x, pos.z);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.#timer.update();
    const delta = this.#timer.getDelta();
    this.#updateCharacter(delta);
    this.#cameraController.update(this.#character, delta);
    this.#renderer.render(this.#scene, this.#camera);
  }
}
