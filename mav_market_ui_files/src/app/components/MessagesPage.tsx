import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Camera } from "lucide-react";
import { conversations, type Conversation } from "../data/mockData";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function MessagesPage() {
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);

  if (activeConvo) {
    return (
      <ChatView
        conversation={activeConvo}
        onBack={() => setActiveConvo(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-14 pb-3 border-b border-gray-100">
        <h1 className="text-lg text-black">Messages</h1>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((convo) => (
          <button
            key={convo.id}
            onClick={() => setActiveConvo(convo)}
            className="w-full flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="relative flex-shrink-0">
              <ImageWithFallback
                src={convo.contactAvatar}
                alt={convo.contactName}
                className="w-14 h-14 rounded-full object-cover"
              />
              {convo.unread > 0 && (
                <div className="absolute -top-0.5 -right-0.5 bg-red-500 w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] text-white min-w-[18px] min-h-[18px]">
                  {convo.unread}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <div className="flex justify-between items-center">
                <h3 className={`text-sm ${convo.unread > 0 ? "text-black" : "text-gray-700"}`}>
                  {convo.contactName}
                </h3>
                <span className="text-[11px] text-gray-400 flex-shrink-0">
                  {convo.lastMessageTime}
                </span>
              </div>
              <p className={`text-[13px] truncate mt-0.5 ${convo.unread > 0 ? "text-black" : "text-gray-400"}`}>
                {convo.lastMessage}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <ImageWithFallback
                  src={convo.itemImage}
                  alt={convo.itemTitle}
                  className="w-4 h-4 rounded object-cover"
                />
                <span className="text-[11px] text-gray-400 truncate">
                  {convo.itemTitle}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatView({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState(conversation.messages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: `m${messages.length + 1}`,
      senderId: "me",
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
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
      const reply = {
        id: `m${messages.length + 2}`,
        senderId: "other",
        text: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, reply]);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="px-4 pt-3 pb-3 flex items-center gap-3 border-b border-gray-100">
        <button onClick={onBack} className="text-black p-1 -ml-1">
          <ArrowLeft size={22} strokeWidth={1.5} />
        </button>
        <ImageWithFallback
          src={conversation.contactAvatar}
          alt={conversation.contactName}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="text-sm text-black">{conversation.contactName}</h3>
        </div>
      </div>

      {/* Item context */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
        <ImageWithFallback
          src={conversation.itemImage}
          alt={conversation.itemTitle}
          className="w-9 h-9 rounded-lg object-cover"
        />
        <span className="text-xs text-gray-500">{conversation.itemTitle}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
        {messages.map((msg) => {
          const isMe = msg.senderId === "me";
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-3.5 py-2 rounded-2xl ${
                  isMe
                    ? "bg-black text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}
              >
                <p className="text-[14px] leading-snug">{msg.text}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    isMe ? "text-white/50" : "text-gray-400"
                  }`}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-gray-400">
            <Camera size={22} strokeWidth={1.5} />
          </button>
          <input
            type="text"
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-gray-50 border border-gray-100 px-4 py-2 rounded-full text-sm placeholder:text-gray-400 focus:outline-none"
          />
          {newMessage.trim() && (
            <button
              onClick={handleSend}
              className="text-[#0064B1] text-sm px-1"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}