export class GoalCompass {
  #el;
  #arrow;
  #dist;

  constructor() {
    this.#el = document.createElement('div');
    Object.assign(this.#el.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      pointerEvents: 'none',
      zIndex: '100',
      fontFamily: 'monospace',
    });

    this.#arrow = document.createElement('div');
    Object.assign(this.#arrow.style, {
      fontSize: '32px',
      lineHeight: '1',
      transition: 'color 0.3s',
    });
    this.#arrow.textContent = '▲';

    this.#dist = document.createElement('div');
    Object.assign(this.#dist.style, {
      fontSize: '14px',
      marginTop: '2px',
      transition: 'color 0.3s',
    });

    this.#el.appendChild(this.#arrow);
    this.#el.appendChild(this.#dist);
    document.body.appendChild(this.#el);
  }

  update(playerPos, playerRotY, goalPos) {
    if (!goalPos) {
      this.#el.style.display = 'none';
      return;
    }
    this.#el.style.display = 'flex';

    const dx = goalPos.x - playerPos.x;
    const dz = goalPos.z - playerPos.z;
    const worldAngle = Math.atan2(dx, dz);
    const bearing = worldAngle - playerRotY;

    this.#arrow.style.transform = `rotate(${-bearing}rad)`;

    const distance = Math.sqrt(dx * dx + dz * dz);
    this.#dist.textContent = `${Math.round(distance)}m`;

    const color = distance > 60 ? '#4a9eff' : distance > 30 ? '#ff8c00' : '#ff2020';
    this.#arrow.style.color = color;
    this.#dist.style.color = color;
  }

  dispose() {
    this.#el.remove();
  }
}
