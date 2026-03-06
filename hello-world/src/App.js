import { Timer } from 'three';
import { SceneSetup } from './SceneSetup.js';
import { ChunkManager } from './ChunkManager.js';
import { CameraController } from './CameraController.js';
import { InputHandler } from './InputHandler.js';
import { initTerrain } from './terrain-noise.js';
import { Character } from './Character.js';
import { NetworkManager } from './NetworkManager.js';
import { PlayerManager } from './PlayerManager.js';
import { JoinScreen } from './JoinScreen.js';
import { CharacterController } from './CharacterController.js';
import { GoalMarker } from './GoalMarker.js';
import { WinnerAnnouncement } from './WinnerAnnouncement.js';
import { FpsCounter } from './FpsCounter.js';
import { Scoreboard } from './Scoreboard.js';

export class App {
  #sceneSetup;
  #timer;
  #character;
  #characterController;
  #input;
  #cameraController;
  #chunks;
  #network;
  #players;
  #localId = null;
  #joinScreen;
  #serverY = null;
  #goalMarker = null;
  #fps;
  #scoreboard;
  #rafId;
  #running = false;

  constructor() {
    this.#sceneSetup = new SceneSetup();
    const { scene, camera, renderer } = this.#sceneSetup;

    this.#chunks    = new ChunkManager(scene);
    this.#character = new Character();
    scene.add(this.#character.object);

    this.#input            = new InputHandler();
    this.#cameraController = new CameraController(camera);
    this.#players    = new PlayerManager(scene);
    this.#network    = new NetworkManager();
    this.#characterController = new CharacterController(
      this.#character, this.#input, this.#chunks, this.#network
    );

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
      .on('world-state',    ({ players, scores }) => {
        this.#players.applyWorldState(players, this.#localId);
        if (scores) this.#scoreboard.update(scores);
      })
      .on('player-joined',  ({ id, color }) => this.#players.add(id, color))
      .on('player-left',    ({ id }) => this.#players.remove(id))
      .on('players-update', ({ players }) => {
        const local = players.find(p => p.id === this.#localId);
        if (local) this.#serverY = local.y;
        this.#players.applyUpdates(players);
      })
      .on('error', ({ message }) => this.#joinScreen.showError(message))
      .on('goal-spawn', ({ x, y, z }) => {
        if (!this.#goalMarker) {
          this.#goalMarker = new GoalMarker();
          this.#sceneSetup.scene.add(this.#goalMarker.object);
        }
        this.#goalMarker.setPosition(x, y, z);
      })
      .on('goal-reached', ({ winnerId, winnerName, scores }) => {
        if (this.#goalMarker) {
          this.#sceneSetup.scene.remove(this.#goalMarker.object);
          this.#goalMarker.dispose();
          this.#goalMarker = null;
        }
        WinnerAnnouncement.show(winnerName, winnerId === this.#localId);
        if (scores) this.#scoreboard.update(scores);
      });

    this.#fps        = new FpsCounter();
    this.#scoreboard = new Scoreboard();
    this.#timer = new Timer();
    this.#timer.connect(document);
  }

  dispose() {
    this.#running = false;
    cancelAnimationFrame(this.#rafId);
    this.#sceneSetup.dispose();
    this.#input.dispose();
    this.#network.dispose();
    this.#players.dispose();
    this.#fps.dispose();
    this.#scoreboard.dispose();
    if (this.#goalMarker) {
      this.#goalMarker.dispose();
      this.#goalMarker = null;
    }
  }

  animate() {
    this.#running = true;
    this.#rafId = requestAnimationFrame(() => this.animate());
    this.#timer.update();
    const delta = this.#timer.getDelta();
    this.#characterController.update(delta, this.#serverY);
    this.#cameraController.update(this.#character, delta);
    this.#players.update(delta);
    this.#goalMarker?.update(delta);
    this.#fps.update(delta);
    this.#sceneSetup.renderer.render(this.#sceneSetup.scene, this.#sceneSetup.camera);
  }
}
