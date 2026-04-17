import { type RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { createNotification } from "./notifications";
import { type Message, type Conversation } from "./types";
import { DEMO_MODE, conversations as mockConversations, listings as mockListings } from "../data/mockData";

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

// -----------------------------------------------------------------------------
// Demo-mode in-memory store. When EXPO_PUBLIC_DEMO_MODE=true, every helper in
// this file reads/writes from here instead of Supabase. This lets the demo run
// through "open thread, send message, receive reply" without any backend.
// -----------------------------------------------------------------------------

interface DemoConvoEntry {
  convo: DBConversation;
  messages: DBMessage[];
}

const demoStore = new Map<string, DemoConvoEntry>();
let demoStoreInitialized = false;

function ensureDemoStore() {
  if (demoStoreInitialized) return;
  demoStoreInitialized = true;
  for (const c of mockConversations) {
    // Try to resolve a sellerId and listingId from the mock listings so the
    // demo threads link up with the right seller.
    const listing = mockListings.find((l) => l.title === c.itemTitle);
    const convo: DBConversation = {
      id: c.id,
      contactName: c.contactName,
      contactAvatar: c.contactAvatar,
      contactId: listing?.sellerId ?? `seller-${c.contactName.toLowerCase().replace(/\W+/g, "-")}`,
      lastMessage: c.lastMessage,
      lastMessageTime: c.lastMessageTime,
      unread: c.unread,
      itemTitle: c.itemTitle,
      itemImage: c.itemImage,
      listingId: listing?.id ?? "",
    };
    const messages: DBMessage[] = c.messages.map((m) => ({
      id: m.id,
      senderId: m.senderId, // "me" or "other" — preserved for layout symmetry
      text: m.text,
      createdAt: m.timestamp,
    }));
    demoStore.set(c.id, { convo, messages });
  }
}

export async function getConversations(userId: string): Promise<DBConversation[]> {
  if (DEMO_MODE) {
    ensureDemoStore();
    return Array.from(demoStore.values()).map((e) => e.convo);
  }
  const [convResult, readsResult] = await Promise.all([
    supabase
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
      .order("last_message_time", { ascending: false }),
    supabase
      .from("message_reads")
      .select("conversation_id, last_read_at")
      .eq("user_id", userId),
  ]);

  if (convResult.error) throw convResult.error;
  if (!convResult.data) return [];

  const readMap = new Map(
    (readsResult.data ?? []).map((r) => [r.conversation_id, r.last_read_at])
  );

  return convResult.data.map((row: any) => {
    const isBuyer = row.buyer_id === userId;
    const contact = isBuyer ? row.seller : row.buyer;
    const contactId = isBuyer ? row.seller_id : row.buyer_id;
    const lastReadAt = readMap.get(row.id);
    const unread =
      row.last_message_time &&
      (!lastReadAt || new Date(row.last_message_time) > new Date(lastReadAt))
        ? 1
        : 0;
    return {
      id: row.id,
      contactName: contact?.name ?? "Unknown",
      contactAvatar: contact?.avatar_url ?? "",
      contactId,
      lastMessage: row.last_message ?? "",
      lastMessageTime: row.last_message_time
        ? new Date(row.last_message_time).toLocaleDateString()
        : "",
      unread,
      itemTitle: row.listing?.title ?? "",
      itemImage: row.listing?.image_url ?? "",
      listingId: row.listing_id ?? "",
    };
  });
}

export async function markConversationRead(
  userId: string,
  conversationId: string
): Promise<void> {
  if (DEMO_MODE) {
    ensureDemoStore();
    const entry = demoStore.get(conversationId);
    if (entry) entry.convo.unread = 0;
    return;
  }
  await supabase
    .from("message_reads")
    .upsert(
      {
        user_id: userId,
        conversation_id: conversationId,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: "user_id,conversation_id" }
    );
}

export async function getMessages(conversationId: string): Promise<DBMessage[]> {
  if (DEMO_MODE) {
    ensureDemoStore();
    return demoStore.get(conversationId)?.messages ?? [];
  }
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
  if (DEMO_MODE) {
    ensureDemoStore();
    const entry = demoStore.get(conversationId);
    if (!entry) return;
    const now = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    entry.messages.push({
      id: `demo-${Date.now()}`,
      senderId,
      text,
      createdAt: now,
    });
    entry.convo.lastMessage = text;
    entry.convo.lastMessageTime = "Just now";
    return;
  }
  // Server-side RPC keeps rate limiting, message insert, audit log, and
  // conversation metadata update inside one transaction.
  const { error } = await supabase.rpc("send_message", {
    p_conversation_id: conversationId,
    p_sender_id: senderId,
    p_text: text,
  });
  if (error) throw error;

  // Best-effort notification enrichment should never fail the send flow, but
  // awaiting it keeps tests and callers deterministic after the RPC succeeds.
  await sendMessageNotification(conversationId, senderId, text).catch(() => {});
}

async function sendMessageNotification(
  conversationId: string,
  senderId: string,
  text: string
): Promise<void> {
  const { data: conversation } = await supabase
    .from("conversations")
    .select("buyer_id, seller_id, listing:listings(image_url)")
    .eq("id", conversationId)
    .single();

  if (!conversation) return;

  const recipientId =
    conversation.buyer_id === senderId
      ? conversation.seller_id
      : conversation.buyer_id;

  const { data: sender } = await supabase
    .from("users")
    .select("name, avatar_url")
    .eq("id", senderId)
    .single();

  await createNotification({
    userId: recipientId,
    type: "system",
    title: sender?.name ? `New message from ${sender.name}` : "New message",
    message: text.length > 80 ? `${text.slice(0, 80)}...` : text,
    avatarUrl: sender?.avatar_url ?? undefined,
    itemImage: (conversation.listing as any)?.image_url ?? undefined,
  });
}

export function subscribeToMessages(
  conversationId: string,
  callback: (message: DBMessage) => void
): RealtimeChannel {
  if (DEMO_MODE) {
    // In demo mode there is no realtime backend; return a stub channel so
    // callers can .unsubscribe() without blowing up.
    return { unsubscribe: () => {} } as unknown as RealtimeChannel;
  }
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
  if (DEMO_MODE) {
    ensureDemoStore();
    // Re-use an existing thread for the same listing/seller if one exists.
    for (const [id, entry] of demoStore) {
      if (entry.convo.listingId === listingId && entry.convo.contactId === sellerId) {
        return id;
      }
    }
    const listing = mockListings.find((l) => l.id === listingId);
    const newId = `demo-convo-${Date.now()}`;
    const convo: DBConversation = {
      id: newId,
      contactName: listing?.sellerName ?? "Seller",
      contactAvatar: listing?.sellerAvatar ?? "",
      contactId: sellerId,
      lastMessage: "",
      lastMessageTime: "",
      unread: 0,
      itemTitle: listing?.title ?? "",
      itemImage: listing?.image ?? "",
      listingId,
    };
    demoStore.set(newId, { convo, messages: [] });
    return newId;
  }
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

export async function findOrCreateDirectConversation(
  currentUserId: string,
  otherUserId: string
): Promise<string> {
  if (DEMO_MODE) {
    ensureDemoStore();
    for (const [id, entry] of demoStore) {
      if (entry.convo.contactId === otherUserId && !entry.convo.listingId) {
        return id;
      }
    }
    const newId = `demo-direct-${Date.now()}`;
    demoStore.set(newId, {
      convo: {
        id: newId,
        contactName: "Direct Message",
        contactAvatar: "",
        contactId: otherUserId,
        lastMessage: "",
        lastMessageTime: "",
        unread: 0,
        itemTitle: "",
        itemImage: "",
        listingId: "",
      },
      messages: [],
    });
    return newId;
  }
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .is("listing_id", null)
    .or(
      `and(buyer_id.eq.${currentUserId},seller_id.eq.${otherUserId}),` +
        `and(buyer_id.eq.${otherUserId},seller_id.eq.${currentUserId})`
    )
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ listing_id: null, buyer_id: currentUserId, seller_id: otherUserId })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
