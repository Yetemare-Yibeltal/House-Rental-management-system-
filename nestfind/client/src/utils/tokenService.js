// nestfind/nestfind/client/src/utils/tokenService.js

import { STORAGE_KEYS } from "./constants";

// ── ACCESS TOKEN ──────────────────────────────────────────────────────────────
export const getAccessToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
};

export const setAccessToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
  } catch {}
};

export const removeAccessToken = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch {}
};

// ── USER DATA ─────────────────────────────────────────────────────────────────
export const getStoredUser = () => {
  try {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  } catch {}
};

export const removeStoredUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch {}
};

// ── TOKEN PARSING ─────────────────────────────────────────────────────────────
export const parseToken = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  try {
    const parsed = parseToken(token);
    if (!parsed || !parsed.exp) return true;
    return Date.now() >= parsed.exp * 1000;
  } catch {
    return true;
  }
};

export const getTokenExpiry = (token) => {
  try {
    const parsed = parseToken(token);
    if (!parsed || !parsed.exp) return null;
    return new Date(parsed.exp * 1000);
  } catch {
    return null;
  }
};

export const getTokenRole = (token) => {
  try {
    const parsed = parseToken(token);
    return parsed?.role || null;
  } catch {
    return null;
  }
};

// ── CLEAR ALL ─────────────────────────────────────────────────────────────────
export const clearAuthData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch {}
};

// ── IS AUTHENTICATED ──────────────────────────────────────────────────────────
export const isAuthenticated = () => {
  const token = getAccessToken();
  if (!token) return false;
  return !isTokenExpired(token);
};
