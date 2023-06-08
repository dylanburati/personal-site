export type ResponseCallback = (resp: Response) => void | Promise<void>;

type PartialFetchOptions = RequestInit & { headers: HeadersInit };

export default class HttpClient {
  baseUrl: string;
  headers: Record<string, string>;
  responseCallbacks: ResponseCallback[];

  constructor(baseUrl, headers: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.headers = headers;
    this.responseCallbacks = [];
  }

  private _fetch(path: string, fetchOpts: PartialFetchOptions): Promise<any> {
    const allOpts: RequestInit = {
      ...fetchOpts,
      headers: {
        ...fetchOpts.headers,
        Accept: "application/json",
      },
    };
    const promise = fetch(`${this.baseUrl}${path}`, allOpts).then(
      async (response) => {
        await Promise.all(this.responseCallbacks.map((fn) => fn(response)));
        return await response.json();
      },
      (err) => ({
        message: "Network error",
        success: false,
      })
    );
    return promise;
  }

  addResponseListener(listener: ResponseCallback) {
    this.responseCallbacks.push(listener);
  }

  get(
    path: string,
    additionalHeaders: Record<string, string> = {}
  ): Promise<any> {
    return this._fetch(path, {
      method: "GET",
      headers: {
        ...this.headers,
        ...additionalHeaders,
      },
      referrerPolicy: "no-referrer",
    });
  }

  post(
    path: string,
    data: any,
    additionalHeaders: Record<string, string> = {}
  ): Promise<any> {
    return this._fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
        ...additionalHeaders,
      },
      referrerPolicy: "no-referrer",
      body: JSON.stringify(data),
    });
  }

  postForm(
    path: string,
    formdata: FormData,
    additionalHeaders: Record<string, string> = {}
  ): Promise<any> {
    return this._fetch(path, {
      method: "POST",
      headers: {
        ...this.headers,
        ...additionalHeaders,
      },
      referrerPolicy: "no-referrer",
      body: formdata,
    });
  }

  del(
    path: string,
    data: any,
    additionalHeaders: Record<string, string> = {}
  ): Promise<any> {
    return this._fetch(path, {
      method: "DELETE",
      headers: {
        ...this.headers,
        ...additionalHeaders,
      },
      referrerPolicy: "no-referrer",
      body: JSON.stringify(data),
    });
  }
}
