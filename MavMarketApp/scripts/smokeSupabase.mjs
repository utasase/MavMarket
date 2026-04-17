// End-to-end smoke test for the Supabase auth flow the LoginPage uses.
//
// Hits the EXACT endpoints the app calls:
//   POST /auth/v1/signup
//   POST /auth/v1/token?grant_type=password
//   GET  /auth/v1/user
//
// Usage:
//   node scripts/smokeSupabase.mjs
//
// Optional env overrides:
//   SMOKE_SUPABASE_EMAIL, SMOKE_SUPABASE_PASSWORD
//     - If both are set, the script only tests sign-in with that account.
//     - Otherwise it creates a fresh e2e.probe+{timestamp}@mavs.uta.edu user.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadDotEnv() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (process.env[m[1]] == null) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  }
}
loadDotEnv();

const URL_BASE = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!URL_BASE || !ANON) {
  console.error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY"
  );
  process.exit(2);
}

function banner(title) {
  console.log("\n" + "=".repeat(60));
  console.log(title);
  console.log("=".repeat(60));
}

function summarize(body, max = 400) {
  const s = typeof body === "string" ? body : JSON.stringify(body);
  if (!s) return "(empty body)";
  return s.length > max ? s.slice(0, max) + "…[truncated]" : s;
}

async function jsonFetch(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${init.accessToken ?? ANON}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { res, text, json };
}

async function testSignup(email, password, name) {
  banner(`SIGNUP  POST ${URL_BASE}/auth/v1/signup`);
  console.log("  email:", email);
  const { res, json, text } = await jsonFetch(`${URL_BASE}/auth/v1/signup`, {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      data: name ? { display_name: name, name } : undefined,
    }),
  });
  console.log("  status:", res.status);
  console.log("  body:", summarize(json ?? text));
  if (!res.ok) {
    throw new Error(
      `Signup failed: ${json?.msg || json?.error_description || json?.error || text}`
    );
  }
  return json;
}

async function testPassword(email, password) {
  banner(`LOGIN   POST ${URL_BASE}/auth/v1/token?grant_type=password`);
  console.log("  email:", email);
  const { res, json, text } = await jsonFetch(
    `${URL_BASE}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
  console.log("  status:", res.status);
  console.log("  body:", summarize(json ?? text));
  if (!res.ok) {
    const err = json?.error_description || json?.msg || json?.error || text;
    let hint = "";
    if (/email not confirmed/i.test(err)) {
      hint =
        "\n  HINT: Supabase → Auth → Providers → Email: disable 'Confirm email' for immediate sign-in after signup.";
    }
    throw new Error(`Login failed: ${err}${hint}`);
  }
  if (!json?.access_token) {
    throw new Error("Login returned 200 but no access_token");
  }
  return json;
}

async function testUserInfo(accessToken) {
  banner(`USER    GET  ${URL_BASE}/auth/v1/user`);
  const { res, json, text } = await jsonFetch(`${URL_BASE}/auth/v1/user`, {
    accessToken,
  });
  console.log("  status:", res.status);
  console.log("  body:", summarize(json ?? text));
  if (!res.ok) throw new Error("user fetch failed");
  return json;
}

(async () => {
  console.log("Supabase auth smoke test");
  console.log("  url :", URL_BASE);
  console.log("  anon:", ANON.slice(0, 10) + "…");

  const overrideEmail = process.env.SMOKE_SUPABASE_EMAIL;
  const overridePw = process.env.SMOKE_SUPABASE_PASSWORD;

  if (overrideEmail && overridePw) {
    try {
      const tokens = await testPassword(overrideEmail, overridePw);
      const user = await testUserInfo(tokens.access_token);
      banner("RESULT");
      console.log(
        "  Sign-in works. UTA email?",
        /@(mavs\.uta|uta)\.edu$/i.test(user.email ?? "") ? "yes" : "no"
      );
      process.exit(0);
    } catch (e) {
      banner("RESULT");
      console.error("  FAILED:", e.message);
      process.exit(1);
    }
  }

  const ts = Date.now();
  const email = `e2e.probe+${ts}@mavs.uta.edu`;
  const password = "TestPass123!";
  const name = "E2E Probe";

  const results = { signup: null, login: null, user: null };

  try {
    results.signup = await testSignup(email, password, name);
  } catch (e) {
    console.error("  signup error:", e.message);
  }

  try {
    results.login = await testPassword(email, password);
    results.user = await testUserInfo(results.login.access_token);
  } catch (e) {
    console.error("  login error:", e.message);
  }

  banner("SUMMARY");
  console.log("  signup:", results.signup ? "OK" : "FAIL");
  console.log("  login :", results.login ? "OK" : "FAIL");
  console.log("  user  :", results.user ? "OK" : "FAIL");

  if (results.signup && results.login && results.user) {
    console.log(
      "\n  The same flow the app's Create Account button uses works end-to-end."
    );
    process.exit(0);
  } else {
    console.log("\n  One or more steps failed. See errors above.");
    process.exit(1);
  }
})();
