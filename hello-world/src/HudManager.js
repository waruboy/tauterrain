import { FpsCounter } from './FpsCounter.js';
import { Scoreboard } from './Scoreboard.js';
import { GoalCompass } from './GoalCompass.js';
import { SpeedIndicator } from './SpeedIndicator.js';

export class HudManager {
  #fps;
  #scoreboard;
  #compass;
  #speedIndicator;

  constructor() {
    this.#fps = new FpsCounter();
    this.#scoreboard = new Scoreboard();
    this.#compass = new GoalCompass();
    this.#speedIndicator = new SpeedIndicator();
  }

  updateSpeed(terrainMult, boostActive) {
    this.#speedIndicator.update(terrainMult, boostActive);
  }

  updateCompass(pos, rotationY, goalPos) {
    this.#compass.update(pos, rotationY, goalPos);
  }

  updateFps(delta) {
    this.#fps.update(delta);
  }

  updateScores(scores) {
    if (scores) this.#scoreboard.update(scores);
  }

  dispose() {
    this.#fps.dispose();
    this.#scoreboard.dispose();
    this.#compass.dispose();
    this.#speedIndicator.dispose();
  }
}
