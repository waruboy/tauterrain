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
import { SpeedBoostManager } from './SpeedBoostManager.js';
import { GoalManager } from './GoalManager.js';
import { HudManager } from './HudManager.js';


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
  #hud;
  #goals;
  #boosts = null;
  #rafId;
  #running = false;
  #pendingColor = null;

  constructor() {
    this.#sceneSetup = new SceneSetup();
    const { scene, camera } = this.#sceneSetup;

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
      this.#pendingColor = color;
      this.#network.sendJoin(name, color);
    });

    this.#goals = new GoalManager(scene);
    this.#hud   = new HudManager();

    this.#bindNetworkEvents();

    this.#timer = new Timer();
    this.#timer.connect(document);
  }

  #bindNetworkEvents() {
    this.#network
      .on('welcome', ({ id, seed }) => {
        this.#localId = id;
        initTerrain(seed);
        this.#chunks.reset();
        if (this.#boosts) this.#boosts.reset(seed);
        else this.#boosts = new SpeedBoostManager(this.#sceneSetup.scene, seed);
        if (this.#pendingColor !== null) {
          this.#character.setColor(this.#pendingColor);
        }
        this.#joinScreen.dismiss();
        console.log(`connected as ${id}, seed: ${seed}`);
      })
      .on('world-state', ({ players, scores }) => {
        this.#players.applyWorldState(players, this.#localId);
        this.#hud.updateScores(scores);
      })
      .on('player-joined',  ({ id, color, name }) => this.#players.add(id, color, name))
      .on('player-left',    ({ id }) => this.#players.remove(id))
      .on('players-update', ({ players }) => {
        const local = players.find(p => p.id === this.#localId);
        if (local) this.#serverY = local.y;
        this.#players.applyUpdates(players);
      })
      .on('error', ({ message }) => this.#joinScreen.showError(message))
      .on('goal-spawn', ({ x, y, z }) => this.#goals.spawn(x, y, z))
      .on('player-bump', ({ id1, id2, dx1, dz1, dx2, dz2 }) => {
        const BUMP_STRENGTH = 14.0;
        if (this.#localId === id1) {
          this.#characterController.applyKnockback(dx1, dz1, BUMP_STRENGTH);
        } else if (this.#localId === id2) {
          this.#characterController.applyKnockback(dx2, dz2, BUMP_STRENGTH);
        }
      })
      .on('goal-reached', ({ winnerId, winnerName, scores }) => {
        this.#goals.reached(winnerName, winnerId === this.#localId, scores);
        this.#hud.updateScores(scores);
      });
  }

  dispose() {
    this.#running = false;
    cancelAnimationFrame(this.#rafId);
    this.#sceneSetup.dispose();
    this.#input.dispose();
    this.#network.dispose();
    this.#players.dispose();
    this.#hud.dispose();
    this.#goals.dispose();
    if (this.#boosts) this.#boosts.dispose();
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
    this.#character.speedMultiplier = tMult * (boostActive ? 2.0 : 1.0);
    this.#hud.updateSpeed(tMult, boostActive);
    if (this.#localId) {
      this.#characterController.update(delta, this.#serverY);
    }
    this.#cameraController.update(this.#character, delta, boostActive);
    this.#players.update(delta);
    this.#goals.update(delta);
    this.#hud.updateCompass(pos, this.#character.rotationY, this.#goals.position);
    this.#hud.updateFps(delta);
    this.#sceneSetup.renderer.render(this.#sceneSetup.scene, this.#sceneSetup.camera);
  }
}
