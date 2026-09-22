// nestfind/nestfind/client/src/utils/helpers.js

export const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
  clear: () => {
    try {
      localStorage.clear();
    } catch {}
  },
};

export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    return true;
  } catch {
    return false;
  }
};

export const getInitials = (firstName = "", lastName = "") => {
  const f = (firstName?.[0] || "").toUpperCase();
  const l = (lastName?.[0] || "").toUpperCase();
  return `${f}${l}` || "??";
};

export const getInitialsColor = (str = "") => {
  const colors = [
    "#c9a84c",
    "#3b82f6",
    "#10b981",
    "#8b5cf6",
    "#ef4444",
    "#f59e0b",
    "#06b6d4",
    "#ec4899",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const buildQueryString = (params = {}) => {
  const query = Object.entries(params)
    .filter(([, v]) => v !== "" && v !== null && v !== undefined)
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(Array.isArray(v) ? v.join(",") : v)}`,
    )
    .join("&");
  return query ? `?${query}` : "";
};

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone) =>
  /^(\+251|0)[0-9]{9}$/.test(phone.replace(/\s/g, ""));

export const capitalizeFirst = (str = "") =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const slugify = (str = "") =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const randomId = () => Math.random().toString(36).slice(2, 10);

export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

export const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
