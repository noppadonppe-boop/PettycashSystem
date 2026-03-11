const DEFAULT_SESSION_MS = 60 * 60 * 1000;

export function getSessionKey(appPrefix: string) {
  return `${appPrefix}_session_expires`;
}

export function setSessionExpiry(appPrefix: string, durationMs = DEFAULT_SESSION_MS) {
  const expiresAt = Date.now() + durationMs;
  localStorage.setItem(getSessionKey(appPrefix), String(expiresAt));
}

export function clearSession(appPrefix: string) {
  localStorage.removeItem(getSessionKey(appPrefix));
}

export function isSessionExpired(appPrefix: string) {
  const raw = localStorage.getItem(getSessionKey(appPrefix));
  const expiresAt = raw ? Number(raw) : 0;
  if (!expiresAt || Number.isNaN(expiresAt)) return true;
  return Date.now() >= expiresAt;
}

export function getRemainingMinutes(appPrefix: string) {
  const raw = localStorage.getItem(getSessionKey(appPrefix));
  const expiresAt = raw ? Number(raw) : 0;
  if (!expiresAt || Number.isNaN(expiresAt)) return 0;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000));
}

