// nestfind/nestfind/client/src/utils/tokenService.js

const ACCESS_TOKEN_KEY = "nestfind_access_token";
const REFRESH_TOKEN_KEY = "nestfind_refresh_token";
const USER_KEY = "nestfind_user";

export const tokenService = {
  getAccessToken: () => {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setAccessToken: (token) => {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {}
  },
  getRefreshToken: () => {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setRefreshToken: (token) => {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch {}
  },
  setTokens: (accessToken, refreshToken) => {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch {}
  },
  clearAuthData: () => {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  },
  parseToken: (token) => {
    try {
      if (!token) return null;
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(window.atob(base64));
    } catch {
      return null;
    }
  },
  isTokenExpired: (token) => {
    try {
      const payload = tokenService.parseToken(token);
      if (!payload?.exp) return true;
      return payload.exp * 1000 < Date.now() + 60_000;
    } catch {
      return true;
    }
  },
};

export default tokenService;
