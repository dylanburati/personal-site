import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import HttpClient from '../../services/httpClient';

const baseUrl = 'https://relisten.xyz:8082';
const collectionName = 'todo';
const http = new HttpClient(baseUrl);
const tokenStoreKey = 'todo/auth_token';

function useGateway() {
  const [token, setToken] = useState(
    typeof window !== 'undefined' ? localStorage.getItem(tokenStoreKey) : null
  );
  const [user, setUser] = useState(token ? { username: null } : null);
  const clearUser = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);
  const detect401 = useCallback(
    json => {
      if (!json.success && /^(Unauthorized|Network error)/.test(json.message)) {
        clearUser();
      }
      return json;
    },
    [clearUser]
  );
  const authHttp = useMemo(() => {
    const headers = {
      'X-Access-Token': token,
    };
    return new HttpClient(baseUrl, headers, [detect401]);
  }, [detect401, token]);
  useEffect(() => {
    if (token && (!user || !user.username)) {
      authHttp
        .get('/me')
        .then(detect401)
        .then(json => {
          if (json.success) {
            setUser({ username: json.username });
          }
        });
    }
  }, [authHttp, detect401, token, user]);

  const login = async (username, password) => {
    return await http
      .post('/login', {
        username,
        password,
      })
      .then(json => {
        if (json.success) {
          localStorage.setItem(tokenStoreKey, json.token);
          setToken(json.token);
          setUser({ username: json.username });
        }
        return json;
      });
  };
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(tokenStoreKey);
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
