const TOKEN_KEY = "cravio.jwt";
const SESSION_KEY = "cravio.session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

let inMemoryToken: string | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function setCookie(name: string, value: string, maxAgeSeconds = COOKIE_MAX_AGE_SECONDS): void {
  if (!isBrowser()) {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function getCookie(name: string): string | null {
  if (!isBrowser()) {
    return null;
  }

  const key = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie ? document.cookie.split("; ") : [];

  for (const cookie of cookies) {
    if (cookie.startsWith(key)) {
      try {
        return decodeURIComponent(cookie.slice(key.length));
      } catch {
        return null;
      }
    }
  }

  return null;
}

function clearCookie(name: string): void {
  if (!isBrowser()) {
    return;
  }

  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function setToken(token: string): void {
  inMemoryToken = token;
  setCookie(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (inMemoryToken) {
    return inMemoryToken;
  }

  const token = getCookie(TOKEN_KEY);
  inMemoryToken = token;

  return token;
}

export function clearToken(): void {
  inMemoryToken = null;
  clearCookie(TOKEN_KEY);
}

export function setSessionSnapshot(sessionJson: string): void {
  setCookie(SESSION_KEY, sessionJson);
}

export function getSessionSnapshot(): string | null {
  return getCookie(SESSION_KEY);
}

export function clearSessionSnapshot(): void {
  clearCookie(SESSION_KEY);
}

export const tokenStorageKeys = { TOKEN_KEY, SESSION_KEY };
