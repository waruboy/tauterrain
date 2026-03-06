const DISPLAY_DURATION = 4000;
const FADE_DURATION    = 1000;

const STYLES = `
  #win-announcement {
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    font-family: sans-serif;
    text-align: center;
    pointer-events: none;
    transition: opacity ${FADE_DURATION}ms ease-out;
  }
  #win-announcement .winner-text {
    font-size: 2.5rem;
    font-weight: bold;
    color: #ffdd00;
    text-shadow: 0 0 20px rgba(255, 221, 0, 0.8),
                 0 2px 4px rgba(0, 0, 0, 0.6);
  }
  #win-announcement .sub-text {
    font-size: 1.2rem;
    color: #fff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
    margin-top: 8px;
  }
`;

export class WinnerAnnouncement {
  static #styleInjected = false;

  static show(winnerName, isLocal) {
    if (!this.#styleInjected) {
      const style = document.createElement('style');
      style.textContent = STYLES;
      document.head.appendChild(style);
      this.#styleInjected = true;
    }

    document.getElementById('win-announcement')?.remove();

    const el = document.createElement('div');
    el.id = 'win-announcement';
    el.innerHTML = `
      <div class="winner-text">${isLocal ? 'You win!' : `${winnerName} reached the goal!`}</div>
      <div class="sub-text">New goal spawning soon...</div>
    `;
    document.body.appendChild(el);

    setTimeout(() => { el.style.opacity = '0'; }, DISPLAY_DURATION);
    setTimeout(() => { el.remove(); }, DISPLAY_DURATION + FADE_DURATION);
  }
}
