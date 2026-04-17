// One-shot cleanup: remove leftover test/duplicate rows from Supabase auth.users.
// Reads EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
//
// Deletes:
//   - any e2e.probe+*@mavs.uta.edu users created by the smoke tests (prefix match)
//   - optional extra emails supplied via DELETE_STALE_USER_EMAILS
//     (comma-separated list, e.g. "you@mavs.uta.edu,teammate@uta.edu")
//
// Usage:
//   node scripts/deleteStaleAuthUsers.mjs
//   DELETE_STALE_USER_EMAILS="foo@mavs.uta.edu" node scripts/deleteStaleAuthUsers.mjs

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

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

const extraEmails = (process.env.DELETE_STALE_USER_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
const TARGET_EXACT = new Set(extraEmails);
const TARGET_PREFIX = "e2e.probe+";
const TARGET_DOMAIN = "@mavs.uta.edu";

const toDelete = [];

let page = 1;
const pageSize = 200;
while (true) {
  const { data, error } = await admin.auth.admin.listUsers({
    page,
    perPage: pageSize,
  });
  if (error) {
    console.error("Failed to list users:", error.message);
    process.exit(1);
  }
  for (const user of data.users) {
    const email = (user.email || "").toLowerCase();
    if (TARGET_EXACT.has(email)) {
      toDelete.push(user);
    } else if (
      email.startsWith(TARGET_PREFIX) &&
      email.endsWith(TARGET_DOMAIN)
    ) {
      toDelete.push(user);
    }
  }
  if (data.users.length < pageSize) break;
  page += 1;
  if (page > 50) break;
}

if (toDelete.length === 0) {
  console.log("No matching users to delete.");
  process.exit(0);
}

console.log(`Found ${toDelete.length} user(s) to delete:`);
for (const u of toDelete) {
  console.log(`  - ${u.email}  (${u.id})`);
}

let deleted = 0;
let failed = 0;
for (const u of toDelete) {
  const { error } = await admin.auth.admin.deleteUser(u.id);
  if (error) {
    console.error(`  FAIL  ${u.email}: ${error.message}`);
    failed += 1;
  } else {
    console.log(`  OK    ${u.email}`);
    deleted += 1;
  }
}

console.log(`\nDone. Deleted ${deleted}, failed ${failed}.`);
process.exit(failed > 0 ? 1 : 0);

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
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}
