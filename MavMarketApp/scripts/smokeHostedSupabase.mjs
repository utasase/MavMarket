import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");

const args = new Set(process.argv.slice(2));
const allowResidue = args.has("--allow-residue");
const help = args.has("--help") || args.has("-h");

if (help) {
  printUsage();
  process.exit(0);
}

const fileEnv = loadEnvFile(path.join(appRoot, ".env.local"));
const env = {
  supabaseUrl: getEnv("EXPO_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: getEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY"),
  serviceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  smokeEmail: getEnv("SUPABASE_SMOKE_EMAIL"),
  smokePassword: getEnv("SUPABASE_SMOKE_PASSWORD"),
  smokeName: getEnv("SUPABASE_SMOKE_NAME") || "MavMarket Smoke Test",
  allowSignup: getEnv("SUPABASE_SMOKE_ALLOW_SIGNUP") === "1",
  keepCreatedUser: getEnv("SUPABASE_SMOKE_KEEP_USER") === "1",
};

validateConfig(env, { allowResidue });

const smokeId = `smoke_${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}_${randomUUID().slice(0, 8)}`;
const authedClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
const anonClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
const cleanupClient = env.serviceRoleKey
  ? createClient(env.supabaseUrl, env.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null;

const state = {
  smokeId,
  createdUser: false,
  userId: null,
  artifacts: {
    listingId: null,
    conversationId: null,
    reportId: null,
    notificationId: null,
  },
};

try {
  console.log(`Starting hosted Supabase smoke test: ${smokeId}`);

  await runStep("Authenticate smoke user", async () => {
    const user = await ensureAuthenticatedUser(authedClient, env, state);
    state.userId = user.id;
    console.log(`  Authenticated as ${user.email ?? env.smokeEmail}`);
  });

  await runStep("Verify authenticated profile access", async () => {
    const { data, error } = await authedClient
      .from("users")
      .select("id, email, name")
      .eq("id", state.userId)
      .single();

    if (error) throw error;
    if (!data?.id) throw new Error("Authenticated user row was not readable");
  });

  await runStep("Verify unauthenticated reads are blocked", async () => {
    const { data, error } = await anonClient
      .from("users")
      .select("id")
      .eq("id", state.userId);

    if (error) throw error;
    if ((data ?? []).length !== 0) {
      throw new Error("Unauthenticated client unexpectedly read protected user rows");
    }
  });

  await runStep("Verify unauthenticated listing writes are blocked", async () => {
    const { error } = await anonClient.from("listings").insert({
      seller_id: state.userId,
      title: `${smokeId} anon listing`,
      price: 9.99,
      category: "Books",
      condition: "Good",
      description: "Anonymous write should fail",
      image_url: "https://example.com/anon.png",
      pickup_location_name: "Smoke Test",
      pickup_location_address: "701 S Nedderman Dr, Arlington, TX",
      is_on_campus: true,
      status: "active",
    });

    if (!error) {
      throw new Error("Unauthenticated listing insert unexpectedly succeeded");
    }
  });

  await runStep("Create and read back a listing", async () => {
    const { data, error } = await authedClient
      .from("listings")
      .insert({
        seller_id: state.userId,
        title: `${smokeId} listing`,
        price: 25.0,
        category: "Books",
        condition: "Good",
        description: `${smokeId} hosted smoke listing`,
        image_url: "https://example.com/smoke-listing.png",
        pickup_location_name: "Central Library",
        pickup_location_address: "702 Planetarium Pl, Arlington, TX",
        is_on_campus: true,
        status: "active",
      })
      .select("id, seller_id, status, title")
      .single();

    if (error) throw error;
    if (!data?.id) throw new Error("Listing insert did not return an id");
    state.artifacts.listingId = data.id;

    const { data: readBack, error: readError } = await authedClient
      .from("listings")
      .select("id, title, status, locked_by, locked_at")
      .eq("id", data.id)
      .single();

    if (readError) throw readError;
    if (readBack?.status !== "active") {
      throw new Error(`Expected active listing status, got ${readBack?.status ?? "missing"}`);
    }
  });

  await runStep("Create and read back a conversation", async () => {
    const { data, error } = await authedClient
      .from("conversations")
      .upsert(
        {
          listing_id: state.artifacts.listingId,
          buyer_id: state.userId,
          seller_id: state.userId,
        },
        { onConflict: "listing_id,buyer_id,seller_id" }
      )
      .select("id, buyer_id, seller_id, listing_id")
      .single();

    if (error) throw error;
    if (!data?.id) throw new Error("Conversation insert did not return an id");
    state.artifacts.conversationId = data.id;
  });

  await runStep("Send a message through the transactional RPC", async () => {
    const text = `${smokeId} hello`;
    const { error } = await authedClient.rpc("send_message", {
      p_conversation_id: state.artifacts.conversationId,
      p_sender_id: state.userId,
      p_text: text,
    });

    if (error) throw error;

    const { data, error: readError } = await authedClient
      .from("messages")
      .select("id, sender_id, text")
      .eq("conversation_id", state.artifacts.conversationId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (readError) throw readError;
    const latest = data?.[0];
    if (!latest || latest.text !== text || latest.sender_id !== state.userId) {
      throw new Error("Message RPC succeeded but the inserted message was not visible");
    }
  });

  await runStep("Insert and read a notification row", async () => {
    const { data, error } = await authedClient
      .from("notifications")
      .insert({
        user_id: state.userId,
        type: "system",
        title: `${smokeId} notification`,
        message: `${smokeId} notification body`,
        read: false,
      })
      .select("id, user_id, title")
      .single();

    if (error) throw error;
    if (!data?.id) throw new Error("Notification insert did not return an id");
    state.artifacts.notificationId = data.id;

    const { data: readBack, error: readError } = await authedClient
      .from("notifications")
      .select("id, title, read")
      .eq("id", data.id)
      .single();

    if (readError) throw readError;
    if (readBack?.title !== `${smokeId} notification`) {
      throw new Error("Notification readback did not match inserted row");
    }
  });

  await runStep("Create a report through the transactional RPC", async () => {
    const note = `${smokeId} report`;
    const { error } = await authedClient.rpc("create_report", {
      p_target_type: "listing",
      p_target_id: state.artifacts.listingId,
      p_reason: "Other",
      p_note: note,
    });

    if (error) throw error;

    const { data, error: readError } = await authedClient
      .from("reports")
      .select("id, reporter_id, reason, note")
      .eq("reporter_id", state.userId)
      .eq("note", note)
      .order("created_at", { ascending: false })
      .limit(1);

    if (readError) throw readError;
    const report = data?.[0];
    if (!report?.id) throw new Error("Created report was not visible to the reporter");
    state.artifacts.reportId = report.id;
  });

  await runStep("Reserve and release a listing", async () => {
    const { data: reserved, error } = await authedClient.rpc("reserve_listing", {
      p_listing_id: state.artifacts.listingId,
    });

    if (error) throw error;
    if (reserved !== true) {
      throw new Error(`Expected reserve_listing to return true, got ${String(reserved)}`);
    }

    const { data: lockedRow, error: lockReadError } = await authedClient
      .from("listings")
      .select("id, locked_by, locked_at")
      .eq("id", state.artifacts.listingId)
      .single();

    if (lockReadError) throw lockReadError;
    if (lockedRow?.locked_by !== state.userId || !lockedRow?.locked_at) {
      throw new Error("reserve_listing did not persist the expected lock state");
    }

    const { error: releaseError } = await authedClient.rpc("release_listing", {
      p_listing_id: state.artifacts.listingId,
    });

    if (releaseError) throw releaseError;

    const { data: releasedRow, error: releaseReadError } = await authedClient
      .from("listings")
      .select("id, locked_by, locked_at")
      .eq("id", state.artifacts.listingId)
      .single();

    if (releaseReadError) throw releaseReadError;
    if (releasedRow?.locked_by !== null || releasedRow?.locked_at !== null) {
      throw new Error("release_listing did not clear the lock state");
    }
  });

  console.log("Hosted Supabase smoke test passed.");
} catch (error) {
  console.error("Hosted Supabase smoke test failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await cleanupArtifacts({
    authedClient,
    cleanupClient,
    state,
    keepCreatedUser: env.keepCreatedUser,
    allowResidue,
  }).catch((error) => {
    console.error("Cleanup failed.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

async function ensureAuthenticatedUser(client, env, state) {
  const loginResult = await client.auth.signInWithPassword({
    email: env.smokeEmail,
    password: env.smokePassword,
  });

  if (!loginResult.error && loginResult.data.user) {
    return loginResult.data.user;
  }

  if (!env.allowSignup) {
    throw loginResult.error ?? new Error("Smoke user login failed");
  }

  const signUpResult = await client.auth.signUp({
    email: env.smokeEmail,
    password: env.smokePassword,
    options: {
      data: {
        name: env.smokeName,
      },
    },
  });

  if (signUpResult.error) throw signUpResult.error;
  if (!signUpResult.data.user) {
    throw new Error("Signup did not return a user");
  }
  if (!signUpResult.data.session) {
    throw new Error(
      "Signup succeeded without a session. The hosted project likely requires email confirmation. Create the smoke user manually and rerun with the saved password."
    );
  }

  state.createdUser = true;
  return signUpResult.data.user;
}

async function cleanupArtifacts({
  authedClient,
  cleanupClient,
  state,
  keepCreatedUser,
  allowResidue,
}) {
  const ids = Object.values(state.artifacts).filter(Boolean);

  if (ids.length === 0 && !state.createdUser) return;

  if (!cleanupClient) {
    await cleanupListingAsOwner(authedClient, state.artifacts.listingId).catch(() => {});

    if (allowResidue) {
      console.warn(
        "Cleanup was partial because SUPABASE_SERVICE_ROLE_KEY is not configured. Messages, reports, conversations, and notifications may remain."
      );
      return;
    }

    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for full cleanup because normal authenticated users cannot delete smoke-test messages, reports, conversations, or notifications."
    );
  }

  console.log("Cleaning up hosted smoke artifacts...");

  if (state.artifacts.notificationId) {
    await cleanupClient.from("notifications").delete().eq("id", state.artifacts.notificationId).throwOnError();
  }

  if (state.artifacts.reportId) {
    await cleanupClient.from("reports").delete().eq("id", state.artifacts.reportId).throwOnError();
  }

  if (state.artifacts.conversationId) {
    await cleanupClient.from("conversations").delete().eq("id", state.artifacts.conversationId).throwOnError();
  }

  if (state.artifacts.listingId) {
    await cleanupClient.from("listings").delete().eq("id", state.artifacts.listingId).throwOnError();
  }

  if (state.createdUser && !keepCreatedUser && state.userId) {
    const { error } = await cleanupClient.auth.admin.deleteUser(state.userId);
    if (error) throw error;
  }
}

async function cleanupListingAsOwner(client, listingId) {
  if (!listingId) return;
  const { error } = await client.from("listings").delete().eq("id", listingId);
  if (error) throw error;
}

async function runStep(label, fn) {
  process.stdout.write(`- ${label}... `);
  await fn();
  process.stdout.write("ok\n");
}

function validateConfig(env, { allowResidue }) {
  const missing = [
    ["EXPO_PUBLIC_SUPABASE_URL", env.supabaseUrl],
    ["EXPO_PUBLIC_SUPABASE_ANON_KEY", env.supabaseAnonKey],
    ["SUPABASE_SMOKE_EMAIL", env.smokeEmail],
    ["SUPABASE_SMOKE_PASSWORD", env.smokePassword],
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.map(([key]) => key).join(", ")}`);
  }

  if (!isUtaEmail(env.smokeEmail)) {
    throw new Error("SUPABASE_SMOKE_EMAIL must use a @mavs.uta.edu or @uta.edu address");
  }

  if (!env.serviceRoleKey && !allowResidue) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for full cleanup. Re-run with --allow-residue only if you accept leftover smoke rows."
    );
  }
}

function isUtaEmail(email) {
  const normalized = String(email).trim().toLowerCase();
  return normalized.endsWith("@mavs.uta.edu") || normalized.endsWith("@uta.edu");
}

function getEnv(key) {
  return process.env[key] ?? fileEnv[key] ?? "";
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const values = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function printUsage() {
  console.log(`Hosted Supabase smoke test

Usage:
  npm run smoke:hosted
  npm run smoke:hosted -- --allow-residue

Required env vars:
  EXPO_PUBLIC_SUPABASE_URL
  EXPO_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SMOKE_EMAIL
  SUPABASE_SMOKE_PASSWORD

Recommended env vars:
  SUPABASE_SERVICE_ROLE_KEY    Required for full cleanup

Optional env vars:
  SUPABASE_SMOKE_NAME          Defaults to "MavMarket Smoke Test"
  SUPABASE_SMOKE_ALLOW_SIGNUP  Set to 1 to create the smoke user if login fails
  SUPABASE_SMOKE_KEEP_USER     Set to 1 to preserve a newly created smoke user

Flags:
  --allow-residue              Allow partial cleanup when no service role key is configured
  --help, -h                   Show this help text
`);
}
