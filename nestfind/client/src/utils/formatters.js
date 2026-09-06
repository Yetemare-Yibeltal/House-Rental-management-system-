// nestfind/nestfind/client/src/utils/formatters.js

// ── CURRENCY ──────────────────────────────────────────────────────────────────
export const formatCurrency = (amount, currency = "ETB") => {
  if (amount === null || amount === undefined) return "N/A";
  return `${currency} ${Number(amount).toLocaleString("en-ET")}`;
};

export const formatCompactCurrency = (amount) => {
  if (!amount) return "N/A";
  if (amount >= 1000000) return `ETB ${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `ETB ${(amount / 1000).toFixed(0)}k`;
  return `ETB ${amount}`;
};

// ── DATE & TIME ───────────────────────────────────────────────────────────────
export const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-ET", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatDateShort = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("en-ET", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (date) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString("en-ET", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatTimeAgo = (date) => {
  if (!date) return "N/A";
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return formatDateShort(date);
};

export const formatDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return "N/A";
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} year${years !== 1 ? "s" : ""}`;
  return `${years}y ${remainingMonths}m`;
};

export const formatDaysRemaining = (endDate) => {
  if (!endDate) return null;
  const days = Math.ceil(
    (new Date(endDate) - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return "Expired";
  if (days === 0) return "Today";
  if (days === 1) return "1 day left";
  if (days < 30) return `${days} days left`;
  if (days < 60) return "1 month left";
  const months = Math.floor(days / 30);
  return `${months} months left`;
};

// ── PROPERTY ──────────────────────────────────────────────────────────────────
export const formatArea = (area, unit = "sqm") => {
  if (!area) return "N/A";
  return `${area} ${unit}`;
};

export const formatBedrooms = (bedrooms) => {
  if (bedrooms === 0) return "Studio";
  if (bedrooms === 1) return "1 Bedroom";
  return `${bedrooms} Bedrooms`;
};

export const formatPropertyType = (type) => {
  if (!type) return "N/A";
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
};

export const formatFurnished = (furnished) => {
  const map = {
    fully_furnished: "Fully Furnished",
    semi_furnished: "Semi Furnished",
    unfurnished: "Unfurnished",
  };
  return map[furnished] || "N/A";
};

export const formatAddress = (location) => {
  if (!location) return "N/A";
  const parts = [location.address, location.subCity, location.city].filter(
    Boolean,
  );
  return parts.join(", ");
};

// ── USER ──────────────────────────────────────────────────────────────────────
export const formatFullName = (user) => {
  if (!user) return "Unknown";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim();
};

export const formatRole = (role) => {
  const map = { tenant: "Tenant", landlord: "Landlord", admin: "Admin" };
  return map[role] || role;
};

export const formatPhone = (phone) => {
  if (!phone) return "N/A";
  if (phone.startsWith("+251")) {
    return `+251 ${phone.slice(4, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
  }
  if (phone.startsWith("0")) {
    return `0${phone.slice(1, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`;
  }
  return phone;
};

// ── STATUS ────────────────────────────────────────────────────────────────────
export const formatStatus = (status) => {
  if (!status) return "N/A";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export const getStatusColor = (status) => {
  const colors = {
    active: "green",
    approved: "green",
    completed: "green",
    pending: "yellow",
    pending_review: "yellow",
    submitted: "yellow",
    in_progress: "blue",
    declined: "red",
    rejected: "red",
    cancelled: "red",
    suspended: "red",
    expired: "gray",
    inactive: "gray",
  };
  return colors[status] || "gray";
};

// ── FILE SIZE ─────────────────────────────────────────────────────────────────
export const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── NUMBER ────────────────────────────────────────────────────────────────────
export const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

export const formatRating = (rating) => {
  if (!rating) return "0.0";
  return Number(rating).toFixed(1);
};

export const formatPercentage = (value, total) => {
  if (!total) return "0%";
  return `${Math.round((value / total) * 100)}%`;
};

// ── TRUNCATE ──────────────────────────────────────────────────────────────────
export const truncate = (str, length = 100) => {
  if (!str) return "";
  if (str.length <= length) return str;
  return `${str.substring(0, length)}...`;
};

export const truncateWords = (str, wordCount = 20) => {
  if (!str) return "";
  const words = str.split(" ");
  if (words.length <= wordCount) return str;
  return `${words.slice(0, wordCount).join(" ")}...`;
};
