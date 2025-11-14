import { useEffect } from "react";
import { useChat } from "../../context/ChatContext";
import "./Chat.css";

export default function ConversationsList({ onSelectConversation }) {
  const {
    conversations,
    activeConversation,
    fetchConversations,
    selectConversation,
    loading,
  } = useChat();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleSelectConversation = (conversation) => {
    selectConversation(conversation);
    if (onSelectConversation) {
      onSelectConversation(conversation);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="conversations-list">
        <div className="loading-state">Loading conversations...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="conversations-list">
        <div className="empty-state">
          <h3>No conversations yet</h3>
          <p>Start a conversation with someone from their profile!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="conversations-list">
      <div className="conversations-header">
        <h2>Messages</h2>
      </div>
      <div className="conversations-container">
        {conversations.map((conversation) => {
          // Find the other participant (not current user)
          const otherParticipant = conversation.participants.find(
            (p) => p.userId !== conversation.currentUserId,
          );
          const isActive =
            activeConversation && activeConversation._id === conversation._id;
          const hasUnread = (conversation.unreadCount || 0) > 0;

          return (
            <div
              key={conversation._id}
              className={`conversation-item ${isActive ? "active" : ""} ${hasUnread ? "unread" : ""}`}
              onClick={() => handleSelectConversation(conversation)}
            >
              <div className="conversation-avatar">
                {otherParticipant?.displayName?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="conversation-content">
                <div className="conversation-header">
                  <span className="conversation-name">
                    {otherParticipant?.displayName || "Unknown User"}
                  </span>
                  <span className="conversation-time">
                    {formatTimestamp(conversation.lastMessage?.sentAt)}
                  </span>
                </div>
                <div className="conversation-preview">
                  <span className="last-message">
                    {conversation.lastMessage?.text || "No messages yet"}
                  </span>
                  {hasUnread && (
                    <span className="unread-badge">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
