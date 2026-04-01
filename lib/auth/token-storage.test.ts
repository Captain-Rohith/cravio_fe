import {
  clearSessionSnapshot,
  clearToken,
  getSessionSnapshot,
  getToken,
  setSessionSnapshot,
  setToken,
} from "@/lib/auth/token-storage";

describe("token storage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    clearToken();
    clearSessionSnapshot();
  });

  it("stores and retrieves token", () => {
    setToken("jwt-123");
    expect(getToken()).toBe("jwt-123");
  });

  it("stores and retrieves session snapshot", () => {
    const value = JSON.stringify({ token: "abc" });
    setSessionSnapshot(value);
    expect(getSessionSnapshot()).toBe(value);
  });

  it("clears token and session", () => {
    setToken("jwt-123");
    setSessionSnapshot("{}");

    clearToken();
    clearSessionSnapshot();

    expect(getToken()).toBeNull();
    expect(getSessionSnapshot()).toBeNull();
  });
});
