export default class WSClient {
  constructor(url, connector) {
    this.url = url;
    this.ws = null;
    this.nextKey = 1;
    this.listeners = new Map();
    this.sendQueue = [];
    this.connector = connector;
    this.isConnecting = false;
  }

  setConnector(connector) {
    this.connector = connector;
  }

  connect() {
    this.isConnecting = true;
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = ev => {
      const message = JSON.parse(ev.data);
      this.listeners.forEach(listener => {
        listener(message);
      });
    };
    this.ws.onopen = async () => {
      await this.connector(this);
      this.isConnecting = false;
      this.send();
    };
  }

  disconnect() {
    this.isConnecting = false;
    if (this.ws) {
      this.ws.close();
      this.ws.onopen = this.ws.onmessage = null;
    }
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

    if (
      !this.isConnecting &&
      this.ws &&
      this.ws.readyState === WebSocket.OPEN
    ) {
      messages.forEach(m => this.ws.send(JSON.stringify(m)));
      this.sendQueue = [];
    } else {
      this.sendQueue.push(message);
      if (!this.isConnecting) {
        this.connect();
      }
    }
  }

  sendSync(message) {
    this.ws.send(JSON.stringify(message));
  }

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
        } else if (response.type === 'error') {
          this.removeListener(lk);
          const err = new Error('Error response in websocket');
          err.originalMessage = response;
          return reject(err);
        }
      });
      this.sendSync(message);
      setTimeout(
        () => reject(new Error('Timeout waiting for websocket response')),
        30000
      );
    });
  }
}
