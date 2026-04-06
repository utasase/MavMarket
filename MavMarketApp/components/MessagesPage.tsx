import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { ArrowLeft, Send, Camera, Bell, SquarePen, Search, X } from "lucide-react-native";
import { type Notification } from "../data/mockData";
import { useAuth } from "../lib/auth-context";
import { useTheme } from "../lib/ThemeContext";
import {
  getConversations,
  getMessages,
  sendMessage,
  subscribeToMessages,
  markConversationRead,
  findOrCreateDirectConversation,
  type DBConversation,
  type DBMessage,
} from "../lib/messages";
import { getNotifications, markNotificationAsRead } from "../lib/notifications";
import { searchUsers } from "../lib/profile";

const { width } = Dimensions.get("window");

type Tab = "messages" | "notifications";

export function MessagesPage() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { user } = useAuth();
  const { conversationId: pendingConversationId } = useLocalSearchParams<{ conversationId?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("messages");
  const [activeConvo, setActiveConvo] = useState<DBConversation | null>(null);
  const [conversations, setConversations] = useState<DBConversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; avatar: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const unreadCount = notificationsList.filter((n) => !n.read).length;

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      if (!user) return;
      try {
        const results = await searchUsers(query, user.id);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [user]);

  const handleSelectUser = async (selectedUser: { id: string; name: string; avatar: string }) => {
    if (!user) return;
    try {
      const conversationId = await findOrCreateDirectConversation(user.id, selectedUser.id);
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
      const convos = await loadConversations();
      const convo = convos.find((c: DBConversation) => c.id === conversationId);
      if (convo) {
        setActiveConvo(convo);
      } else {
        // Conversation just created — build a minimal one to open ChatView
        setActiveConvo({
          id: conversationId,
          contactName: selectedUser.name,
          contactAvatar: selectedUser.avatar,
          contactId: selectedUser.id,
          lastMessage: "",
          lastMessageTime: "",
          unread: 0,
          itemTitle: "",
          itemImage: "",
          listingId: "",
        });
      }
    } catch {
      // Silently fail — user can retry
    }
  };

  const loadConversations = useCallback(async () => {
    if (!user) return [];
    setLoadingConvos(true);
    try {
      const convos = await getConversations(user.id);
      setConversations(convos);
      return convos;
    } catch (e) {
      console.error(e);
      return [];
    } finally {
      setLoadingConvos(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadConversations();
    getNotifications(user.id)
      .then(setNotificationsList)
      .catch(() => {});
  }, [user]);

  // Open a specific conversation when navigated from another screen
  useEffect(() => {
    if (!pendingConversationId || !user) return;
    const open = (convos: DBConversation[]) => {
      const convo = convos.find((c) => c.id === pendingConversationId);
      if (convo) setActiveConvo(convo);
    };
    const existing = conversations.find((c) => c.id === pendingConversationId);
    if (existing) {
      setActiveConvo(existing);
    } else {
      loadConversations().then(open);
    }
  }, [pendingConversationId, user]);

  const handleMarkAsRead = (id: string) => {
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    markNotificationAsRead(id).catch(() => {});
  };

  if (activeConvo && user) {
    return (
      <ChatView
        conversation={activeConvo}
        currentUserId={user.id}
        onBack={() => setActiveConvo(null)}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: c.background }]}>
      {/* Header */}
      <View style={[styles.listHeader, { borderBottomColor: c.borderLight }]}>
        <Text style={[styles.listTitle, { color: c.textPrimary }]}>
          {activeTab === "messages" ? "Messages" : "Notifications"}
        </Text>
        {activeTab === "messages" && (
          <TouchableOpacity
            onPress={() => setShowSearch(true)}
            style={styles.composeBtn}
          >
            <SquarePen size={20} color={c.accent} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { borderBottomColor: c.borderLight, backgroundColor: c.background }]}>
        <TouchableOpacity
          onPress={() => setActiveTab("messages")}
          style={[styles.tabBtn, activeTab === "messages" && { borderBottomColor: c.accent }]}
        >
          <Text style={[styles.tabLabel, { color: c.textTertiary }, activeTab === "messages" && { color: c.accent, fontWeight: "600" }]}>
            Messages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("notifications")}
          style={[styles.tabBtn, activeTab === "notifications" && { borderBottomColor: c.accent }]}
        >
          <Text style={[styles.tabLabel, { color: c.textTertiary }, activeTab === "notifications" && { color: c.accent, fontWeight: "600" }]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.notifBadge, { backgroundColor: c.error }]}>
              <Text style={[styles.notifBadgeText, { color: c.background }]}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* User Search Overlay */}
      {showSearch && (
        <View style={[styles.searchOverlay, { backgroundColor: c.background }]}>
          <View style={[styles.searchHeader, { borderBottomColor: c.borderLight }]}>
            <TouchableOpacity
              onPress={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }}
              style={styles.searchBackBtn}
            >
              <ArrowLeft size={22} color={c.textPrimary} strokeWidth={1.5} />
            </TouchableOpacity>
            <View style={[styles.searchInputWrapper, { backgroundColor: c.surface }]}>
              <Search size={16} color={c.textTertiary} strokeWidth={1.5} />
              <TextInput
                style={[styles.searchInput, { color: c.textPrimary }]}
                placeholder="Search UTA students..."
                placeholderTextColor={c.textTertiary}
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch("")}>
                  <X size={16} color={c.textTertiary} strokeWidth={1.5} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {searchLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={c.accent} />
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={[styles.emptySubtext, { color: c.border }]}>
                    {searchQuery.trim() ? "No users found" : "Search for UTA students by name"}
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelectUser(item)}
                  style={styles.searchResultRow}
                  activeOpacity={0.7}
                >
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.searchResultAvatar} />
                  ) : (
                    <View style={[styles.searchResultAvatar, styles.avatarPlaceholder, { backgroundColor: c.border }]}>
                      <Text style={[styles.avatarInitial, { color: c.textSecondary }]}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.searchResultName, { color: c.textPrimary }]}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* Messages Tab */}
      {activeTab === "messages" && !showSearch && (
        <>
          {loadingConvos ? (
            <View style={styles.centered}>
              <ActivityIndicator color={c.accent} />
            </View>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: c.textTertiary }]}>No messages yet</Text>
                  <Text style={[styles.emptySubtext, { color: c.border }]}>
                    Tap the compose button or "Message Seller" on a listing to start a conversation
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setActiveConvo(item);
                    if (user) markConversationRead(user.id, item.id).catch(() => {});
                    setConversations((prev) =>
                      prev.map((cv) => (cv.id === item.id ? { ...cv, unread: 0 } : cv))
                    );
                  }}
                  style={styles.convoRow}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarWrapper}>
                    {item.contactAvatar ? (
                      <Image source={{ uri: item.contactAvatar }} style={styles.convoAvatar} />
                    ) : (
                      <View style={[styles.convoAvatar, styles.avatarPlaceholder, { backgroundColor: c.border }]}>
                        <Text style={[styles.avatarInitial, { color: c.textSecondary }]}>
                          {item.contactName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    {item.unread > 0 && (
                      <View style={[styles.unreadBadge, { backgroundColor: c.error }]}>
                        <Text style={[styles.unreadText, { color: c.background }]}>{item.unread}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.convoInfo}>
                    <View style={styles.convoTop}>
                      <Text style={[styles.convoName, { color: c.textSecondary }, item.unread > 0 && { color: c.textPrimary, fontWeight: "600" }]}>
                        {item.contactName}
                      </Text>
                      <Text style={[styles.convoTime, { color: c.textTertiary }]}>{item.lastMessageTime}</Text>
                    </View>
                    <Text
                      style={[styles.convoLastMsg, { color: c.textTertiary }, item.unread > 0 && { color: c.textPrimary, fontWeight: "600" }]}
                      numberOfLines={1}
                    >
                      {item.lastMessage || "No messages yet"}
                    </Text>
                    {item.itemTitle ? (
                      <View style={styles.convoItemRow}>
                        {item.itemImage ? (
                          <Image source={{ uri: item.itemImage }} style={styles.convoItemThumb} />
                        ) : null}
                        <Text style={[styles.convoItemTitle, { color: c.textTertiary }]} numberOfLines={1}>
                          {item.itemTitle}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && !showSearch && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.notifListContainer}>
            {notificationsList.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
            {notificationsList.length === 0 && (
              <View style={styles.emptyNotif}>
                <Bell size={32} color={c.border} strokeWidth={1.5} />
                <Text style={[styles.emptyNotifText, { color: c.textTertiary }]}>No notifications</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onMarkAsRead(notification.id)}
      style={[styles.notifItem, !notification.read && styles.notifItemUnread]}
    >
      {notification.avatar ? (
        <Image source={{ uri: notification.avatar }} style={styles.notifAvatar} />
      ) : notification.itemImage ? (
        <Image source={{ uri: notification.itemImage }} style={styles.notifItemImage} />
      ) : (
        <View style={styles.notifIconWrapper}>
          <Bell size={16} color="#9CA3AF" strokeWidth={1.5} />
        </View>
      )}
      <View style={styles.notifContent}>
        <Text style={[styles.notifMessage, !notification.read && styles.notifMessageUnread]}>
          {notification.message}
        </Text>
        <Text style={styles.notifTimestamp}>{notification.timestamp}</Text>
      </View>
      {!notification.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
}

function ChatView({
  conversation,
  currentUserId,
  onBack,
}: {
  conversation: DBConversation;
  currentUserId: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Load existing messages
    getMessages(conversation.id)
      .then((msgs) => {
        setMessages(msgs);
        setLoadingMessages(false);
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        setLoadingMessages(false);
      });

    // Subscribe to new messages from the other participant
    const channel = subscribeToMessages(conversation.id, (incomingMsg) => {
      if (incomingMsg.senderId !== currentUserId) {
        setMessages((prev) => [...prev, incomingMsg]);
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [conversation.id, currentUserId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || sending) return;

    // Optimistic update
    const optimisticMsg: DBMessage = {
      id: `optimistic-${Date.now()}`,
      senderId: currentUserId,
      text,
      createdAt: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");

    setSending(true);
    try {
      await sendMessage(conversation.id, currentUserId, text);
    } catch (err) {
      console.error("Failed to send message:", err);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: DBMessage }) => {
    const isMe = item.senderId === currentUserId;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
          <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
            {item.text}
          </Text>
          <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
            {item.createdAt}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Chat Header */}
      <View style={[styles.chatHeader, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={onBack} style={styles.chatBackBtn}>
          <ArrowLeft size={22} color="#111827" strokeWidth={1.5} />
        </TouchableOpacity>
        {conversation.contactAvatar ? (
          <Image source={{ uri: conversation.contactAvatar }} style={styles.chatHeaderAvatar} />
        ) : (
          <View style={[styles.chatHeaderAvatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>
              {conversation.contactName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>{conversation.contactName}</Text>
        </View>
      </View>

      {/* Item context bar */}
      {conversation.itemTitle ? (
        <View style={styles.itemContextBar}>
          {conversation.itemImage ? (
            <Image source={{ uri: conversation.itemImage }} style={styles.itemContextImage} />
          ) : null}
          <Text style={styles.itemContextTitle}>{conversation.itemTitle}</Text>
        </View>
      ) : null}

      {/* Messages */}
      {loadingMessages ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#0064B1" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChatState}>
              <Text style={styles.emptySubtext}>Say hi to get things started!</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 4 }]}>
        <TextInput
          style={styles.messageInput}
          placeholder="Message..."
          placeholderTextColor="#9CA3AF"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        {newMessage.trim() !== "" && (
          <TouchableOpacity onPress={handleSend} disabled={sending} style={styles.sendBtn}>
            <Send size={20} color="#0064B1" strokeWidth={1.5} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  listTitle: { fontSize: 18, color: "#111827" },
  composeBtn: { padding: 6 },
  tabBar: { flexDirection: "row", width: width, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", backgroundColor: "#FFFFFF" },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent", gap: 6 },
  tabBtnActive: { borderBottomColor: "#0064B1" },
  tabLabel: { fontSize: 14, color: "#9CA3AF" },
  tabLabelActive: { color: "#0064B1", fontWeight: "600" },
  notifBadge: { backgroundColor: "#EF4444", minWidth: 16, height: 16, borderRadius: 8, justifyContent: "center", alignItems: "center", paddingHorizontal: 3 },
  notifBadgeText: { color: "#FFFFFF", fontSize: 10 },
  emptyState: { flex: 1, height: 200, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 8 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
  emptySubtext: { fontSize: 12, color: "#D1D5DB", textAlign: "center" },
  emptyChatState: { flex: 1, height: 200, alignItems: "center", justifyContent: "center" },
  // Conversations
  convoRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  avatarWrapper: { position: "relative", flexShrink: 0 },
  convoAvatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { backgroundColor: "#E5E7EB", justifyContent: "center", alignItems: "center" },
  avatarInitial: { fontSize: 20, color: "#6B7280" },
  unreadBadge: { position: "absolute", top: -2, right: -2, backgroundColor: "#EF4444", minWidth: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center", paddingHorizontal: 3 },
  unreadText: { color: "#FFFFFF", fontSize: 10 },
  convoInfo: { flex: 1, minWidth: 0, paddingVertical: 2 },
  convoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  convoName: { fontSize: 14, color: "#374151" },
  boldText: { color: "#111827", fontWeight: "600" },
  convoTime: { fontSize: 11, color: "#9CA3AF", flexShrink: 0 },
  convoLastMsg: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },
  convoItemRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  convoItemThumb: { width: 16, height: 16, borderRadius: 4 },
  convoItemTitle: { fontSize: 11, color: "#9CA3AF", flex: 1 },
  // Notifications
  notifListContainer: { padding: 16 },
  notifItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  notifItemUnread: { backgroundColor: "rgba(0,100,177,0.04)", borderRadius: 10, marginHorizontal: -8, paddingHorizontal: 8 },
  notifAvatar: { width: 40, height: 40, borderRadius: 20, flexShrink: 0 },
  notifItemImage: { width: 40, height: 40, borderRadius: 10, flexShrink: 0 },
  notifIconWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center", flexShrink: 0 },
  notifContent: { flex: 1, minWidth: 0 },
  notifMessage: { fontSize: 13, color: "#374151", lineHeight: 18 },
  notifMessageUnread: { color: "#111827" },
  notifTimestamp: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  unreadIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#0064B1", flexShrink: 0 },
  emptyNotif: { height: 192, justifyContent: "center", alignItems: "center", gap: 8 },
  emptyNotifText: { fontSize: 14, color: "#9CA3AF" },
  // Search
  searchOverlay: { flex: 1, backgroundColor: "#FFFFFF" },
  searchHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  searchBackBtn: { padding: 4, marginLeft: -4 },
  searchInputWrapper: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F3F4F6", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 14, color: "#111827", padding: 0 },
  searchResultRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  searchResultAvatar: { width: 44, height: 44, borderRadius: 22 },
  searchResultName: { fontSize: 14, color: "#111827" },
  // Chat
  chatContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  chatBackBtn: { padding: 4, marginLeft: -4 },
  chatHeaderAvatar: { width: 32, height: 32, borderRadius: 16 },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: 14, color: "#111827" },
  itemContextBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#F9FAFB", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  itemContextImage: { width: 36, height: 36, borderRadius: 8 },
  itemContextTitle: { fontSize: 12, color: "#6B7280" },
  messagesList: { padding: 16, gap: 10 },
  msgRow: { marginBottom: 10 },
  msgRowRight: { alignItems: "flex-end" },
  msgRowLeft: { alignItems: "flex-start" },
  msgBubble: { maxWidth: "75%", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  msgBubbleMe: { backgroundColor: "#0064B1", borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: "#F3F4F6", borderBottomLeftRadius: 4 },
  msgText: { fontSize: 14, lineHeight: 20 },
  msgTextMe: { color: "#FFFFFF" },
  msgTextOther: { color: "#111827" },
  msgTime: { fontSize: 10, marginTop: 4 },
  msgTimeMe: { color: "rgba(255,255,255,0.5)" },
  msgTimeOther: { color: "#9CA3AF" },
  inputContainer: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F3F4F6", backgroundColor: "#FFFFFF" },
  messageInput: { flex: 1, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#F3F4F6", borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, color: "#111827", maxHeight: 100 },
  sendBtn: { padding: 6 },
});
