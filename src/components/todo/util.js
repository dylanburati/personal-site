import React, { createContext, useContext, useState } from 'react';

const baseUrl = 'https://relisten.xyz/jsonbin';
const collectionName = 'todo';

function get(path, additionalHeaders = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: 'GET',
    headers: {
      ...additionalHeaders,
    },
    referrerPolicy: 'no-referrer',
  })
    .then(response => response.json())
    .catch(err => ({
      message: 'Network error',
      success: false,
    }));
}

function post(path, data, additionalHeaders = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    },
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .catch(err => ({
      message: 'Network error',
      success: false,
    }));
}

function httpDelete(path, additionalHeaders = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: 'DELETE',
    headers: {
      ...additionalHeaders,
    },
    referrerPolicy: 'no-referrer',
  })
    .then(response => response.json())
    .catch(err => ({
      message: 'Network error',
      success: false,
    }));
}

function useGateway() {
  const [token, setToken] = useState(
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  );

  const login = async (username, password) => {
    return await post('/login', {
      username,
      password,
    }).then(json => {
      if (json.success) {
        localStorage.setItem('auth_token', json.token);
        setToken(json.token);
      }
      return json;
    });
  };
  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    setToken(null);
  };

  if (token === null) {
    return {
      user: null,
      login,
      logout,
    };
  }

  const detect401 = json =>
    !json.success && json.message && json.message.startsWith('Unauthorized');

  const list = async () => {
    return await get(`/c/${collectionName}`, {
      'X-Access-Token': token,
    }).then(json => {
      if (detect401(json)) {
        setToken(null);
      }
      return json;
    });
  };
  const load = async name => {
    return await get(`/c/${collectionName}/${name}`, {
      'X-Access-Token': token,
    }).then(json => {
      if (detect401(json)) {
        setToken(null);
      }
      return json;
    });
  };
  const del = async name => {
    return await httpDelete(`/c/${collectionName}/${name}`, {
      'X-Access-Token': token,
    }).then(json => {
      if (detect401(json)) {
        setToken(null);
      }
      return json;
    });
  };
  const saveQueue = {
    example: [1, Promise.resolve()],
  };
  const save = async (name, data) => {
    if (!(name in saveQueue)) {
      saveQueue[name] = [1, Promise.resolve()];
    }
    const taskId = ++saveQueue[name][0];
    return await saveQueue[name][1].then(() => {
      if (taskId === saveQueue[name][0]) {
        saveQueue[name][1] = post(`/c/${collectionName}/${name}`, data, {
          'X-Access-Token': token,
        }).then(json => {
          if (detect401(json)) {
            setToken(null);
          }
          return json;
        });

        return saveQueue[name][1];
      }
    });
  };

  return {
    user: true,
    login,
    logout,
    list,
    load,
    del,
    save,
  };
}

export const GatewayContext = createContext({
  user: false,
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
