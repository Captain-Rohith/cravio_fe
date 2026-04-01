const TOKEN_KEY = "cravio.jwt";
const SESSION_KEY = "cravio.session";

let inMemoryToken: string | null = null;

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

export function setToken(token: string): void {
  inMemoryToken = token;
  const storage = getStorage();
  storage?.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (inMemoryToken) {
    return inMemoryToken;
  }

  const storage = getStorage();
  const token = storage?.getItem(TOKEN_KEY) ?? null;
  inMemoryToken = token;

  return token;
}

export function clearToken(): void {
  inMemoryToken = null;
  const storage = getStorage();
  storage?.removeItem(TOKEN_KEY);
}

export function setSessionSnapshot(sessionJson: string): void {
  const storage = getStorage();
  storage?.setItem(SESSION_KEY, sessionJson);
}

export function getSessionSnapshot(): string | null {
  const storage = getStorage();
  return storage?.getItem(SESSION_KEY) ?? null;
}

export function clearSessionSnapshot(): void {
  const storage = getStorage();
  storage?.removeItem(SESSION_KEY);
}

export const tokenStorageKeys = { TOKEN_KEY, SESSION_KEY };
