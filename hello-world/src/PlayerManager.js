import { RemotePlayer } from './RemotePlayer.js';

export class PlayerManager {
  #scene;
  #players = new Map(); // id -> RemotePlayer

  constructor(scene) {
    this.#scene = scene;
  }

  // Called when a new player joins
  add(id, color) {
    if (this.#players.has(id)) return;
    const player = new RemotePlayer(color);
    this.#players.set(id, player);
    this.#scene.add(player.object);
  }

  // Called when a player leaves
  remove(id) {
    const player = this.#players.get(id);
    if (!player) return;
    this.#scene.remove(player.object);
    player.dispose();
    this.#players.delete(id);
  }

  // Called with players-update payload (only moved players included)
  applyUpdates(updates) {
    for (const { id, x, y, z, ry } of updates) {
      this.#players.get(id)?.setTarget(x, y, z, ry);
    }
  }

  // Called with world-state payload on join
  applyWorldState(players, localId) {
    for (const { id, color, x, y, z, ry } of players) {
      if (id === localId) continue;
      this.add(id, color);
      this.#players.get(id)?.setTarget(x, y, z, ry);
    }
  }

  // Called every frame
  update(delta) {
    for (const player of this.#players.values()) {
      player.update(delta);
    }
  }

  dispose() {
    for (const id of this.#players.keys()) {
      this.remove(id);
    }
  }
}
