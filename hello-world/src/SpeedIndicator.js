export class SpeedIndicator {
  #el;

  constructor() {
    this.#el = document.createElement('div');
    Object.assign(this.#el.style, {
      position: 'fixed',
      bottom: '24px',
      left: '24px',
      fontSize: '16px',
      fontFamily: 'monospace',
      fontWeight: 'bold',
      pointerEvents: 'none',
      zIndex: '100',
      textShadow: '0 0 6px currentColor',
      display: 'none',
    });
    document.body.appendChild(this.#el);
  }

  update(terrainMult, boostActive) {
    if (boostActive) {
      this.#el.style.display = 'block';
      this.#el.style.color = '#00ffff';
      this.#el.textContent = 'BOOST!';
    } else if (terrainMult < 1.0) {
      this.#el.style.display = 'block';
      this.#el.style.color = '#ff8c00';
      this.#el.textContent = 'SLOW';
    } else {
      this.#el.style.display = 'none';
    }
  }

  dispose() {
    this.#el.remove();
  }
}
