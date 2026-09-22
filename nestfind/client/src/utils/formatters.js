// nestfind/nestfind/client/src/utils/formatters.js

export const formatCurrency = (amount, currency = "ETB") => {
  if (amount === null || amount === undefined || isNaN(amount))
    return `${currency} 0`;
  return `${currency} ${Number(amount).toLocaleString("en-ET", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatCompactCurrency = (amount) => {
  if (!amount && amount !== 0) return "ETB 0";
  if (amount >= 1_000_000) return `ETB ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `ETB ${(amount / 1_000).toFixed(0)}K`;
  return `ETB ${amount}`;
};

export const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";
  return Number(num).toLocaleString("en-ET");
};

export const formatDate = (date) => {
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
  if (!date) return "";
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
};

export const formatArea = (area) => {
  if (!area) return "N/A";
  return `${area} m²`;
};

export const formatBedrooms = (bedrooms) => {
  if (bedrooms === 0 || bedrooms === "0") return "Studio";
  if (!bedrooms) return "N/A";
  return `${bedrooms} Bedroom${Number(bedrooms) !== 1 ? "s" : ""}`;
};

export const formatFurnished = (furnished) => {
  if (!furnished) return "N/A";
  const map = {
    fully_furnished: "Fully Furnished",
    semi_furnished: "Semi Furnished",
    unfurnished: "Unfurnished",
  };
  return map[furnished] || furnished;
};

export const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatAddress = (location) => {
  if (!location) return "";
  const parts = [location.address, location.subCity, location.city].filter(
    Boolean,
  );
  return parts.join(", ");
};

export const formatDaysRemaining = (endDate) => {
  if (!endDate) return "N/A";
  const now = new Date();
  const end = new Date(endDate);
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Expired";
  if (diff === 0) return "Expires today";
  if (diff === 1) return "1 day left";
  if (diff < 30) return `${diff} days left`;
  if (diff < 365) return `${Math.floor(diff / 30)} months left`;
  return `${Math.floor(diff / 365)} year(s) left`;
};

export const truncate = (str, maxLength = 100) => {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
};

export const truncateWords = (str, wordCount = 20) => {
  if (!str) return "";
  const words = str.split(" ");
  if (words.length <= wordCount) return str;
  return `${words.slice(0, wordCount).join(" ")}...`;
};
