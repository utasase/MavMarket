import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Send, Camera, Bell } from "lucide-react-native";
import { conversations, notifications as notificationsData, type Conversation, type Message, type Notification } from "../data/mockData";

const { width } = Dimensions.get("window");

type Tab = "messages" | "notifications";

export function MessagesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("messages");
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [notificationsList, setNotificationsList] = useState(notificationsData);
  const insets = useSafeAreaInsets();

  const unreadCount = notificationsList.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotificationsList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  if (activeConvo) {
    return (
      <ChatView conversation={activeConvo} onBack={() => setActiveConvo(null)} />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {activeTab === "messages" ? "Messages" : "Notifications"}
        </Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab("messages")}
          style={[styles.tabBtn, activeTab === "messages" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabLabel, activeTab === "messages" && styles.tabLabelActive]}>
            Messages
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("notifications")}
          style={[styles.tabBtn, activeTab === "notifications" && styles.tabBtnActive]}
        >
          <Text style={[styles.tabLabel, activeTab === "notifications" && styles.tabLabelActive]}>
            Notifications
          </Text>
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveConvo(item)}
              style={styles.convoRow}
              activeOpacity={0.7}
            >
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: item.contactAvatar }} style={styles.convoAvatar} />
                {item.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                  </View>
                )}
              </View>
              <View style={styles.convoInfo}>
                <View style={styles.convoTop}>
                  <Text style={[styles.convoName, item.unread > 0 && styles.boldText]}>
                    {item.contactName}
                  </Text>
                  <Text style={styles.convoTime}>{item.lastMessageTime}</Text>
                </View>
                <Text
                  style={[styles.convoLastMsg, item.unread > 0 && styles.boldText]}
                  numberOfLines={1}
                >
                  {item.lastMessage}
                </Text>
                <View style={styles.convoItemRow}>
                  <Image source={{ uri: item.itemImage }} style={styles.convoItemThumb} />
                  <Text style={styles.convoItemTitle} numberOfLines={1}>
                    {item.itemTitle}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
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
                <Bell size={32} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyNotifText}>No notifications</Text>
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
  onBack,
}: {
  conversation: Conversation;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [newMessage, setNewMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: `m${messages.length + 1}`,
      senderId: "me",
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    setNewMessage("");

    setTimeout(() => {
      const replies = [
        "Sounds good! Let me know.",
        "I can meet at the library if that works?",
        "Let me think about it and get back to you.",
        "Sure, that works for me!",
        "Can we meet on campus?",
      ];
      const reply: Message = {
        id: `m${messages.length + 2}`,
        senderId: "other",
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === "me";
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
          <Text style={[styles.msgText, isMe ? styles.msgTextMe : styles.msgTextOther]}>
            {item.text}
          </Text>
          <Text style={[styles.msgTime, isMe ? styles.msgTimeMe : styles.msgTimeOther]}>
            {item.timestamp}
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
        <Image
          source={{ uri: conversation.contactAvatar }}
          style={styles.chatHeaderAvatar}
        />
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>{conversation.contactName}</Text>
        </View>
      </View>

      {/* Item context bar */}
      <View style={styles.itemContextBar}>
        <Image source={{ uri: conversation.itemImage }} style={styles.itemContextImage} />
        <Text style={styles.itemContextTitle}>{conversation.itemTitle}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 4 }]}>
        <TouchableOpacity style={styles.cameraBtn}>
          <Camera size={22} color="#9CA3AF" strokeWidth={1.5} />
        </TouchableOpacity>
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
          <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listTitle: {
    fontSize: 18,
    color: "#111827",
  },
  // Tab Bar
  tabBar: {
    flexDirection: "row",
    width: width,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: 6,
  },
  tabBtnActive: {
    borderBottomColor: "#111827",
  },
  tabLabel: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  tabLabelActive: {
    color: "#111827",
  },
  notifBadge: {
    backgroundColor: "#EF4444",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  // Conversations
  convoRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarWrapper: {
    position: "relative",
    flexShrink: 0,
  },
  convoAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 10,
  },
  convoInfo: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 2,
  },
  convoTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  convoName: {
    fontSize: 14,
    color: "#374151",
  },
  boldText: {
    color: "#111827",
    fontWeight: "600",
  },
  convoTime: {
    fontSize: 11,
    color: "#9CA3AF",
    flexShrink: 0,
  },
  convoLastMsg: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },
  convoItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  convoItemThumb: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  convoItemTitle: {
    fontSize: 11,
    color: "#9CA3AF",
    flex: 1,
  },
  // Notifications
  notifListContainer: {
    padding: 16,
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  notifItemUnread: {
    backgroundColor: "rgba(0,100,177,0.04)",
    borderRadius: 10,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  notifAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    flexShrink: 0,
  },
  notifItemImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
    flexShrink: 0,
  },
  notifIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
    minWidth: 0,
  },
  notifMessage: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  notifMessageUnread: {
    color: "#111827",
  },
  notifTimestamp: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0064B1",
    flexShrink: 0,
  },
  emptyNotif: {
    height: 192,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyNotifText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  // Chat
  chatContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  chatBackBtn: {
    padding: 4,
    marginLeft: -4,
  },
  chatHeaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontSize: 14,
    color: "#111827",
  },
  itemContextBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemContextImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  itemContextTitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  messagesList: {
    padding: 16,
    gap: 10,
  },
  msgRow: {
    marginBottom: 10,
  },
  msgRowRight: {
    alignItems: "flex-end",
  },
  msgRowLeft: {
    alignItems: "flex-start",
  },
  msgBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  msgBubbleMe: {
    backgroundColor: "#111827",
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: "#F3F4F6",
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextMe: {
    color: "#FFFFFF",
  },
  msgTextOther: {
    color: "#111827",
  },
  msgTime: {
    fontSize: 10,
    marginTop: 4,
  },
  msgTimeMe: {
    color: "rgba(255,255,255,0.5)",
  },
  msgTimeOther: {
    color: "#9CA3AF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  cameraBtn: {
    padding: 6,
  },
  messageInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: "#111827",
    maxHeight: 100,
  },
  sendBtn: {
    paddingHorizontal: 4,
  },
  sendBtnText: {
    fontSize: 14,
    color: "#0064B1",
  },
});
