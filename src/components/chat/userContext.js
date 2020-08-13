import React, { useState, useEffect, useMemo, useCallback } from 'react';
import HttpClient from '../../services/httpClient';

const baseUrl = 'http://localhost:7000';

const localStorageOrDefault = (key, dfault) => {
  if (typeof window === 'undefined') return dfault;
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored : dfault;
  } catch {}
  return dfault;
};

export const UserContext = React.createContext({
  token: null,
  authHttp: null,
  user: null,
  createGuest: () => {},
  register: () => {},
  login: () => {},
  logout: () => {},
});

export function UserProvider(props) {
  const [token, setToken] = useState(() =>
    localStorageOrDefault('auth_token', null)
  );
  const [user, setUser] = useState(null);
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
  const [http] = useState(() => new HttpClient(baseUrl));
  const authHttp = useMemo(() => {
    if (!token) return null;
    const headers = {
      'X-Access-Token': token,
    };
    return new HttpClient(baseUrl, headers, [detect401]);
  }, [detect401, token]);
  useEffect(() => {
    if (token && !user) {
      authHttp
        .get('/me')
        .then(detect401)
        .then(json => {
          if (json.success) {
            setUser({ id: json.userId, username: json.username });
          }
        });
    }
  }, [authHttp, detect401, token, user]);

  const createUser = async input => {
    const json = await http.post('/u', input);
    if (json.success) {
      localStorage.setItem('auth_token', json.token);
      setToken(json.token);
      setUser({ id: json.userId, username: json.username });
    }
    return json;
  };
  const register = (username, password) => createUser({ username, password });
  const createGuest = () => createUser({ isGuest: true });
  const login = async (username, password) => {
    const json = await http.post('/login', {
      username,
      password,
    });
    if (json.success) {
      localStorage.setItem('auth_token', json.token);
      setToken(json.token);
      setUser({ id: json.userId, username: json.username });
    }
    return json;
  };
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    clearUser();
  };

  return (
    <UserContext.Provider
      value={{
        token,
        authHttp,
        user,
        createGuest,
        register,
        login,
        logout,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
}
