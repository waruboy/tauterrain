export class Scoreboard {
  #el;

  constructor() {
    this.#el = document.createElement('div');
    Object.assign(this.#el.style, {
      position: 'fixed',
      top: '8px',
      right: '8px',
      zIndex: '30',
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#fff',
      background: 'rgba(0,0,0,0.5)',
      borderRadius: '6px',
      padding: '8px 12px',
      pointerEvents: 'none',
      minWidth: '140px',
    });
    this.#el.style.display = 'none';
    document.body.appendChild(this.#el);
  }

  update(scores) {
    const ranked = scores.filter(s => s.score > 0);
    if (ranked.length === 0) {
      this.#el.style.display = 'none';
      return;
    }
    this.#el.style.display = '';
    this.#el.innerHTML = ranked
      .map((s, i) => {
        const name = s.name.length > 12 ? s.name.slice(0, 12) + '\u2026' : s.name;
        return `<div style="white-space:nowrap">#${i + 1} ${name} \u2014 ${s.score} win${s.score !== 1 ? 's' : ''}</div>`;
      })
      .join('');
  }

  dispose() {
    this.#el.remove();
  }
}
