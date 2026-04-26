// ─── API Client ─────────────────────────────────────────────────────────────
// Wraps fetch calls to the Express backend.

const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API request failed');
  }
  return res.json();
}

export function fetchHealth() {
  return request('/health');
}

export function fetchComponents() {
  return request('/components');
}

export function fetchComponentsByType(type) {
  return request(`/components/${type}`);
}

export function generateBuild(budget, purpose) {
  return request('/build/generate', {
    method: 'POST',
    body: JSON.stringify({ budget, purpose }),
  });
}

export function getBuildSummary(build) {
  return request('/build/summary', {
    method: 'POST',
    body: JSON.stringify({ build }),
  });
}
