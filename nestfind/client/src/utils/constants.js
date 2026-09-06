// nestfind/nestfind/client/src/utils/constants.js

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
export const APP_NAME = "NestFind";
export const APP_TAGLINE =
  "Ethiopia's Premier AI-Powered House Rental Platform";

// ── ROLES ─────────────────────────────────────────────────────────────────────
export const ROLES = {
  TENANT: "tenant",
  LANDLORD: "landlord",
  ADMIN: "admin",
};

// ── PROPERTY TYPES ────────────────────────────────────────────────────────────
export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "house", label: "House" },
  { value: "studio", label: "Studio" },
  { value: "duplex", label: "Duplex" },
  { value: "penthouse", label: "Penthouse" },
  { value: "commercial", label: "Commercial" },
  { value: "other", label: "Other" },
];

// ── SUB CITIES ────────────────────────────────────────────────────────────────
export const SUB_CITIES = [
  "Bole",
  "Kirkos",
  "Yeka",
  "Arada",
  "Lideta",
  "Gulele",
  "Kolfe Keranyo",
  "Nifas Silk-Lafto",
  "Akaky Kaliti",
  "Lemi Kura",
];

// ── FURNISHED OPTIONS ─────────────────────────────────────────────────────────
export const FURNISHED_OPTIONS = [
  { value: "fully_furnished", label: "Fully Furnished" },
  { value: "semi_furnished", label: "Semi Furnished" },
  { value: "unfurnished", label: "Unfurnished" },
];

// ── AMENITIES ─────────────────────────────────────────────────────────────────
export const AMENITIES = [
  { key: "wifi", label: "Wi-Fi", icon: "📶" },
  { key: "parking", label: "Parking", icon: "🚗" },
  { key: "generator", label: "Generator", icon: "⚡" },
  { key: "security24h", label: "24h Security", icon: "🔒" },
  { key: "cctv", label: "CCTV", icon: "📹" },
  { key: "elevator", label: "Elevator", icon: "🛗" },
  { key: "pool", label: "Swimming Pool", icon: "🏊" },
  { key: "gym", label: "Gym", icon: "💪" },
  { key: "garden", label: "Garden", icon: "🌿" },
  { key: "balcony", label: "Balcony", icon: "🏠" },
  { key: "airConditioning", label: "Air Conditioning", icon: "❄️" },
  { key: "waterTank", label: "Water Tank", icon: "💧" },
  { key: "solarPower", label: "Solar Power", icon: "☀️" },
  { key: "petFriendly", label: "Pet Friendly", icon: "🐾" },
  { key: "childFriendly", label: "Child Friendly", icon: "👶" },
  { key: "laundry", label: "Laundry", icon: "👕" },
  { key: "rooftopTerrace", label: "Rooftop Terrace", icon: "🏙️" },
  { key: "intercom", label: "Intercom", icon: "📞" },
];

// ── SORT OPTIONS ──────────────────────────────────────────────────────────────
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "most_viewed", label: "Most Viewed" },
];

// ── BOOKING STATUS ────────────────────────────────────────────────────────────
export const BOOKING_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  DECLINED: "declined",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  NO_SHOW: "no_show",
};

// ── RENTAL STATUS ─────────────────────────────────────────────────────────────
export const RENTAL_STATUS = {
  ACTIVE: "active",
  EXPIRED: "expired",
  TERMINATED: "terminated_early",
  PENDING: "pending_start",
};

// ── PAYMENT TYPES ─────────────────────────────────────────────────────────────
export const PAYMENT_TYPES = [
  { value: "monthly_rent", label: "Monthly Rent" },
  { value: "security_deposit", label: "Security Deposit" },
  { value: "late_payment_fee", label: "Late Payment Fee" },
  { value: "maintenance_fee", label: "Maintenance Fee" },
  { value: "other", label: "Other" },
];

// ── PAYMENT METHODS ───────────────────────────────────────────────────────────
export const PAYMENT_METHODS = [
  { value: "cbe_transfer", label: "CBE Transfer" },
  { value: "telebirr", label: "Telebirr" },
  { value: "visa_debit", label: "Visa Debit" },
  { value: "mastercard", label: "Mastercard" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

// ── MAINTENANCE CATEGORIES ────────────────────────────────────────────────────
export const MAINTENANCE_CATEGORIES = [
  { value: "plumbing", label: "Plumbing", icon: "🔧" },
  { value: "electrical", label: "Electrical", icon: "⚡" },
  { value: "hvac", label: "HVAC", icon: "❄️" },
  { value: "structural", label: "Structural", icon: "🏗️" },
  { value: "appliance", label: "Appliance", icon: "🏠" },
  { value: "pest_control", label: "Pest Control", icon: "🐛" },
  { value: "cleaning", label: "Cleaning", icon: "🧹" },
  { value: "security", label: "Security", icon: "🔒" },
  { value: "internet", label: "Internet", icon: "📶" },
  { value: "painting", label: "Painting", icon: "🎨" },
  { value: "flooring", label: "Flooring", icon: "🪵" },
  { value: "other", label: "Other", icon: "🔨" },
];

// ── URGENCY LEVELS ────────────────────────────────────────────────────────────
export const URGENCY_LEVELS = [
  { value: "low", label: "Low", color: "green" },
  { value: "medium", label: "Medium", color: "yellow" },
  { value: "high", label: "High", color: "orange" },
  { value: "emergency", label: "Emergency", color: "red" },
];

// ── KYC STATUS ────────────────────────────────────────────────────────────────
export const KYC_STATUS = {
  NOT_SUBMITTED: "not_submitted",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// ── PAGINATION ────────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 12;
export const DEFAULT_PAGE = 1;

// ── AI FEATURES ───────────────────────────────────────────────────────────────
export const AI_FEATURES = {
  CHAT: "chat_assistant",
  SEARCH: "smart_search",
  RECOMMENDATIONS: "property_recommendation",
  RENT_ADVISOR: "rent_advisor",
  LEASE_EXPLAINER: "lease_explainer",
  MAINTENANCE: "maintenance_diagnosis",
  DESCRIPTION: "property_description",
  FRAUD: "fraud_detection",
};

// ── VOICE LANGUAGES ───────────────────────────────────────────────────────────
export const VOICE_LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-ET", label: "English (Ethiopia)" },
  { value: "am-ET", label: "Amharic" },
];

// ── LOCAL STORAGE KEYS ────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "nestfind_access_token",
  USER: "nestfind_user",
  THEME: "nestfind_theme",
  AI_PREFERENCES: "nestfind_ai_prefs",
};

// ── ROUTES ────────────────────────────────────────────────────────────────────
export const ROUTES = {
  HOME: "/",
  LISTINGS: "/listings",
  PROPERTY: "/property/:id",
  SEARCH: "/search",
  ABOUT: "/about",
  CONTACT: "/contact",
  BLOG: "/blog",
  FAQ: "/faq",
  LOGIN: "/login",
  REGISTER: "/register",
  OTP: "/verify-otp",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  TENANT_DASHBOARD: "/tenant/dashboard",
  LANDLORD_DASHBOARD: "/landlord/dashboard",
  ADMIN_DASHBOARD: "/admin/dashboard",
};
