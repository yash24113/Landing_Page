// src/lib/env.ts
import { z } from "zod";

/** ─────────────────────────────────────────────────────────────
 *  1) Zod schema for all .env you actually use in the app
 *  2) Sensible defaults for header names
 *  3) Single source for API base + headers
 *  ──────────────────────────────────────────────────────────── */
const envSchema = z.object({
  // App mode
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Public site URLs
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Backend base (YOU SAID you use /landing)
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url()
    .default("http://localhost:7000/landing"),

  // Company info (optional)
  NEXT_PUBLIC_COMPANY_NAME: z.string().optional(),
  NEXT_PUBLIC_COMPANY_PHONE: z.string().optional(),
  NEXT_PUBLIC_COMPANY_EMAIL: z.string().email().optional(),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional(),

// N8N_WEBHOOK_URL = z.string().optional(),
//  N8N_API_KEY = z.string().optional(),


  // Analytics (optional)
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  NEXT_PUBLIC_FACEBOOK_PIXEL_ID: z.string().optional(),

  // Email services (optional)
  RESEND_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // DB / Supabase (optional)
  DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // NextAuth / Security (optional)
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Monitoring (optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  /** ── API auth headers (PUBLIC because you’re sending on client) ── */
  NEXT_PUBLIC_API_KEY: z.string().optional(),                 // e.g. "rajeshsir"
  NEXT_PUBLIC_ADMIN_EMAIL: z.string().email().optional(),     // e.g. "vivek..."
  NEXT_PUBLIC_API_KEY_HEADER: z.string().default("x-api-key"),
  NEXT_PUBLIC_ADMIN_EMAIL_HEADER: z.string().default("x-admin-email"),
});

export const env = envSchema.parse(process.env);

// Convenience flags
export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";

// Extra validation for prod (optional)
export function validateProductionEnv() {
  if (isProduction) {
    const requiredVars = [
      "NEXT_PUBLIC_APP_URL",
      "NEXT_PUBLIC_COMPANY_PHONE",
      "NEXT_PUBLIC_COMPANY_EMAIL",
      "NEXT_PUBLIC_WHATSAPP_NUMBER",
    ];
    const missing = requiredVars.filter((k) => !(process.env as any)[k]);
    if (missing.length) {
      throw new Error(
        `Missing required environment variables for production: ${missing.join(", ")}`
      );
    }
  }
}

/** Build absolute API URL from the configured base.
 *  Works for bases that already include a path (e.g. /landing). */
export function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  // priority: parsed env → raw process.env → hard default (YOUR /landing base)
  const base =
    env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:7000/landing";

  try {
    const u = new URL(base);
    // join without double slashes
    const basePath = u.pathname.replace(/\/$/, "");
    return `${u.origin}${basePath}${normalizedPath}`;
  } catch {
    // If somehow base is invalid, still return something usable
    return `http://localhost:7000/landing${normalizedPath}`;
  }
}

/** Public headers to pass on every request that needs auth. */
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    accept: "application/json",
  };

  if (env.NEXT_PUBLIC_API_KEY) {
    headers[env.NEXT_PUBLIC_API_KEY_HEADER] = env.NEXT_PUBLIC_API_KEY;
  }
  if (env.NEXT_PUBLIC_ADMIN_EMAIL) {
    headers[env.NEXT_PUBLIC_ADMIN_EMAIL_HEADER] = env.NEXT_PUBLIC_ADMIN_EMAIL;
  }
  return headers;
}
