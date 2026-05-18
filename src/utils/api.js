// Centralized API helpers so every component sends the right auth header.
// - userFetch:  attaches Authorization: Bearer <user sessionToken>
// - shopFetch:  attaches Authorization: Bearer <shop sessionToken>
// - adminFetch: attaches X-Admin-Token from localStorage (set by AdminLogin)

const BASE_URL = (import.meta.env.VITE_API_BASE || "https://darkslategrey-snail-415133.hostingersite.com");
const ADMIN_TOKEN_KEY = 'packitout_admin_token';

export { BASE_URL, ADMIN_TOKEN_KEY };

const mergeHeaders = (extra, init) => {
  const headers = new Headers(init?.headers || {});
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  if (init?.body && !headers.has('Content-Type') && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
};

export const userFetch = (user, path, init = {}) => {
  const headers = mergeHeaders(
    user?.sessionToken ? { Authorization: `Bearer ${user.sessionToken}` } : {},
    init
  );
  return fetch(path.startsWith('http') ? path : `${BASE_URL}${path}`, { ...init, headers });
};

export const shopFetch = (shop, path, init = {}) => {
  const headers = mergeHeaders(
    shop?.sessionToken ? { Authorization: `Bearer ${shop.sessionToken}` } : {},
    init
  );
  return fetch(path.startsWith('http') ? path : `${BASE_URL}${path}`, { ...init, headers });
};

export const getAdminToken = () => {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY) || ''; } catch { return ''; }
};

export const setAdminToken = (token) => {
  try { localStorage.setItem(ADMIN_TOKEN_KEY, token); } catch {}
};

export const clearAdminToken = () => {
  try { localStorage.removeItem(ADMIN_TOKEN_KEY); } catch {}
};

export const adminFetch = (path, init = {}) => {
  const token = getAdminToken();
  const headers = mergeHeaders(
    token ? { 'X-Admin-Token': token } : {},
    init
  );
  return fetch(path.startsWith('http') ? path : `${BASE_URL}${path}`, { ...init, headers });
};
