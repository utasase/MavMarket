import { supabase } from "./supabase";

export type ReportTargetType = "listing" | "user";

export const REPORT_REASONS = [
  "Spam or misleading",
  "Prohibited item",
  "Suspected scam",
  "Harassment",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export async function createReport(params: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  note?: string;
}): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Rate limit: max 5 reports per 10 minutes
  const { data: limited } = await supabase.rpc("is_rate_limited", {
    p_user_id: user.id,
    p_action: "create_report",
    p_max_count: 5,
    p_window_secs: 600,
  });
  if (limited) throw new Error("You've submitted too many reports recently. Please wait and try again.");

  await supabase.from("rate_limit_log").insert({ user_id: user.id, action: "create_report" });

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: params.targetType,
    target_id: params.targetId,
    reason: params.reason,
    note: params.note ?? null,
  });

  if (error) throw error;
}
