export class FpsCounter {
  #el;
  #frames = 0;
  #elapsed = 0;

  constructor() {
    this.#el = document.createElement('div');
    Object.assign(this.#el.style, {
      position: 'fixed',
      top: '8px',
      left: '8px',
      zIndex: '30',
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#fff',
      textShadow: '0 1px 2px rgba(0,0,0,0.7)',
      pointerEvents: 'none',
    });
    document.body.appendChild(this.#el);
  }

  update(delta) {
    this.#frames++;
    this.#elapsed += delta;
    if (this.#elapsed >= 1) {
      this.#el.textContent = `${Math.round(this.#frames / this.#elapsed)} fps`;
      this.#frames = 0;
      this.#elapsed = 0;
    }
  }

  dispose() {
    this.#el.remove();
  }
}
