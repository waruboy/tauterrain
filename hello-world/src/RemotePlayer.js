import * as THREE from 'three';

const LERP_SMOOTHING = 0.001; // match camera feel

export class RemotePlayer {
  #group;
  #targetPos = new THREE.Vector3();
  #targetRY  = 0;

  #labelSprite = null;

  constructor(color, name) {
    this.#group = this.#build(color);
    if (name) this.#createLabel(name);
  }

  get object() { return this.#group; }

  setTarget(x, y, z, ry) {
    this.#targetPos.set(x, y, z);
    this.#targetRY = ry;
  }

  update(delta) {
    const smooth = 1 - Math.pow(LERP_SMOOTHING, delta);
    this.#group.position.lerp(this.#targetPos, smooth);

    const current = this.#group.rotation.y;
    const target  = this.#targetRY;
    // shortest-path rotation lerp
    let diff = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
    this.#group.rotation.y += diff * smooth;
  }

  dispose() {
    this.#group.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry.dispose();
        obj.material.dispose();
      }
    });
    if (this.#labelSprite) {
      this.#labelSprite.material.map.dispose();
      this.#labelSprite.material.dispose();
    }
  }

  #createLabel(name) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 48;
    ctx.font = `bold ${fontSize}px sans-serif`;
    const textWidth = ctx.measureText(name).width;
    const padding = 20;
    canvas.width = textWidth + padding * 2;
    canvas.height = fontSize + padding;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    const r = 12;
    const w = canvas.width, h = canvas.height;
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.lineTo(w - r, 0); ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r); ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h); ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.fill();

    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(material);
    const aspect = canvas.width / canvas.height;
    const height = 0.4;
    sprite.scale.set(height * aspect, height, 1);
    sprite.position.y = 3.0;
    this.#labelSprite = sprite;
    this.#group.add(sprite);
  }

  #build(color) {
    const mat    = new THREE.MeshBasicMaterial({ color });
    const capMat = new THREE.MeshBasicMaterial({ color: 0x222266 });

    const body     = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.75), mat);
    body.position.y = 0.75;

    const head     = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), mat);
    head.position.y = 1.875;

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), mat);
    rightArm.position.set(0.65, 0.75, 0);
    rightArm.rotation.z = -Math.PI / 4;

    const leftArm  = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1, 0.3), mat);
    leftArm.position.set(-0.65, 0.75, 0);

    const capCrown = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.25, 0.85), capMat);
    capCrown.position.set(0, 2.375, 0);

    const capBrim  = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.4), capMat);
    capBrim.position.set(0, 2.25, 0.575);

    const group = new THREE.Group();
    group.add(body, head, rightArm, leftArm, capCrown, capBrim);
    return group;
  }
}
