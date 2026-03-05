import * as THREE from 'three';

const CAM_FOLLOW_DIST = 10;
const CAM_HEIGHT      = 14;
const CAM_LOOKAHEAD   = 3;
const CAM_SMOOTHING   = 0.01;

export class CameraController {
  #camera;
  #lookAt = new THREE.Vector3();

  constructor(camera) {
    this.#camera = camera;
  }

  update(character, delta) {
    const pos    = character.position;
    const angle  = character.rotationY;
    const smooth = 1 - Math.pow(CAM_SMOOTHING, delta);

    const target = new THREE.Vector3(
      pos.x - Math.sin(angle) * CAM_FOLLOW_DIST,
      pos.y + CAM_HEIGHT,
      pos.z - Math.cos(angle) * CAM_FOLLOW_DIST,
    );
    this.#camera.position.lerp(target, smooth);

    const lookAtTarget = new THREE.Vector3(
      pos.x + Math.sin(angle) * CAM_LOOKAHEAD,
      pos.y,
      pos.z + Math.cos(angle) * CAM_LOOKAHEAD,
    );
    this.#lookAt.lerp(lookAtTarget, smooth);
    this.#camera.lookAt(this.#lookAt);
  }
}
