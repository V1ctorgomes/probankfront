const ACCESS_KEY = 'probank_access_token';
const REFRESH_KEY = 'probank_refresh_token';
const USER_KEY = 'probank_user';

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function setUser(user: unknown) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser<T>() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export function decodeUserFromToken(token: string) {
  const payload = token.split('.')[1];
  if (!payload) return null;
  const decoded = JSON.parse(atob(payload));
  return {
    id: decoded.sub as string,
    email: decoded.email as string,
    role: decoded.role as string,
    nome: decoded.nome as string,
  };
}
