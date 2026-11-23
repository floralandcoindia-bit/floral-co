import { createHash } from "node:crypto";
import { db } from "./supabase.js";

export function send(res, status, body) {
  res.status(status).setHeader("Cache-Control", "no-store").json(body);
}

/** Returns true when the request may continue. Otherwise it has already answered. */
export function requireMethod(req, res, method) {
  if (req.method === method) return true;
  res.setHeader("Allow", method);
  send(res, 405, { error: "method_not_allowed" });
  return false;
}

export function clientIp(req) {
  const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return fwd || String(req.headers["x-real-ip"] || "") || "unknown";
}

const hash = (v) => createHash("sha256").update(String(v)).digest("hex").slice(0, 24);

/**
 * Fixed-window rate limit stored in Supabase (serverless functions have no memory between calls).
 * Fails OPEN if the database can't be reached, so a database hiccup never blocks real customers.
 */
export async function allow(key, limit, windowSeconds) {
  try {
    const { data, error } = await db().rpc("check_rate_limit", {
      p_key: `${key.split(":")[0]}:${hash(key)}`,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}

/** Safe body access: Vercel parses JSON, but be tolerant of a raw string. */
export function readBody(req) {
  const b = req.body;
  if (b && typeof b === "object") return b;
  if (typeof b === "string") {
    try {
      return JSON.parse(b);
    } catch {
      return {};
    }
  }
  return {};
}

export const str = (v, max) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
