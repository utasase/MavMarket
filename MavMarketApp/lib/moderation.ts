import { supabase } from "./supabase";

export type ModerationAction = "escalate" | "resolve" | "dismiss" | "warn_user" | "remove_listing";
export type ReportStatus = "open" | "under_review" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporter_id: string;
  reporter_name: string;
  target_type: "listing" | "user";
  target_id: string;
  reason: string;
  note: string | null;
  status: ReportStatus;
  created_at: string;
}

const STATUS_MAP: Record<ModerationAction, ReportStatus> = {
  resolve:        "resolved",
  dismiss:        "dismissed",
  escalate:       "under_review",
  warn_user:      "under_review",
  remove_listing: "resolved",
};

export async function getOpenReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from("reports")
    .select(`
      id, reporter_id, target_type, target_id, reason, note, status, created_at,
      reporter:users!reporter_id(name)
    `)
    .in("status", ["open", "under_review"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((row: any) => ({
    id: row.id,
    reporter_id: row.reporter_id,
    reporter_name: row.reporter?.name ?? "Unknown",
    target_type: row.target_type,
    target_id: row.target_id,
    reason: row.reason,
    note: row.note ?? null,
    status: row.status,
    created_at: row.created_at,
  }));
}

export async function getReportTargetName(
  targetType: "listing" | "user",
  targetId: string
): Promise<string> {
  if (targetType === "listing") {
    const { data } = await supabase
      .from("listings")
      .select("title")
      .eq("id", targetId)
      .single();
    return data?.title ?? "Deleted listing";
  } else {
    const { data } = await supabase
      .from("users")
      .select("name")
      .eq("id", targetId)
      .single();
    return data?.name ?? "Unknown user";
  }
}

export interface ReportTargetDetails {
  type: "listing" | "user";
  name: string;
  imageUrl: string | null;
  subtitle: string;
}

export async function getReportTargetDetails(
  targetType: "listing" | "user",
  targetId: string
): Promise<ReportTargetDetails> {
  if (targetType === "listing") {
    const { data } = await supabase
      .from("listings")
      .select("title, price, status, image_url, seller:users!seller_id(name)")
      .eq("id", targetId)
      .single();
    return {
      type: "listing",
      name: data?.title ?? "Deleted listing",
      imageUrl: data?.image_url ?? null,
      subtitle: data
        ? `$${data.price} · ${data.status} · seller: ${(data.seller as any)?.name ?? "unknown"}`
        : "Listing not found",
    };
  } else {
    const { data } = await supabase
      .from("users")
      .select("name, avatar_url, rating")
      .eq("id", targetId)
      .single();
    return {
      type: "user",
      name: data?.name ?? "Unknown user",
      imageUrl: data?.avatar_url ?? null,
      subtitle: data
        ? `Rating: ${data.rating != null ? data.rating.toFixed(1) : "no rating"}`
        : "User not found",
    };
  }
}

export async function takeModAction(params: {
  reportId: string;
  action: ModerationAction;
  reason?: string;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error: actionError } = await supabase.from("moderation_actions").insert({
    report_id: params.reportId,
    moderator_id: user.id,
    action: params.action,
    reason: params.reason ?? null,
  });
  if (actionError) throw actionError;

  const { error: reportError } = await supabase
    .from("reports")
    .update({
      status: STATUS_MAP[params.action],
      moderator_id: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.reportId);
  if (reportError) throw reportError;

  // Best-effort audit log — don't throw if this fails
  await supabase.from("audit_events").insert({
    actor_id: user.id,
    action: `moderation.${params.action}`,
    target_table: "reports",
    target_id: params.reportId,
    metadata: { reason: params.reason ?? null },
  });
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return data?.is_admin === true;
}
