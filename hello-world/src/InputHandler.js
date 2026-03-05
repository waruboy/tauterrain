const PREVENT_DEFAULT_KEYS = new Set(['w', 'a', 's', 'd']);

export class InputHandler {
  #keys = {};
  #onKeyDown;
  #onKeyUp;
  #onBlur;

  constructor() {
    this.#onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const tag = document.activeElement?.tagName;
      if (PREVENT_DEFAULT_KEYS.has(key) && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
      }
      this.#keys[key] = true;
    };
    this.#onKeyUp  = (e) => { this.#keys[e.key.toLowerCase()] = false; };
    this.#onBlur   = ()  => { this.#keys = {}; };

    window.addEventListener('keydown', this.#onKeyDown);
    window.addEventListener('keyup',   this.#onKeyUp);
    window.addEventListener('blur',    this.#onBlur);
  }

  get keys() { return this.#keys; }

  dispose() {
    window.removeEventListener('keydown', this.#onKeyDown);
    window.removeEventListener('keyup',   this.#onKeyUp);
    window.removeEventListener('blur',    this.#onBlur);
  }
}
