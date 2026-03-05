import * as THREE from 'three';
import { Timer } from 'three';
import { ChunkManager } from './ChunkManager.js';
import { CameraController } from './CameraController.js';
import { InputHandler } from './InputHandler.js';
import { terrainHeight, initTerrain } from './terrain-noise.js';
import { Character } from './Character.js';
import { NetworkManager } from './NetworkManager.js';
import { PlayerManager } from './PlayerManager.js';
import { JoinScreen } from './JoinScreen.js';

const SKY_COLOR = 0x87ceeb;

// Fog
const FOG_DENSITY = 0.018;

// Lighting
const AMBIENT_INTENSITY = 0.4;
const DIR_INTENSITY     = 1.2;
const DIR_LIGHT_POS     = new THREE.Vector3(50, 80, 30);

// Character
const GROUND_SMOOTHING      = 0.001;
const RECONCILE_SMOOTHING   = 0.0001; // how fast to blend toward server-authoritative Y
const RECONCILE_SNAP_THRESH = 2.0;    // units — snap instantly if drift exceeds this

export class App {
  #scene;
  #camera;
  #renderer;
  #timer;
  #character;
  #input;
  #cameraController;
  #chunks;

  #onResizeBound;
  #rafId;
  #running = false;
  #network;
  #players;
  #localId = null;
  #joinScreen;
  #serverY = null;

  constructor() {
    this.#scene    = new THREE.Scene();
    this.#camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.#renderer = new THREE.WebGLRenderer();

    this.#renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.#renderer.domElement);

    this.#setupScene();
    this.#onResizeBound = () => this.#onResize();
    window.addEventListener('resize', this.#onResizeBound);
  }

  dispose() {
    this.#running = false;
    cancelAnimationFrame(this.#rafId);
    window.removeEventListener('resize', this.#onResizeBound);
    this.#input.dispose();
    this.#network.dispose();
    this.#players.dispose();
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
    this.#players    = new PlayerManager(this.#scene);
    this.#network    = new NetworkManager();
    this.#joinScreen = new JoinScreen((name, color) => {
      this.#network.sendJoin(name, color);
    });

    this.#network
      .on('welcome', ({ id, seed }) => {
        this.#localId = id;
        initTerrain(seed);
        this.#chunks.reset();
        this.#joinScreen.dismiss();
        console.log(`connected as ${id}, seed: ${seed}`);
      })
      .on('world-state',    ({ players }) => this.#players.applyWorldState(players, this.#localId))
      .on('player-joined',  ({ id, color }) => this.#players.add(id, color))
      .on('player-left',    ({ id }) => this.#players.remove(id))
      .on('players-update', ({ players }) => {
        const local = players.find(p => p.id === this.#localId);
        if (local) this.#serverY = local.y;
        this.#players.applyUpdates(players);
      })
      .on('error',          ({ message }) => this.#joinScreen.showError(message));

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

    // Predict Y locally from terrain for immediate feedback
    const predictedY = terrainHeight(pos.x, pos.z);
    pos.y += (predictedY - pos.y) * (1 - Math.pow(GROUND_SMOOTHING, delta));

    // Reconcile with server-authoritative Y when available
    if (this.#serverY !== null) {
      const drift = Math.abs(this.#serverY - pos.y);
      if (drift > RECONCILE_SNAP_THRESH) {
        pos.y = this.#serverY; // large drift — snap
      } else {
        pos.y += (this.#serverY - pos.y) * (1 - Math.pow(RECONCILE_SMOOTHING, delta));
      }
    }

    this.#chunks.update(pos.x, pos.z);
    this.#network.queueUpdate(pos.x, pos.z, this.#character.rotationY);
  }

  animate() {
    this.#running = true;
    this.#rafId = requestAnimationFrame(() => this.animate());
    this.#timer.update();
    const delta = this.#timer.getDelta();
    this.#updateCharacter(delta);
    this.#cameraController.update(this.#character, delta);
    this.#players.update(delta);
    this.#renderer.render(this.#scene, this.#camera);
  }
}
