export class InputHandler {
  #keys = {};

  constructor() {
    window.addEventListener('keydown', (e) => { this.#keys[e.key] = true; });
    window.addEventListener('keyup',   (e) => { this.#keys[e.key] = false; });
  }

  get keys() { return this.#keys; }
}
