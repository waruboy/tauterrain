export class ProximityPulse {
  #el;
  #elapsed = 0;

  constructor() {
    this.#el = document.createElement('div');
    Object.assign(this.#el.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '99',
    });
    document.body.appendChild(this.#el);
  }

  update(playerPos, goalPos, delta) {
    if (!goalPos) {
      this.#el.style.boxShadow = 'none';
      this.#elapsed = 0;
      return;
    }

    this.#elapsed += delta;

    const dx = goalPos.x - playerPos.x;
    const dz = goalPos.z - playerPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance > 80) {
      this.#el.style.boxShadow = 'none';
      return;
    }

    // Map distance 80→0 to intensity 0→0.4
    const t = 1 - distance / 80;
    const baseIntensity = t * 0.4;

    // Pulse frequency: 1Hz at far edge → 4Hz when very close
    const freq = 1 + t * 3;
    const pulse = 0.5 + 0.5 * Math.sin(this.#elapsed * freq * Math.PI * 2);
    const alpha = baseIntensity * pulse;

    // Color: blue (far) → orange (mid) → red (close)
    let r, g, b;
    if (distance > 40) {
      // blue to orange
      const f = (distance - 40) / 40;
      r = Math.round(255 * (1 - f) + 74 * f);
      g = Math.round(140 * (1 - f) + 158 * f);
      b = Math.round(0 * (1 - f) + 255 * f);
    } else {
      // orange to red
      const f = distance / 40;
      r = 255;
      g = Math.round(140 * f);
      b = 0;
    }

    const blur = 60 + t * 80;
    const spread = 20 + t * 40;
    this.#el.style.boxShadow =
      `inset 0 0 ${blur}px ${spread}px rgba(${r},${g},${b},${alpha})`;
  }

  dispose() {
    this.#el.remove();
  }
}
