// nestfind/nestfind/client/src/utils/tokenService.js

const ACCESS_TOKEN_KEY = "nestfind_access_token";
const REFRESH_TOKEN_KEY = "nestfind_refresh_token";

// Named exports used by axios.js
export const getAccessToken = () => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAccessToken = (token) => {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {}
};

export const getRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setRefreshToken = (token) => {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {}
};

export const clearAuthData = () => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem("nestfind_user");
  } catch {}
};

export const parseToken = (token) => {
  try {
    if (!token) return null;
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  try {
    const payload = parseToken(token);
    if (!payload?.exp) return true;
    return payload.exp * 1000 < Date.now() + 60_000;
  } catch {
    return true;
  }
};

export const setTokens = (accessToken, refreshToken) => {
  setAccessToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);
};

// Also export as object for components using tokenService.getAccessToken()
export const tokenService = {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  setTokens,
  clearAuthData,
  parseToken,
  isTokenExpired,
};

export default tokenService;
