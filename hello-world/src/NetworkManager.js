const SERVER_URL      = import.meta.env.DEV
  ? 'ws://localhost:3000/ws'
  : `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`;
const SEND_RATE_HZ    = 20;
const RECONNECT_DELAY = 1000;  // ms, doubles on each failure
const MAX_RECONNECT_DELAY = 30000;

export class NetworkManager {
  #ws = null;
  #handlers = {};
  #sendInterval = null;
  #reconnectDelay = RECONNECT_DELAY;
  #disposed = false;

  #pendingUpdate = null; // latest local state to send this tick

  constructor() {
    this.#connect();
  }

  on(type, handler) {
    this.#handlers[type] = handler;
    return this;
  }

  sendJoin(name, color) {
    this.#send('join', { name, color });
  }

  queueUpdate(x, z, ry) {
    this.#pendingUpdate = { x, z, ry };
  }

  dispose() {
    this.#disposed = true;
    clearInterval(this.#sendInterval);
    this.#ws?.close();
  }

  #connect() {
    if (this.#disposed) return;

    this.#ws = new WebSocket(SERVER_URL);

    this.#ws.addEventListener('open', () => {
      this.#reconnectDelay = RECONNECT_DELAY;
      this.#startSendLoop();
    });

    this.#ws.addEventListener('message', (e) => {
      try {
        const { type, payload } = JSON.parse(e.data);
        this.#handlers[type]?.(payload);
      } catch {
        console.warn('invalid message from server', e.data);
      }
    });

    this.#ws.addEventListener('close', () => {
      clearInterval(this.#sendInterval);
      this.#scheduleReconnect();
    });

    this.#ws.addEventListener('error', () => {
      // close event will fire after error, reconnect handled there
    });
  }

  #startSendLoop() {
    this.#sendInterval = setInterval(() => {
      if (this.#pendingUpdate) {
        this.#send('player-update', this.#pendingUpdate);
        this.#pendingUpdate = null;
      }
    }, 1000 / SEND_RATE_HZ);
  }

  #scheduleReconnect() {
    if (this.#disposed) return;
    console.log(`reconnecting in ${this.#reconnectDelay}ms...`);
    setTimeout(() => this.#connect(), this.#reconnectDelay);
    this.#reconnectDelay = Math.min(this.#reconnectDelay * 2, MAX_RECONNECT_DELAY);
  }

  #send(type, payload) {
    if (this.#ws?.readyState === WebSocket.OPEN) {
      this.#ws.send(JSON.stringify({ type, payload }));
    }
  }
}
