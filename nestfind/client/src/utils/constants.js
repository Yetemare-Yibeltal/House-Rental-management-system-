// nestfind/nestfind/client/src/utils/constants.js

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const ROLES = {
  TENANT: "tenant",
  LANDLORD: "landlord",
  ADMIN: "admin",
};

export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "villa", label: "Villa" },
  { value: "studio", label: "Studio" },
  { value: "room", label: "Single Room" },
  { value: "commercial", label: "Commercial Space" },
  { value: "office", label: "Office Space" },
  { value: "townhouse", label: "Townhouse" },
];

export const SUB_CITIES = [
  "Addis Ketema",
  "Akaky Kaliti",
  "Arada",
  "Bole",
  "Gullele",
  "Kirkos",
  "Kolfe Keranio",
  "Lideta",
  "Nifas Silk-Lafto",
  "Yeka",
  "Lemi Kura",
  "CMC",
  "Sarbet",
  "Gerji",
  "Megenagna",
  "Ayat",
  "Lebu",
  "Jemo",
];

export const FURNISHED_OPTIONS = [
  { value: "fully_furnished", label: "Fully Furnished" },
  { value: "semi_furnished", label: "Semi Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "popular", label: "Most Popular" },
];

export const AMENITIES = [
  { key: "wifi", label: "WiFi", icon: "📶" },
  { key: "parking", label: "Parking", icon: "🅿️" },
  { key: "generator", label: "Generator", icon: "⚡" },
  { key: "water24h", label: "24h Water", icon: "💧" },
  { key: "security", label: "Security", icon: "🔒" },
  { key: "cctv", label: "CCTV", icon: "📷" },
  { key: "elevator", label: "Elevator", icon: "🛗" },
  { key: "gym", label: "Gym", icon: "🏋️" },
  { key: "pool", label: "Swimming Pool", icon: "🏊" },
  { key: "airConditioning", label: "Air Conditioning", icon: "❄️" },
  { key: "heating", label: "Heating", icon: "🔥" },
  { key: "laundry", label: "Laundry", icon: "🧺" },
  { key: "dishwasher", label: "Dishwasher", icon: "🍽️" },
  { key: "refrigerator", label: "Refrigerator", icon: "🧊" },
  { key: "microwave", label: "Microwave", icon: "📦" },
  { key: "tv", label: "TV", icon: "📺" },
  { key: "balcony", label: "Balcony", icon: "🏗️" },
  { key: "garden", label: "Garden", icon: "🌿" },
  { key: "petsAllowed", label: "Pets Allowed", icon: "🐾" },
  { key: "smokingAllowed", label: "Smoking Allowed", icon: "🚬" },
  { key: "guestParking", label: "Guest Parking", icon: "🚗" },
  { key: "rooftop", label: "Rooftop Access", icon: "🏙️" },
];

export const MAINTENANCE_CATEGORIES = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "appliance", label: "Appliance" },
  { value: "structural", label: "Structural" },
  { value: "pest_control", label: "Pest Control" },
  { value: "painting", label: "Painting" },
  { value: "cleaning", label: "Cleaning" },
  { value: "hvac", label: "HVAC / Air Conditioning" },
  { value: "security", label: "Security / Locks" },
  { value: "internet", label: "Internet / TV" },
  { value: "other", label: "Other" },
];

export const URGENCY_LEVELS = [
  { value: "low", label: "Low — Not urgent" },
  { value: "medium", label: "Medium — Needs attention soon" },
  { value: "high", label: "High — Urgent" },
  { value: "emergency", label: "Emergency — Immediate action required" },
];

export const PAYMENT_METHODS = [
  { value: "telebirr", label: "📱 Telebirr" },
  { value: "cbe_birr", label: "🏦 CBE Birr" },
  { value: "bank_transfer", label: "🏛️ Bank Transfer" },
  { value: "cash", label: "💵 Cash" },
];

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  LISTINGS: "/listings",
  SEARCH: "/search",
  TENANT_DASHBOARD: "/tenant/dashboard",
  LANDLORD_DASHBOARD: "/landlord/dashboard",
  ADMIN_DASHBOARD: "/admin/dashboard",
};
