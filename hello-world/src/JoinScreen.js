const NAME_REGEX = /^[a-zA-Z0-9 _-]{2,16}$/;

const STYLES = `
  #join-screen {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 10;
    font-family: sans-serif;
  }
  #join-box {
    background: #1a1a2e;
    border: 1px solid #444;
    border-radius: 12px;
    padding: 32px 40px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 280px;
    color: #eee;
  }
  #join-box h2 {
    margin: 0;
    font-size: 1.4rem;
    text-align: center;
    letter-spacing: 0.05em;
  }
  #join-box label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.85rem;
    color: #aaa;
  }
  #join-name {
    background: #0f0f1a;
    border: 1px solid #555;
    border-radius: 6px;
    color: #eee;
    font-size: 1rem;
    padding: 8px 10px;
    outline: none;
  }
  #join-name:focus { border-color: #88aaff; }
  #join-color-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  #join-color {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    padding: 2px;
    background: none;
  }
  #join-color-preview {
    flex: 1;
    height: 20px;
    border-radius: 4px;
  }
  #join-error {
    color: #ff6b6b;
    font-size: 0.8rem;
    min-height: 1em;
    text-align: center;
  }
  #join-btn {
    background: #3a5fd9;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.15s;
  }
  #join-btn:hover { background: #5577ee; }
  #join-btn:disabled { background: #444; cursor: default; }
`;

export class JoinScreen {
  #el;
  #onJoin;

  constructor(onJoin) {
    this.#onJoin = onJoin;
    this.#mount();
  }

  showError(message) {
    this.#el.querySelector('#join-error').textContent = message;
    this.#el.querySelector('#join-btn').disabled = false;
  }

  dismiss() {
    this.#el.remove();
  }

  #mount() {
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);

    this.#el = document.createElement('div');
    this.#el.id = 'join-screen';
    this.#el.innerHTML = `
      <div id="join-box">
        <h2>tauterrain</h2>
        <label>
          Name
          <input id="join-name" type="text" maxlength="16" placeholder="Enter name..." autocomplete="off" />
        </label>
        <label>
          Color
          <div id="join-color-row">
            <input id="join-color" type="color" value="#ff8800" />
            <div id="join-color-preview"></div>
          </div>
        </label>
        <div id="join-error"></div>
        <button id="join-btn">Join</button>
      </div>
    `;
    document.body.appendChild(this.#el);

    const colorInput   = this.#el.querySelector('#join-color');
    const colorPreview = this.#el.querySelector('#join-color-preview');
    const nameInput    = this.#el.querySelector('#join-name');
    const btn          = this.#el.querySelector('#join-btn');
    const errorEl      = this.#el.querySelector('#join-error');

    const updatePreview = () => { colorPreview.style.background = colorInput.value; };
    updatePreview();
    colorInput.addEventListener('input', updatePreview);

    const submit = () => {
      const name = nameInput.value.trim().replace(/\s+/g, ' ');
      const errorMsg = this.#validateName(name);
      if (errorMsg) { errorEl.textContent = errorMsg; return; }

      errorEl.textContent = '';
      btn.disabled = true;
      const color = parseInt(colorInput.value.slice(1), 16);
      this.#onJoin(name, color);
    };

    btn.addEventListener('click', submit);
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    nameInput.focus();
  }

  #validateName(name) {
    if (!NAME_REGEX.test(name)) {
      return 'Name must be 2–16 characters (letters, numbers, spaces, hyphens, underscores)';
    }
    return '';
  }
}
