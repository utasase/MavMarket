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

  // Server-side RPC keeps rate limiting, report insert, and rate-limit
  // logging inside one transactional boundary.
  const { error } = await supabase.rpc("create_report", {
    p_target_type: params.targetType,
    p_target_id: params.targetId,
    p_reason: params.reason,
    p_note: params.note ?? null,
  });

  if (error) throw error;
}
