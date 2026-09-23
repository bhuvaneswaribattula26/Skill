// src/config.ts — centralized, validated environment config
import dotenv from 'dotenv';
dotenv.config();

function require_env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional_env(key: string, fallback = ''): string {
  return process.env[key] || fallback;
}

export const config = {
  port: parseInt(optional_env('PORT', '4000'), 10),
  nodeEnv: optional_env('NODE_ENV', 'development'),
  isDev: optional_env('NODE_ENV', 'development') === 'development',

  database: {
    url: require_env('DATABASE_URL'),
  },

  jwt: {
    accessSecret: require_env('JWT_ACCESS_SECRET'),
    refreshSecret: require_env('JWT_REFRESH_SECRET'),
    accessExpiresIn: optional_env('JWT_ACCESS_EXPIRES_IN', '15m'),
    refreshExpiresIn: optional_env('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  redis: {
    url: optional_env('REDIS_URL', ''),
  },

  resend: {
    apiKey: optional_env('RESEND_API_KEY', ''),
    from: optional_env('EMAIL_FROM', 'noreply@skillswapcampus.com'),
  },

  cloudinary: {
    cloudName: optional_env('CLOUDINARY_CLOUD_NAME', ''),
    apiKey: optional_env('CLOUDINARY_API_KEY', ''),
    apiSecret: optional_env('CLOUDINARY_API_SECRET', ''),
  },

  ai: {
    geminiApiKey: optional_env('GEMINI_API_KEY', ''),
    anthropicApiKey: optional_env('ANTHROPIC_API_KEY', ''),
    explainTopN: parseInt(optional_env('AI_MATCH_EXPLAIN_TOP_N', '5'), 10),
  },

  youtube: {
    apiKey: optional_env('YOUTUBE_API_KEY', ''),
  },

  allowedEmailDomains: optional_env('ALLOWED_EMAIL_DOMAINS', '*.edu,*.edu.in,*.ac.in')
    .split(',')
    .map((d) => d.trim().toLowerCase()),

  corsOrigin: optional_env('CORS_ORIGIN', '*'),
  frontendUrl: optional_env('FRONTEND_URL', 'http://localhost:4000'),
} as const;
