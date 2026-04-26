// ─── API Client (India Edition) ─────────────────────────────────────────────
// Auth-aware fetch wrapper. All prices in ₹.

const BASE = '/api';

function getToken() {
  return localStorage.getItem('pcbuilder_token');
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API request failed');
  }
  return res.json();
}

// Auth
export function registerUser(name, email, password) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

export function loginUser(email, password) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function fetchCurrentUser() {
  return request('/auth/me');
}

// Components
export function fetchComponents() {
  return request('/components');
}

export function fetchComponentsByType(type) {
  return request(`/components/${type}`);
}

// Builds
export function postAIBuild(purpose, budget) {
  return request('/ai-build', { method: 'POST', body: JSON.stringify({ purpose, budget }) });
}

export function postCustomBuild(selectedComponents) {
  return request('/custom-build', { method: 'POST', body: JSON.stringify({ selectedComponents }) });
}

// Saved Builds
export function saveBuild(buildData) {
  return request('/save-build', { method: 'POST', body: JSON.stringify(buildData) });
}

export function fetchSavedBuilds() {
  return request('/saved-builds');
}

export function deleteSavedBuild(id) {
  return request(`/saved-builds/${id}`, { method: 'DELETE' });
}
