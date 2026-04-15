const TOKEN_KEY = 'bsToken';

async function request(method, path, body, auth = false) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res  = await fetch('/api' + path, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}

async function register(username, password) {
  return request('POST', '/auth/register', { username, password });
}

async function login(username, password) {
  const data = await request('POST', '/auth/login', { username, password });
  if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
  return data;
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

async function newGame() {
  return request('POST', '/game/new', undefined, true);
}

async function getActiveGame() {
  return request('GET', '/game/active', undefined, true);
}

async function fire(gameId, row, col) {
  return request('POST', `/game/${gameId}/fire`, { row, col }, true);
}

async function getHistory() {
  return request('GET', '/game/history', undefined, true);
}

function isLoggedIn() {
  return localStorage.getItem(TOKEN_KEY) !== null;
}

window.API = { register, login, logout, newGame, getActiveGame, fire, getHistory, isLoggedIn };
