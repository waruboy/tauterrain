import { Timer } from 'three';
import { SceneSetup } from './SceneSetup.js';
import { ChunkManager } from './ChunkManager.js';
import { CameraController } from './CameraController.js';
import { InputHandler } from './InputHandler.js';
import { initTerrain, terrainHeight } from './terrain-noise.js';
import { Character } from './Character.js';
import { NetworkManager } from './NetworkManager.js';
import { PlayerManager } from './PlayerManager.js';
import { JoinScreen } from './JoinScreen.js';
import { CharacterController, terrainSpeedMultiplier } from './CharacterController.js';
import { GoalMarker } from './GoalMarker.js';
import { WinnerAnnouncement } from './WinnerAnnouncement.js';
import { FpsCounter } from './FpsCounter.js';
import { Scoreboard } from './Scoreboard.js';
import { GoalCompass } from './GoalCompass.js';
import { SpeedBoostManager } from './SpeedBoostManager.js';
import { SpeedIndicator } from './SpeedIndicator.js';


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
  #compass;
  #boosts = null;
  #speedIndicator;
  #goalPos = null;
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
        if (this.#boosts) this.#boosts.reset(seed);
        else this.#boosts = new SpeedBoostManager(this.#sceneSetup.scene, seed);
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
        this.#goalPos = { x, y, z };
      })
      .on('goal-reached', ({ winnerId, winnerName, scores }) => {
        if (this.#goalMarker) {
          this.#sceneSetup.scene.remove(this.#goalMarker.object);
          this.#goalMarker.dispose();
          this.#goalMarker = null;
        }
        this.#goalPos = null;
        WinnerAnnouncement.show(winnerName, winnerId === this.#localId);
        if (scores) this.#scoreboard.update(scores);
      });

    this.#fps        = new FpsCounter();
    this.#scoreboard = new Scoreboard();
    this.#compass        = new GoalCompass();
    this.#speedIndicator = new SpeedIndicator();
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
    this.#compass.dispose();
    this.#speedIndicator.dispose();
    if (this.#boosts) this.#boosts.dispose();
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
    const pos = this.#character.position;
    const height = terrainHeight(pos.x, pos.z);
    const tMult = terrainSpeedMultiplier(height);
    const boostActive = this.#boosts ? this.#boosts.update(pos, delta) : false;
    this.#character.speedMultiplier = tMult * (boostActive ? 1.8 : 1.0);
    this.#speedIndicator.update(tMult, boostActive);
    this.#characterController.update(delta, this.#serverY);
    this.#cameraController.update(this.#character, delta);
    this.#players.update(delta);
    this.#goalMarker?.update(delta);
    this.#compass.update(pos, this.#character.rotationY, this.#goalPos);
    this.#fps.update(delta);
    this.#sceneSetup.renderer.render(this.#sceneSetup.scene, this.#sceneSetup.camera);
  }
}
