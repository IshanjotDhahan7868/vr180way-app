export const EYE_W = 260;
export const EYE_H = 146; // 16:9

export const PARAM_LIMITS = {
  zoom: { min: 0.5, max: 3.0, step: 0.01 },
  stretchH: { min: 0.5, max: 2.5, step: 0.01 },
  stretchV: { min: 0.5, max: 2.5, step: 0.01 },
  cropX: { min: -1, max: 1, step: 0.01 },
  cropY: { min: -1, max: 1, step: 0.01 },
} as const;

export const PRESETS = [
  { key: "fill", label: "Default fit" },
  { key: "zoom15", label: "Zoom x1.5" },
  { key: "zoom2", label: "Zoom x2" },
  { key: "widen", label: "Widen x1.4" },
  { key: "tall", label: "Tall x1.4" },
  { key: "square", label: "4:3 -> 16:9" },
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/webm",
  "video/x-m4v",
  "video/x-ms-wmv",
];

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];

export const YOUTUBE_URL_REGEX = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/;

export const WORKER_URL = process.env.WORKER_URL || "http://localhost:8000";
export const API_SECRET = process.env.API_SECRET || "";
