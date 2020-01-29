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

export async function login(username, password) {
  return await post('/login', {
    username,
    password,
  });
}

export function getGatewayFunctions(token) {
  const saveQueue = {
    example: [1, Promise.resolve()],
  };

  return {
    async list() {
      return await get(`/c/${collectionName}`, {
        'X-Access-Token': token,
      });
    },

    async load(name) {
      return await get(`/c/${collectionName}/${name}`, {
        'X-Access-Token': token,
      });
    },

    async del(name) {
      return await httpDelete(`/c/${collectionName}/${name}`, {
        'X-Access-Token': token,
      });
    },

    async save(name, data) {
      if (!(name in saveQueue)) {
        saveQueue[name] = [1, Promise.resolve()];
      }
      const taskId = ++saveQueue[name][0];
      return await saveQueue[name][1].then(() => {
        if (taskId === saveQueue[name][0]) {
          saveQueue[name][1] = post(`/c/${collectionName}/${name}`, data, {
            'X-Access-Token': token,
          });
          return saveQueue[name][1];
        }
      });
    },
  };
}
