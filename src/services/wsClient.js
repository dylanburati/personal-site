export default class WSClient {
  constructor(url, readyCallback, reconnectCallback) {
    this.url = url;
    this.ws = new WebSocket(url);
    this.nextKey = 1;
    this.listeners = new Map();
    this.sendQueue = [];
    this.reconnectCallback = reconnectCallback || readyCallback;
    this.isConnecting = true;

    this.ws.onopen = async () => {
      this.handleOpen();
      await readyCallback(this);
      this.isConnecting = false;
      this.send();
    };
  }

  reconnect() {
    this.isConnecting = true;
    this.ws = new WebSocket(this.url);
    this.ws.onopen = async () => {
      this.handleOpen();
      await this.reconnectCallback(this);
      this.isConnecting = false;
      this.send();
    };
  }

  disconnect() {
    this.isConnecting = false;
    this.ws.close();
    this.ws.onopen = this.ws.onmessage = null;
  }

  handleOpen() {
    this.ws.onmessage = ev => {
      const message = JSON.parse(ev.data);
      this.listeners.forEach(listener => {
        listener(message);
      });
    };
  }

  addListener(listener) {
    const key = this.nextKey.toString();
    this.nextKey += 1;
    this.listeners.set(key, listener);
    return key;
  }

  removeListener(key) {
    this.listeners.delete(key);
  }

  send(message) {
    const messages = [...this.sendQueue];
    if (message) messages.push(message);

    if (!this.isConnecting && this.ws.readyState === WebSocket.OPEN) {
      messages.forEach(m => this.ws.send(JSON.stringify(m)));
      this.sendQueue = [];
    } else {
      this.sendQueue.push(message);
      if (!this.isConnecting) {
        this.reconnect();
      }
    }
  }

  // sendSync(message) {
  //   this.ws.send(JSON.stringify(message));
  // }

  /**
   * @param {any} message Object with action and data for WS server
   * @param {{ returnType?: string }} options Options
   */
  async sendAndListen(message, options = {}) {
    const listenForType = options.returnType || message.action;
    return new Promise((resolve, reject) => {
      const lk = this.addListener(response => {
        if (response.type === listenForType) {
          this.removeListener(lk);
          return resolve(response);
        }
      });
      this.send(message);
      setTimeout(() => reject('Timeout waiting for websocket response'), 30000);
    });
  }
}
