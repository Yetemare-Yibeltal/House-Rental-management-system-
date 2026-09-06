// nestfind/nestfind/client/src/utils/helpers.js

// ── OBJECT UTILITIES ──────────────────────────────────────────────────────────
export const omit = (obj, keys) => {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
};

export const pick = (obj, keys) => {
  const result = {};
  keys.forEach((key) => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
};

export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

// ── ARRAY UTILITIES ───────────────────────────────────────────────────────────
export const unique = (arr) => [...new Set(arr)];

export const groupBy = (arr, key) => {
  return arr.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

export const sortBy = (arr, key, direction = "asc") => {
  return [...arr].sort((a, b) => {
    if (direction === "asc") return a[key] > b[key] ? 1 : -1;
    return a[key] < b[key] ? 1 : -1;
  });
};

export const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// ── STRING UTILITIES ──────────────────────────────────────────────────────────
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export const camelToTitle = (str) => {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
};

export const snakeToTitle = (str) => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// ── URL UTILITIES ─────────────────────────────────────────────────────────────
export const buildQueryString = (params) => {
  const filtered = Object.entries(params)
    .filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    )
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((v) => `${key}=${encodeURIComponent(v)}`).join("&");
      }
      return `${key}=${encodeURIComponent(value)}`;
    });
  return filtered.length > 0 ? `?${filtered.join("&")}` : "";
};

export const parseQueryString = (queryString) => {
  const params = {};
  new URLSearchParams(queryString).forEach((value, key) => {
    if (params[key]) {
      params[key] = Array.isArray(params[key])
        ? [...params[key], value]
        : [params[key], value];
    } else {
      params[key] = value;
    }
  });
  return params;
};

// ── DEBOUNCE & THROTTLE ───────────────────────────────────────────────────────
export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = (fn, limit) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  };
};

// ── STORAGE UTILITIES ─────────────────────────────────────────────────────────
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
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

// ── VALIDATION UTILITIES ──────────────────────────────────────────────────────
export const isValidEmail = (email) => {
  return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
};

export const isValidEthiopianPhone = (phone) => {
  return /^(\+251|0)[79]\d{8}$/.test(phone);
};

export const isValidMongoId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// ── COLOR UTILITIES ───────────────────────────────────────────────────────────
export const getInitialsColor = (name) => {
  const colors = [
    "#c9a84c",
    "#e8c97a",
    "#a07830",
    "#4a90e2",
    "#7b68ee",
    "#50c878",
    "#ff6b6b",
    "#ffa500",
  ];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

export const getInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : "";
  const last = lastName ? lastName.charAt(0).toUpperCase() : "";
  return `${first}${last}` || "?";
};

// ── CLIPBOARD ─────────────────────────────────────────────────────────────────
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return true;
  }
};

// ── SCROLL UTILITIES ──────────────────────────────────────────────────────────
export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

export const scrollToElement = (elementId) => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

// ── RANDOM UTILITIES ──────────────────────────────────────────────────────────
export const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// ── ENVIRONMENT ───────────────────────────────────────────────────────────────
export const isDev = () => import.meta.env.VITE_ENVIRONMENT === "development";
export const isProd = () => import.meta.env.VITE_ENVIRONMENT === "production";
