// One-shot helper: confirm (or create + confirm) the smoke-test user in the
// hosted Supabase project so `npm run smoke:hosted` can log in even when the
// project has "Confirm email" enabled.
//
// Usage:
//   node scripts/confirmSmokeUser.mjs
//
// Reads these from MavMarketApp/.env.local:
//   EXPO_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SUPABASE_SMOKE_EMAIL
//   SUPABASE_SMOKE_PASSWORD

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");

const fileEnv = loadEnvFile(path.join(appRoot, ".env.local"));

const supabaseUrl = getEnv("EXPO_PUBLIC_SUPABASE_URL");
const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const email = getEnv("SUPABASE_SMOKE_EMAIL");
const password = getEnv("SUPABASE_SMOKE_PASSWORD");

const missing = [
  ["EXPO_PUBLIC_SUPABASE_URL", supabaseUrl],
  ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey],
  ["SUPABASE_SMOKE_EMAIL", email],
  ["SUPABASE_SMOKE_PASSWORD", password],
].filter(([, v]) => !v).map(([k]) => k);

if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

const existing = await findUserByEmail(email);

if (existing) {
  console.log(`Found existing user ${email} (id=${existing.id}).`);
  const updates = {};
  if (!existing.email_confirmed_at) updates.email_confirm = true;
  if (password) updates.password = password;
  if (Object.keys(updates).length === 0) {
    console.log("User is already email-confirmed. Nothing to do.");
  } else {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, updates);
    if (error) {
      console.error("Failed to update user:", error.message);
      process.exit(1);
    }
    console.log(
      `Updated user: email_confirmed_at=${data.user?.email_confirmed_at ?? "null"}, password ${updates.password ? "reset" : "unchanged"}.`
    );
  }
} else {
  console.log(`No existing user ${email}. Creating with email_confirm=true.`);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("Failed to create user:", error.message);
    process.exit(1);
  }
  console.log(`Created user id=${data.user?.id}, email_confirmed_at=${data.user?.email_confirmed_at}.`);
}

console.log("Done. You can now run `npm run smoke:hosted`.");

async function findUserByEmail(targetEmail) {
  const pageSize = 200;
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) {
      console.error("Failed to list users:", error.message);
      process.exit(1);
    }
    const match = data.users.find((u) => (u.email || "").toLowerCase() === targetEmail.toLowerCase());
    if (match) return match;
    if (data.users.length < pageSize) return null;
    page += 1;
    if (page > 50) return null;
  }
}

function getEnv(key) {
  return process.env[key] || fileEnv[key] || "";
}

function loadEnvFile(filePath) {
  try {
    const contents = fs.readFileSync(filePath, "utf8");
    const out = {};
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}
