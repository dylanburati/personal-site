export type WSConnector = (client: WSClient) => Promise<void>;
export type WSListener = (message: any) => void;
export type MessageCriteria = {
  returnType?: string;
}

class RemoteError extends Error {
  data: any

  constructor(message: string, data: any) {
    super(message);
    this.data = data;
  }
}

export default class WSClient {
  url: string;
  ws: WebSocket | null;
  nextKey: number;
  listeners: Map<number, WSListener>;
  sendQueue: any[];
  connector: WSConnector;
  isConnecting: boolean;

  constructor(url: string, connector: WSConnector) {
    this.url = url;
    this.ws = null;
    this.nextKey = 1;
    this.listeners = new Map();
    this.sendQueue = [];
    this.connector = connector;
    this.isConnecting = false;
  }

  setConnector(connector: WSConnector): void {
    this.connector = connector;
  }

  connect(): void {
    this.isConnecting = true;
    this.ws = new WebSocket(this.url);
    this.ws.onmessage = (ev) => {
      const message = JSON.parse(ev.data);
      this.listeners.forEach((listener) => {
        listener(message);
      });
    };
    this.ws.onopen = async () => {
      await this.connector(this);
      this.isConnecting = false;
      this.flush();
    };
  }

  disconnect(): void {
    this.isConnecting = false;
    if (this.ws) {
      this.ws.close();
      this.ws.onopen = this.ws.onmessage = null;
    }
  }

  addListener(listener: WSListener): number {
    const key = this.nextKey;
    this.nextKey += 1;
    this.listeners.set(key, listener);
    return key;
  }

  removeListener(key: number): void {
    this.listeners.delete(key);
  }

  send(message: any): void {
    this.sendQueue.push(message);
    this.flush();
  }

  flush(): void {
    const ws = this.ws;
    if (
      !this.isConnecting &&
      ws &&
      ws.readyState === WebSocket.OPEN
    ) {
      const messages = this.sendQueue.splice(0);
      messages.forEach((m) => ws.send(JSON.stringify(m)));
    } else {
      if (!this.isConnecting) {
        this.connect();
      }
    }
  }

  sendSync(message: any): void {
    const ws = this.ws;
    if (!ws) {
      throw new Error("sendSync requires an active connection");
    }
    ws.send(JSON.stringify(message));
  }

  async sendAndListen(message: any, options: MessageCriteria = {}): Promise<any> {
    const listenForType = options.returnType || message.action;
    let key = -1;
    const listenPromise: Promise<any> = new Promise((resolve, reject) => {
      key = this.addListener((response) => {
        if (response.type === listenForType) {
          return resolve(response);
        } else if (response.type === "error") {
          return reject(new RemoteError("Error response in websocket", response));
        }
      })
    });
    const timeoutPromise: Promise<never> = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Timeout waiting for websocket response")),
        30000
      )
    );
    try {
      this.sendSync(message);
      return await Promise.race([listenPromise, timeoutPromise])
    } finally {
      this.removeListener(key);
    }
  }
}
