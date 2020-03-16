import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from 'react';

const baseUrl = 'https://relisten.xyz/jsonbin';
const collectionName = 'todo';

class HttpClient {
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
    const promise = fetch(`${baseUrl}${path}`, fetchOpts).then(
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

const http = new HttpClient(baseUrl);

function useGateway() {
  const [token, setToken] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  );
  const [user, setUser] = useState(null);
  const clearUser = () => {
    setToken(null);
    setUser(null);
  };
  const authHttp = useMemo(() => {
    const headers = {
      'X-Access-Token': token,
    };
    const detect401 = json => {
      if (!json.success && /^(Unauthorized|Network error)/.test(json.message)) {
        clearUser();
      }
      return json;
    };
    return new HttpClient(baseUrl, headers, [detect401]);
  }, [token]);
  useEffect(() => {
    if (token && !user) {
      authHttp.get('/me').then(json => {
        if (json.success) {
          setUser({ username: json.username });
        }
      });
    }
  }, [authHttp, token, user]);

  const login = async (username, password) => {
    return await http
      .post('/login', {
        username,
        password,
      })
      .then(json => {
        if (json.success) {
          localStorage.setItem('auth_token', json.token);
          setToken(json.token);
          setUser({ username: json.username });
        }
        return json;
      });
  };
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    clearUser();
  };

  if (token === null) {
    return {
      user: null,
      login,
      logout,
    };
  }

  const list = () => authHttp.get(`/c/${collectionName}`);
  const load = name => authHttp.get(`/c/${collectionName}/${name}`);
  const del = name => authHttp.del(`/c/${collectionName}/${name}`);
  const share = (name, username, permissions = ['EDIT']) =>
    authHttp.post(`/u/${username}/share`, {
      collectionName,
      name,
      permissions,
    });

  const saveQueue = {};
  const save = async (name, data, delay = 2000) => {
    let q = saveQueue[name];
    if (!q) {
      saveQueue[name] = q = {
        pendingId: 1,
        pendingTime: 0,
        lastResult: Promise.resolve(),
      };
    }
    const taskId = ++q.pendingId;
    if (q.pendingTime < Date.now()) {
      await q.lastResult;
      if (taskId !== q.pendingId) return;
      q.pendingTime = Date.now() + delay;
    } else {
      q.pendingTime = Math.min(Date.now() + delay, q.pendingTime);
    }
    await new Promise(resolve =>
      setTimeout(resolve, q.pendingTime - Date.now())
    );
    if (taskId !== q.pendingId) return;

    q.lastResult = authHttp.post(`/c/${collectionName}/${name}`, data);
    return await q.lastResult;
  };

  return {
    user,
    login,
    logout,
    list,
    load,
    del,
    save,
    share,
  };
}

export const GatewayContext = createContext({
  user: null,
  login: async () => {
    throw new Error('Not provided');
  },
  logout: () => {
    throw new Error('Not provided');
  },
});

export function GatewayProvider(props) {
  const gateway = useGateway();

  return (
    <GatewayContext.Provider value={gateway}>
      {props.children}
    </GatewayContext.Provider>
  );
}

export const useContextGateway = () => useContext(GatewayContext);
