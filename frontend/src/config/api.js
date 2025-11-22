const rawBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

let warnedMissingBase = false;

export function apiUrl(path = '') {
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${safePath}`;
}

export { API_BASE };


