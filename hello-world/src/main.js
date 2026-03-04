import * as THREE from 'three';

class App {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.cube = this._createCube();
    this.scene.add(this.cube);

    this.radius = 5;
    this.theta = 0;
    this.phi = Math.PI / 2;
    this.orbitSpeed = 0.02;

    this.keys = {};
    window.addEventListener('keydown', (e) => { this.keys[e.key] = true; });
    window.addEventListener('keyup',   (e) => { this.keys[e.key] = false; });
    window.addEventListener('resize',  () => this._onResize());
  }

  _createCube() {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    return new THREE.Mesh(geometry, material);
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  _updateCamera() {
    if (this.keys['ArrowLeft'])  this.theta -= this.orbitSpeed;
    if (this.keys['ArrowRight']) this.theta += this.orbitSpeed;
    if (this.keys['ArrowUp'])    this.phi = Math.max(0.1, this.phi - this.orbitSpeed);
    if (this.keys['ArrowDown'])  this.phi = Math.min(Math.PI - 0.1, this.phi + this.orbitSpeed);

    this.camera.position.set(
      this.radius * Math.sin(this.phi) * Math.sin(this.theta),
      this.radius * Math.cos(this.phi),
      this.radius * Math.sin(this.phi) * Math.cos(this.theta),
    );
    this.camera.lookAt(0, 0, 0);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this._updateCamera();
    this.renderer.render(this.scene, this.camera);
  }
}

const app = new App();
app.animate();
