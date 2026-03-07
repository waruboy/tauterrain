import { GoalMarker } from './GoalMarker.js';
import { WinnerAnnouncement } from './WinnerAnnouncement.js';

export class GoalManager {
  #marker = null;
  #pos = null;
  #scene;

  constructor(scene) {
    this.#scene = scene;
  }

  get position() {
    return this.#pos;
  }

  spawn(x, y, z) {
    if (!this.#marker) {
      this.#marker = new GoalMarker();
      this.#scene.add(this.#marker.object);
    }
    this.#marker.setPosition(x, y, z);
    this.#pos = { x, y, z };
  }

  reached(winnerName, isLocal, scores) {
    if (this.#marker) {
      this.#scene.remove(this.#marker.object);
      this.#marker.dispose();
      this.#marker = null;
    }
    this.#pos = null;
    WinnerAnnouncement.show(winnerName, isLocal);
    return scores;
  }

  update(delta) {
    this.#marker?.update(delta);
  }

  dispose() {
    if (this.#marker) {
      this.#marker.dispose();
      this.#marker = null;
    }
  }
}
