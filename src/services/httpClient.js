export default class HttpClient {
  /**
   * @param {string} baseUrl The base URL for requests
   * @param {Record<string, string>} headers The headers to include with every request
   * @param {Array<(json: object) => PromiseLike<object>>} responseCallbacks
   * Callbacks to add to the promise chain
   */
  constructor(baseUrl, headers = {}, responseCallbacks = []) {
    this.baseUrl = baseUrl;
    this.headers = headers;
    this.responseCallbacks = responseCallbacks;
  }

  _fetch(path, fetchOpts) {
    const allOpts = {
      ...fetchOpts,
      headers: {
        ...fetchOpts.headers,
        Accept: 'application/json',
      },
    };
    const promise = fetch(`${this.baseUrl}${path}`, allOpts).then(
      response => response.json(),
      err => ({
        message: 'Network error',
        success: false,
      })
    );
    return this.responseCallbacks.reduce((acc, cur) => acc.then(cur), promise);
  }

  get(path, additionalHeaders = {}) {
    return this._fetch(path, {
      method: 'GET',
      headers: {
        ...this.headers,
        ...additionalHeaders,
      },
      referrerPolicy: 'no-referrer',
    });
  }

  post(path, data, additionalHeaders = {}) {
    return this._fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
        ...additionalHeaders,
      },
      referrerPolicy: 'no-referrer',
      body: JSON.stringify(data),
    });
  }

  postForm(path, formdata, additionalHeaders = {}) {
    return this._fetch(path, {
      method: 'POST',
      headers: {
        ...this.headers,
        ...additionalHeaders,
      },
      referrerPolicy: 'no-referrer',
      body: formdata,
    });
  }

  del(path, additionalHeaders = {}) {
    return this._fetch(path, {
      method: 'DELETE',
      headers: {
        ...this.headers,
        ...additionalHeaders,
      },
      referrerPolicy: 'no-referrer',
    });
  }
}
