import { type RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export interface DBConversation {
  id: string;
  contactName: string;
  contactAvatar: string;
  contactId: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  itemTitle: string;
  itemImage: string;
  listingId: string;
}

export interface DBMessage {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export async function getConversations(userId: string): Promise<DBConversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select(`
      id,
      last_message,
      last_message_time,
      buyer_id,
      seller_id,
      listing_id,
      buyer:users!conversations_buyer_id_fkey(name, avatar_url),
      seller:users!conversations_seller_id_fkey(name, avatar_url),
      listing:listings(title, image_url)
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_time", { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return data.map((row: any) => {
    const isBuyer = row.buyer_id === userId;
    const contact = isBuyer ? row.seller : row.buyer;
    const contactId = isBuyer ? row.seller_id : row.buyer_id;
    return {
      id: row.id,
      contactName: contact?.name ?? "Unknown",
      contactAvatar: contact?.avatar_url ?? "",
      contactId,
      lastMessage: row.last_message ?? "",
      lastMessageTime: row.last_message_time
        ? new Date(row.last_message_time).toLocaleDateString()
        : "",
      unread: 0,
      itemTitle: row.listing?.title ?? "",
      itemImage: row.listing?.image_url ?? "",
      listingId: row.listing_id ?? "",
    };
  });
}

export async function getMessages(conversationId: string): Promise<DBMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, text, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    text: row.text,
    createdAt: new Date(row.created_at).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
  }));
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<void> {
  const { error: msgError } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, text });
  if (msgError) throw msgError;

  const { error: convError } = await supabase
    .from("conversations")
    .update({ last_message: text, last_message_time: new Date().toISOString() })
    .eq("id", conversationId);
  if (convError) throw convError;
}

export function subscribeToMessages(
  conversationId: string,
  callback: (message: DBMessage) => void
): RealtimeChannel {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const row = payload.new as any;
        callback({
          id: row.id,
          senderId: row.sender_id,
          text: row.text,
          createdAt: new Date(row.created_at).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
        });
      }
    )
    .subscribe();
}

export async function createConversation(
  listingId: string,
  buyerId: string,
  sellerId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("conversations")
    .upsert(
      { listing_id: listingId, buyer_id: buyerId, seller_id: sellerId },
      { onConflict: "listing_id,buyer_id,seller_id" }
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
