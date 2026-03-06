import * as THREE from 'three';

const SKY_COLOR      = 0x87ceeb;
const FOG_DENSITY    = 0.018;
const AMBIENT_INTENSITY = 0.4;
const DIR_INTENSITY     = 1.2;
const DIR_LIGHT_POS     = new THREE.Vector3(50, 80, 30);

export class SceneSetup {
  scene;
  camera;
  renderer;

  #onResizeBound;

  constructor() {
    this.scene    = new THREE.Scene();
    this.camera   = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(SKY_COLOR);
    this.scene.fog = new THREE.FogExp2(SKY_COLOR, FOG_DENSITY);

    const ambientLight = new THREE.AmbientLight(0xffffff, AMBIENT_INTENSITY);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, DIR_INTENSITY);
    dirLight.position.copy(DIR_LIGHT_POS);
    this.scene.add(dirLight);

    this.#onResizeBound = () => this.#onResize();
    window.addEventListener('resize', this.#onResizeBound);
  }

  #onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    window.removeEventListener('resize', this.#onResizeBound);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
