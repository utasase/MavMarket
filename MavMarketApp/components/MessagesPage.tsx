import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  Animated,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Send,
  Bell,
  SquarePen,
  Search,
  X,
  MessageCircle,
} from "lucide-react-native";
import { type Notification, type Theme } from "../lib/types";
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
import {
  getNotifications,
  markNotificationAsRead,
} from "../lib/notifications";
import { searchUsers } from "../lib/profile";
import { HeaderMenu } from "./HeaderMenu";
import { Avatar } from "./ui/Avatar";
import { EmptyState } from "./ui/EmptyState";
import { IconButton } from "./ui/IconButton";
import { Input } from "./ui/Input";
import { Skeleton } from "./ui/Skeleton";
import { spacing, radius } from "../lib/theme";

type Tab = "messages" | "notifications";

export function MessagesPage() {
  const { theme } = useTheme();
  const c = theme.colors;
  const { user } = useAuth();
  const { conversationId: pendingConversationId } = useLocalSearchParams<{
    conversationId?: string;
  }>();
  const [activeTab, setActiveTab] = useState<Tab>("messages");
  const [activeConvo, setActiveConvo] = useState<DBConversation | null>(null);
  const [conversations, setConversations] = useState<DBConversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; name: string; avatar: string }[]
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const unreadCount = notificationsList.filter((n) => !n.read).length;

  const handleSearch = useCallback(
    (query: string) => {
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
    },
    [user]
  );

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

  const handleSelectUser = async (selectedUser: {
    id: string;
    name: string;
    avatar: string;
  }) => {
    if (!user) return;
    try {
      const conversationId = await findOrCreateDirectConversation(
        user.id,
        selectedUser.id
      );
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
      const convos = await loadConversations();
      const convo = convos.find((cv: DBConversation) => cv.id === conversationId);
      if (convo) {
        setActiveConvo(convo);
      } else {
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

  useEffect(() => {
    if (!user) return;
    loadConversations();
    getNotifications(user.id)
      .then(setNotificationsList)
      .catch(() => {});
  }, [user, loadConversations]);

  useEffect(() => {
    if (!pendingConversationId || !user) return;
    const existing = conversations.find((cv) => cv.id === pendingConversationId);
    if (existing) {
      setActiveConvo(existing);
      return;
    }
    loadConversations().then((convos) => {
      const convo = convos.find((cv) => cv.id === pendingConversationId);
      if (convo) setActiveConvo(convo);
    });
  }, [pendingConversationId, user, conversations, loadConversations]);

  const handleMarkAsRead = (id: string) => {
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    markNotificationAsRead(id).catch(() => {});
  };

  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (activeConvo && user) {
    return (
      <ChatView
        conversation={activeConvo}
        currentUserId={user.id}
        onBack={() => setActiveConvo(null)}
      />
    );
  }

  const renderConvo = ({ item }: { item: DBConversation }) => (
    <Pressable
      onPress={() => {
        setActiveConvo(item);
        if (user) markConversationRead(user.id, item.id).catch(() => {});
        setConversations((prev) =>
          prev.map((cv) => (cv.id === item.id ? { ...cv, unread: 0 } : cv))
        );
      }}
      style={({ pressed }) => [
        styles.convoRow,
        pressed && { backgroundColor: c.surfaceOverlay },
      ]}
      accessibilityRole="button"
    >
      <Avatar
        source={item.contactAvatar}
        name={item.contactName}
        size={52}
      />
      <View style={styles.convoInfo}>
        <View style={styles.convoTop}>
          <Text
            style={[
              styles.convoName,
              item.unread > 0
                ? { color: c.textPrimary, fontWeight: "700" }
                : { color: c.textPrimary, fontWeight: "500" },
            ]}
            numberOfLines={1}
          >
            {item.contactName}
          </Text>
          <Text style={styles.convoTime}>
            {item.lastMessageTime || ""}
          </Text>
        </View>
        <Text
          style={[
            styles.convoLastMsg,
            item.unread > 0
              ? { color: c.textPrimary, fontWeight: "500" }
              : { color: c.textSecondary },
          ]}
          numberOfLines={1}
        >
          {item.lastMessage || "No messages yet"}
        </Text>
        {item.itemTitle ? (
          <View style={styles.convoItemRow}>
            {item.itemImage ? (
              <Image
                source={{ uri: item.itemImage }}
                style={styles.convoItemThumb}
              />
            ) : null}
            <Text style={styles.convoItemTitle} numberOfLines={1}>
              {item.itemTitle}
            </Text>
          </View>
        ) : null}
      </View>
      {item.unread > 0 ? (
        <View style={[styles.unreadBadge, { backgroundColor: c.accent500 }]}>
          <Text style={styles.unreadText}>
            {item.unread > 99 ? "99+" : item.unread}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: c.background },
      ]}
    >
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {activeTab === "messages" ? "Messages" : "Notifications"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
          {activeTab === "messages" ? (
            <IconButton
              icon={
                <SquarePen
                  size={18}
                  color={c.accentLight}
                  strokeWidth={1.85}
                />
              }
              onPress={() => setShowSearch(true)}
              accessibilityLabel="Compose"
              size={40}
            />
          ) : null}
          <HeaderMenu />
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab("messages")}
          style={[
            styles.tabBtn,
            activeTab === "messages" && { borderBottomColor: c.accentLight },
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "messages" }}
        >
          <Text
            style={[
              styles.tabLabel,
              {
                color:
                  activeTab === "messages"
                    ? c.textPrimary
                    : c.textTertiary,
              },
              activeTab === "messages" && { fontWeight: "700" },
            ]}
          >
            Messages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("notifications")}
          style={[
            styles.tabBtn,
            activeTab === "notifications" && {
              borderBottomColor: c.accentLight,
            },
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "notifications" }}
        >
          <Text
            style={[
              styles.tabLabel,
              {
                color:
                  activeTab === "notifications"
                    ? c.textPrimary
                    : c.textTertiary,
              },
              activeTab === "notifications" && { fontWeight: "700" },
            ]}
          >
            Notifications
          </Text>
          {unreadCount > 0 ? (
            <View style={[styles.tabBadge, { backgroundColor: c.accent500 }]}>
              <Text style={styles.tabBadgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {showSearch ? (
        <View style={[styles.searchOverlay, { backgroundColor: c.background }]}>
          <View style={styles.searchHeader}>
            <IconButton
              icon={<ArrowLeft size={20} color={c.textPrimary} strokeWidth={1.85} />}
              onPress={() => {
                setShowSearch(false);
                setSearchQuery("");
                setSearchResults([]);
              }}
              accessibilityLabel="Close search"
              size={40}
            />
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Search UTA students"
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
                leftIcon={<Search size={16} color={c.textTertiary} strokeWidth={1.85} />}
                rightIcon={
                  searchQuery.length > 0 ? (
                    <TouchableOpacity onPress={() => handleSearch("")}>
                      <X size={16} color={c.textTertiary} strokeWidth={1.85} />
                    </TouchableOpacity>
                  ) : null
                }
              />
            </View>
          </View>

          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              searchLoading ? (
                <View style={styles.searchSkeletons}>
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} style={styles.searchResultRow}>
                      <Skeleton width={44} height={44} radius={22} />
                      <Skeleton width={140} height={14} />
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon={<Search size={22} color={c.textTertiary} />}
                  title={
                    searchQuery.trim()
                      ? "No Mavericks found"
                      : "Find a Maverick"
                  }
                  description={
                    searchQuery.trim()
                      ? "Try a different name or email prefix."
                      : "Search for UTA students by name or email to start a conversation."
                  }
                />
              )
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelectUser(item)}
                style={styles.searchResultRow}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <Avatar source={item.avatar} name={item.name} size={44} />
                <Text style={styles.searchResultName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : null}

      {!showSearch && activeTab === "messages" ? (
        loadingConvos && conversations.length === 0 ? (
          <View>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={styles.convoRow}>
                <Skeleton width={52} height={52} radius={26} />
                <View style={styles.convoInfo}>
                  <Skeleton width={120} height={14} />
                  <View style={{ height: 6 }} />
                  <Skeleton width={200} height={12} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={renderConvo}
            contentContainerStyle={{ paddingBottom: 120 }}
            ListEmptyComponent={
              <EmptyState
                icon={<MessageCircle size={22} color={c.textTertiary} />}
                title="No conversations yet"
                description="Tap the compose button or Message seller on a listing to start a chat."
                ctaLabel="Find a Maverick"
                onCta={() => setShowSearch(true)}
              />
            }
          />
        )
      ) : null}

      {!showSearch && activeTab === "notifications" ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.notifListContainer}>
            {notificationsList.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                theme={theme}
              />
            ))}
            {notificationsList.length === 0 ? (
              <EmptyState
                icon={<Bell size={22} color={c.textTertiary} />}
                title="You're all caught up"
                description="Offers, sales, and replies will show up here."
              />
            ) : null}
          </View>
        </ScrollView>
      ) : null}
    </View>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  theme,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  theme: Theme;
}) {
  const c = theme.colors;
  return (
    <TouchableOpacity
      onPress={() => onMarkAsRead(notification.id)}
      style={[
        notifItemStyles.row,
        !notification.read && {
          backgroundColor: c.accent50,
        },
      ]}
      accessibilityRole="button"
    >
      {notification.avatar ? (
        <Image source={{ uri: notification.avatar }} style={notifItemStyles.avatar} />
      ) : notification.itemImage ? (
        <Image
          source={{ uri: notification.itemImage }}
          style={notifItemStyles.itemImage}
        />
      ) : (
        <View
          style={[
            notifItemStyles.iconWrap,
            { backgroundColor: c.surfaceElevated },
          ]}
        >
          <Bell size={16} color={c.textSecondary} strokeWidth={1.85} />
        </View>
      )}
      <View style={notifItemStyles.content}>
        <Text
          style={[
            notifItemStyles.message,
            {
              color: notification.read ? c.textSecondary : c.textPrimary,
              fontFamily: theme.typography.body.fontFamily,
            },
          ]}
          numberOfLines={2}
        >
          {notification.message}
        </Text>
        <Text
          style={[
            notifItemStyles.timestamp,
            { color: c.textTertiary, fontFamily: theme.typography.caption.fontFamily },
          ]}
        >
          {notification.timestamp}
        </Text>
      </View>
      {!notification.read ? (
        <View
          style={[notifItemStyles.unreadDot, { backgroundColor: c.accent500 }]}
        />
      ) : null}
    </TouchableOpacity>
  );
}

const notifItemStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  itemImage: { width: 40, height: 40, borderRadius: radius.sm },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, minWidth: 0 },
  message: { fontSize: 14, lineHeight: 20 },
  timestamp: { fontSize: 11, marginTop: 2 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
});

// --- Chat view -------------------------------------------------------------

type MessageRow =
  | { kind: "message"; message: DBMessage }
  | { kind: "day"; label: string; id: string };

function formatDayLabel(date: Date): string {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const diffDays = Math.floor(
    (startOfToday.getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      86400000
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function parseMessageDate(createdAt: string): Date | null {
  if (!createdAt) return null;
  const parsed = new Date(createdAt);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return null;
}

function buildRows(messages: DBMessage[]): MessageRow[] {
  const rows: MessageRow[] = [];
  let lastDayKey: string | null = null;

  for (const msg of messages) {
    const date = parseMessageDate(msg.createdAt);
    if (date) {
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (key !== lastDayKey) {
        rows.push({
          kind: "day",
          label: formatDayLabel(date),
          id: `day-${key}-${msg.id}`,
        });
        lastDayKey = key;
      }
    }
    rows.push({ kind: "message", message: msg });
  }
  return rows;
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
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const sendScale = useRef(new Animated.Value(0)).current;
  const hasText = newMessage.trim().length > 0;

  useEffect(() => {
    Animated.spring(sendScale, {
      toValue: hasText ? 1 : 0,
      useNativeDriver: true,
      damping: 12,
      stiffness: 180,
    }).start();
  }, [hasText, sendScale]);

  useEffect(() => {
    getMessages(conversation.id)
      .then((msgs) => {
        setMessages(msgs);
        setLoadingMessages(false);
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        setLoadingMessages(false);
      });

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
      }, 80);
    }
  }, [messages]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || sending) return;

    const optimisticMsg: DBMessage = {
      id: `optimistic-${Date.now()}`,
      senderId: currentUserId,
      text,
      createdAt: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");

    setSending(true);
    try {
      await sendMessage(conversation.id, currentUserId, text);
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const styles = useMemo(() => makeStyles(theme), [theme]);
  const rows = useMemo(() => buildRows(messages), [messages]);

  const renderRow = ({ item, index }: { item: MessageRow; index: number }) => {
    if (item.kind === "day") {
      return (
        <View style={styles.dayDividerWrap}>
          <View style={[styles.dayDividerLine, { backgroundColor: c.hairline }]} />
          <Text style={styles.dayDividerText}>{item.label}</Text>
          <View style={[styles.dayDividerLine, { backgroundColor: c.hairline }]} />
        </View>
      );
    }
    const msg = item.message;
    const isMe = msg.senderId === currentUserId || msg.senderId === "me";

    const prev = rows[index - 1];
    const next = rows[index + 1];
    const prevSameAuthor =
      prev && prev.kind === "message" &&
      (prev.message.senderId === msg.senderId);
    const nextSameAuthor =
      next && next.kind === "message" &&
      (next.message.senderId === msg.senderId);

    const bubbleStyle = [
      styles.msgBubble,
      {
        backgroundColor: isMe ? c.messageBubbleOwn : c.messageBubbleOther,
        borderTopLeftRadius: !isMe && prevSameAuthor ? 6 : 18,
        borderBottomLeftRadius: !isMe && nextSameAuthor ? 6 : 18,
        borderTopRightRadius: isMe && prevSameAuthor ? 6 : 18,
        borderBottomRightRadius: isMe && nextSameAuthor ? 6 : 18,
      },
    ];
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        <View style={bubbleStyle}>
          <Text
            style={[
              styles.msgText,
              { color: isMe ? "#FFFFFF" : c.textPrimary },
            ]}
          >
            {msg.text}
          </Text>
        </View>
        {!nextSameAuthor ? (
          <Text
            style={[
              styles.msgTime,
              isMe
                ? { alignSelf: "flex-end", color: c.textTertiary }
                : { alignSelf: "flex-start", color: c.textTertiary },
            ]}
          >
            {msg.createdAt}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.chatContainer, { backgroundColor: c.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View
        style={[
          styles.chatHeader,
          { paddingTop: insets.top + 4, borderBottomColor: c.hairline },
        ]}
      >
        <IconButton
          icon={<ArrowLeft size={20} color={c.textPrimary} strokeWidth={1.85} />}
          onPress={onBack}
          accessibilityLabel="Back"
          size={40}
        />
        <Avatar
          source={conversation.contactAvatar}
          name={conversation.contactName}
          size={36}
        />
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName} numberOfLines={1}>
            {conversation.contactName}
          </Text>
          <Text style={styles.chatHeaderMeta}>UTA Maverick</Text>
        </View>
      </View>

      {conversation.itemTitle ? (
        <View
          style={[
            styles.itemContextBar,
            {
              backgroundColor: c.surface,
              borderBottomColor: c.hairline,
            },
          ]}
        >
          {conversation.itemImage ? (
            <Image
              source={{ uri: conversation.itemImage }}
              style={styles.itemContextImage}
            />
          ) : null}
          <Text style={styles.itemContextTitle} numberOfLines={1}>
            {conversation.itemTitle}
          </Text>
        </View>
      ) : null}

      {loadingMessages ? (
        <View style={styles.skeletonsWrap}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.msgRow,
                i % 2 === 0 ? styles.msgRowLeft : styles.msgRowRight,
              ]}
            >
              <Skeleton width={180 - i * 20} height={36} radius={18} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={rows}
          keyExtractor={(item) =>
            item.kind === "day" ? item.id : item.message.id
          }
          renderItem={renderRow}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={<MessageCircle size={20} color={c.textTertiary} />}
              title="Say hi"
              description="Send the first message to get this conversation started."
            />
          }
        />
      )}

      <View
        style={[
          styles.inputContainer,
          {
            paddingBottom: insets.bottom + spacing.sm,
            borderTopColor: c.hairline,
            backgroundColor: c.background,
          },
        ]}
      >
        <View
          style={[
            styles.messageInputWrap,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <TextInput
            style={[
              styles.messageInput,
              {
                color: c.textPrimary,
                fontFamily: theme.typography.body.fontFamily,
              },
            ]}
            placeholder="Message"
            placeholderTextColor={c.textTertiary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            returnKeyType="default"
          />
        </View>
        <Animated.View
          style={{
            transform: [{ scale: sendScale }],
            opacity: sendScale,
          }}
          pointerEvents={hasText ? "auto" : "none"}
        >
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || !hasText}
            accessibilityLabel="Send"
            accessibilityRole="button"
            style={[styles.sendBtn, { backgroundColor: c.accent500 }]}
            activeOpacity={0.85}
          >
            <Send size={18} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(theme: Theme) {
  const c = theme.colors;
  const t = theme.typography;
  return StyleSheet.create({
    container: { flex: 1 },
    listHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    listTitle: {
      color: c.textPrimary,
      fontFamily: t.title.fontFamily,
      fontSize: 22,
      fontWeight: "700",
      letterSpacing: -0.3,
    },
    tabBar: {
      flexDirection: "row",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.hairline,
    },
    tabBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.md,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
      gap: spacing.xs,
    },
    tabLabel: {
      fontFamily: t.label.fontFamily,
      fontSize: 13,
      fontWeight: "500",
      letterSpacing: 0.1,
    },
    tabBadge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 5,
    },
    tabBadgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "700",
    },
    convoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    convoInfo: { flex: 1, minWidth: 0 },
    convoTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    convoName: {
      fontFamily: t.bodyStrong.fontFamily,
      fontSize: 15,
      flex: 1,
      paddingRight: spacing.sm,
    },
    convoTime: {
      fontFamily: t.caption.fontFamily,
      fontSize: 11,
      color: c.textTertiary,
    },
    convoLastMsg: {
      fontFamily: t.body.fontFamily,
      fontSize: 13,
      marginTop: 2,
    },
    convoItemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    convoItemThumb: {
      width: 16,
      height: 16,
      borderRadius: 4,
    },
    convoItemTitle: {
      fontFamily: t.caption.fontFamily,
      fontSize: 11,
      color: c.textTertiary,
      flex: 1,
    },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 6,
      marginLeft: spacing.sm,
    },
    unreadText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
    },
    notifListContainer: {
      padding: spacing.md,
    },
    searchOverlay: {
      ...StyleSheet.absoluteFillObject,
      top: 0,
    },
    searchHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    searchResultRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    searchResultName: {
      fontFamily: t.body.fontFamily,
      fontSize: 15,
      color: c.textPrimary,
      fontWeight: "500",
    },
    searchSkeletons: {
      paddingTop: spacing.sm,
    },
    // Chat
    chatContainer: { flex: 1 },
    chatHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    chatHeaderInfo: { flex: 1 },
    chatHeaderName: {
      color: c.textPrimary,
      fontFamily: t.bodyStrong.fontFamily,
      fontSize: 15,
      fontWeight: "700",
    },
    chatHeaderMeta: {
      color: c.textTertiary,
      fontFamily: t.caption.fontFamily,
      fontSize: 11,
      marginTop: 1,
    },
    itemContextBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    itemContextImage: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
    },
    itemContextTitle: {
      color: c.textSecondary,
      fontFamily: t.caption.fontFamily,
      fontSize: 12,
      flex: 1,
    },
    messagesList: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: 2,
    },
    skeletonsWrap: {
      padding: spacing.md,
      gap: spacing.md,
    },
    msgRow: {
      marginVertical: 2,
      maxWidth: "85%",
    },
    msgRowRight: { alignSelf: "flex-end", alignItems: "flex-end" },
    msgRowLeft: { alignSelf: "flex-start", alignItems: "flex-start" },
    msgBubble: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 18,
    },
    msgText: {
      fontFamily: t.body.fontFamily,
      fontSize: 15,
      lineHeight: 20,
    },
    msgTime: {
      fontFamily: t.caption.fontFamily,
      fontSize: 10,
      marginTop: 2,
      marginHorizontal: spacing.xs,
    },
    dayDividerWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginVertical: spacing.md,
    },
    dayDividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
    dayDividerText: {
      color: c.textTertiary,
      fontFamily: t.overline.fontFamily,
      fontSize: 10,
      letterSpacing: 1.2,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    messageInputWrap: {
      flex: 1,
      borderRadius: radius.full,
      borderWidth: 1,
      paddingHorizontal: spacing.lg,
      paddingVertical: Platform.OS === "ios" ? spacing.sm : 4,
      minHeight: 44,
      maxHeight: 120,
      justifyContent: "center",
    },
    messageInput: {
      fontSize: 15,
      lineHeight: 20,
      padding: 0,
      margin: 0,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
    },
  });
}
