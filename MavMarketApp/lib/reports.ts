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

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: params.targetType,
    target_id: params.targetId,
    reason: params.reason,
    note: params.note ?? null,
  });

  if (error) throw error;
}
