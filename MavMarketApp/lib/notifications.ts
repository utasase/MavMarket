import { supabase } from "./supabase";
import { type Notification } from "./types";

export async function createNotification(params: {
  userId: string;
  type: Notification["type"];
  title: string;
  message: string;
  avatarUrl?: string;
  itemImage?: string;
}): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    avatar_url: params.avatarUrl ?? null,
    item_image: params.itemImage ?? null,
    read: false,
  });
  if (error) throw error;
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, message, read, avatar_url, item_image, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    type: row.type as Notification["type"],
    title: row.title,
    message: row.message,
    timestamp: formatRelativeTime(row.created_at),
    read: row.read ?? false,
    avatar: row.avatar_url ?? undefined,
    itemImage: row.item_image ?? undefined,
  }));
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
  if (error) throw error;
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
