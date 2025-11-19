import { useEffect, useRef, useState } from "react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import MessageInput from "./MessageInput";
import "./Chat.css";

export default function ChatWindow() {
  const {
    activeConversation,
    messages,
    fetchMessages,
    markAsRead,
    addIncomingMessage,
  } = useChat();
  const { userProfile } = useAuth();
  const { joinConversation, leaveConversation, onNewMessage, onTypingUpdate } =
    useSocket();
  const messagesEndRef = useRef(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUser, setTypingUser] = useState(null);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      setIsLoadingMessages(true);
      fetchMessages(activeConversation._id)
        .then(() => {
          // Mark as read when opening conversation
          markAsRead(activeConversation._id);
        })
        .finally(() => {
          setIsLoadingMessages(false);
        });

      // Join socket room for this conversation
      joinConversation(activeConversation._id);

      // Cleanup: leave room when switching conversations
      return () => {
        leaveConversation(activeConversation._id);
      };
    }
  }, [
    activeConversation,
    fetchMessages,
    markAsRead,
    joinConversation,
    leaveConversation,
  ]);

  // Listen for real-time messages
  useEffect(() => {
    const cleanup = onNewMessage((newMessage) => {
      // Add incoming message from other users directly to local state
      console.log("New message received:", newMessage);
      if (activeConversation && newMessage.conversationId) {
        addIncomingMessage(newMessage.conversationId, newMessage);
      }
    });

    return cleanup;
  }, [onNewMessage, activeConversation, addIncomingMessage]);

  // Listen for typing indicators
  useEffect(() => {
    const cleanup = onTypingUpdate((data) => {
      if (data.isTyping) {
        setTypingUser(data.displayName);
        // Clear typing indicator after 3 seconds
        setTimeout(() => setTypingUser(null), 3000);
      } else {
        setTypingUser(null);
      }
    });

    return cleanup;
  }, [onTypingUpdate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConversation]);

  if (!activeConversation) {
    return (
      <div className="chat-window">
        <div className="no-conversation-selected">
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    );
  }

  const conversationMessages = messages[activeConversation._id] || [];
  const otherParticipant = activeConversation.participants.find(
    (p) => p.userId !== userProfile?._id,
  );

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-content">
          <div className="chat-avatar">
            {otherParticipant?.displayName?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="chat-header-info">
            <h3>{otherParticipant?.displayName || "Unknown User"}</h3>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        {isLoadingMessages ? (
          <div className="loading-messages">Loading messages...</div>
        ) : conversationMessages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="messages-list">
            {conversationMessages.map((message, index) => {
              const isOwnMessage = message.sender?._id === userProfile?._id;
              const showAvatar =
                index === 0 ||
                conversationMessages[index - 1]?.sender?._id !==
                  message.sender?._id;

              return (
                <div
                  key={message._id}
                  className={`message-wrapper ${isOwnMessage ? "own-message" : "other-message"}`}
                >
                  {!isOwnMessage && showAvatar && (
                    <div className="message-avatar">
                      {otherParticipant?.displayName?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  {!isOwnMessage && !showAvatar && (
                    <div className="message-avatar-spacer" />
                  )}
                  <div className="message-bubble">
                    <div className="message-text">{message.text}</div>
                    <div className="message-time">
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
        {typingUser && (
          <div className="typing-indicator">{typingUser} is typing...</div>
        )}
      </div>

      {/* Message Input */}
      <MessageInput conversationId={activeConversation._id} />
    </div>
  );
}
