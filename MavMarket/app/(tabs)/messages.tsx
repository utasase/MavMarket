import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { ArrowLeft, Send, Camera } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { conversations, type Conversation, type Message } from '../../constants/mockData';
import { Colors } from '../../constants/colors';

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);

  if (activeConvo) {
    return <ChatView conversation={activeConvo} onBack={() => setActiveConvo(null)} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item: convo }) => (
          <Pressable onPress={() => setActiveConvo(convo)} style={styles.convoItem}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: convo.contactAvatar }} style={styles.convoAvatar} />
              {convo.unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{convo.unread}</Text>
                </View>
              )}
            </View>
            <View style={styles.convoContent}>
              <View style={styles.convoTopRow}>
                <Text style={[styles.convoName, convo.unread > 0 && { color: Colors.black }]}>
                  {convo.contactName}
                </Text>
                <Text style={styles.convoTime}>{convo.lastMessageTime}</Text>
              </View>
              <Text
                style={[styles.convoLastMsg, convo.unread > 0 && { color: Colors.black }]}
                numberOfLines={1}
              >
                {convo.lastMessage}
              </Text>
              <View style={styles.convoItemRow}>
                <Image source={{ uri: convo.itemImage }} style={styles.convoItemThumb} />
                <Text style={styles.convoItemTitle} numberOfLines={1}>{convo.itemTitle}</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function ChatView({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState(conversation.messages);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: `m${messages.length + 1}`,
      senderId: 'me',
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, msg]);
    setNewMessage('');

    // Simulated reply
    setTimeout(() => {
      const replies = [
        'Sounds good! Let me know.',
        'I can meet at the library if that works?',
        'Let me think about it.',
        'Sure, that works for me!',
        'Can we meet on campus?',
      ];
      const reply: Message = {
        id: `m${messages.length + 2}`,
        senderId: 'other',
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={[styles.chatHeader, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={Colors.black} strokeWidth={1.5} />
        </Pressable>
        <Image source={{ uri: conversation.contactAvatar }} style={styles.chatAvatar} />
        <Text style={styles.chatName}>{conversation.contactName}</Text>
      </View>

      {/* Item context */}
      <View style={styles.itemContext}>
        <Image source={{ uri: conversation.itemImage }} style={styles.itemContextThumb} />
        <Text style={styles.itemContextTitle}>{conversation.itemTitle}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item: msg }) => {
          const isMe = msg.senderId === 'me';
          return (
            <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                <Text style={[styles.msgText, isMe && { color: Colors.white }]}>{msg.text}</Text>
                <Text style={[styles.msgTime, isMe && { color: 'rgba(255,255,255,0.5)' }]}>
                  {msg.timestamp}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        <Pressable style={styles.cameraBtn}>
          <Camera size={22} color={Colors.gray400} strokeWidth={1.5} />
        </Pressable>
        <TextInput
          placeholder="Message..."
          placeholderTextColor={Colors.gray400}
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          style={styles.msgInput}
        />
        {newMessage.trim() !== '' && (
          <Pressable onPress={handleSend}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  headerTitle: { fontSize: 18, color: Colors.black, fontWeight: '600' },
  convoItem: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  avatarWrapper: { position: 'relative' },
  convoAvatar: { width: 56, height: 56, borderRadius: 28 },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.red500,
    minWidth: 18,
    minHeight: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: { color: Colors.white, fontSize: 10, fontWeight: '600' },
  convoContent: { flex: 1, paddingVertical: 2 },
  convoTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convoName: { fontSize: 14, color: Colors.gray700 },
  convoTime: { fontSize: 11, color: Colors.gray400 },
  convoLastMsg: { fontSize: 13, color: Colors.gray400, marginTop: 2 },
  convoItemRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  convoItemThumb: { width: 16, height: 16, borderRadius: 3 },
  convoItemTitle: { fontSize: 11, color: Colors.gray400, flex: 1 },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  chatAvatar: { width: 32, height: 32, borderRadius: 16 },
  chatName: { fontSize: 14, color: Colors.black, fontWeight: '500' },
  itemContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  itemContextThumb: { width: 36, height: 36, borderRadius: 8 },
  itemContextTitle: { fontSize: 12, color: Colors.gray500 },
  messagesList: { padding: 16, gap: 10 },
  msgRow: { marginBottom: 4 },
  msgRowRight: { alignItems: 'flex-end' },
  msgRowLeft: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16 },
  bubbleMe: { backgroundColor: Colors.black, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: Colors.gray100, borderBottomLeftRadius: 4 },
  msgText: { fontSize: 14, color: Colors.gray900, lineHeight: 20 },
  msgTime: { fontSize: 10, color: Colors.gray400, marginTop: 4 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    backgroundColor: Colors.white,
  },
  cameraBtn: { padding: 6 },
  msgInput: {
    flex: 1,
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.black,
  },
  sendText: { color: Colors.utaBlue, fontSize: 14, fontWeight: '500', paddingHorizontal: 4 },
});
