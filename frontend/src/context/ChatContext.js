import { createContext, useContext, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import * as chatApi from "../utils/chatApi";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { getAccessTokenSilently } = useAuth();

  // State
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // ==================== CONVERSATIONS ====================

  /**
   * Fetch all conversations for the current user
   */
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatApi.getConversations(getAccessTokenSilently);
      setConversations(data);

      // Calculate total unread count
      const totalUnread = data.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0,
      );
      setUnreadCount(totalUnread);

      return data;
    } catch (err) {
      setError(err.message);
      console.error("Error fetching conversations:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getAccessTokenSilently]);

  /**
   * Create or get existing conversation with another user
   */
  const startConversation = useCallback(
    async (recipientId) => {
      try {
        setLoading(true);
        setError(null);
        const conversation = await chatApi.createOrGetConversation(
          recipientId,
          getAccessTokenSilently,
        );

        // Add to conversations list if not already there
        setConversations((prev) => {
          const exists = prev.find((c) => c._id === conversation._id);
          if (exists) return prev;
          return [conversation, ...prev];
        });

        setActiveConversation(conversation);
        return conversation;
      } catch (err) {
        setError(err.message);
        console.error("Error starting conversation:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAccessTokenSilently],
  );

  /**
   * Delete a conversation
   */
  const removeConversation = useCallback(
    async (conversationId) => {
      try {
        setLoading(true);
        setError(null);
        await chatApi.deleteConversation(conversationId, getAccessTokenSilently);

        // Remove from local state
        setConversations((prev) =>
          prev.filter((c) => c._id !== conversationId),
        );

        // Clear active conversation if it was deleted
        if (activeConversation?._id === conversationId) {
          setActiveConversation(null);
        }

        // Clear messages for this conversation
        setMessages((prev) => {
          const updated = { ...prev };
          delete updated[conversationId];
          return updated;
        });
      } catch (err) {
        setError(err.message);
        console.error("Error deleting conversation:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [getAccessTokenSilently, activeConversation],
  );

  /**
   * Set the active conversation
   */
  const selectConversation = useCallback((conversation) => {
    setActiveConversation(conversation);
  }, []);

  // ==================== MESSAGES ====================

  /**
   * Fetch messages for a conversation
   */
  const fetchMessages = useCallback(
    async (conversationId, options = {}) => {
      try {
        setLoading(true);
        setError(null);
        const data = await chatApi.getMessages(
          conversationId,
          getAccessTokenSilently,
          options,
        );

        setMessages((prev) => ({
          ...prev,
          [conversationId]: data,
        }));

        return data;
      } catch (err) {
        setError(err.message);
        console.error("Error fetching messages:", err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [getAccessTokenSilently],
  );

  /**
   * Send a message in the active conversation
   */
  const sendMessage = useCallback(
    async (conversationId, text) => {
      try {
        setError(null);
        const newMessage = await chatApi.sendMessage(
          conversationId,
          text,
          getAccessTokenSilently,
        );

        // Add message to local state
        setMessages((prev) => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), newMessage],
        }));

        // Update conversation's last message
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv._id === conversationId) {
              return {
                ...conv,
                lastMessage: {
                  text,
                  sender: newMessage.sender,
                  sentAt: newMessage.createdAt,
                },
              };
            }
            return conv;
          }),
        );

        return newMessage;
      } catch (err) {
        setError(err.message);
        console.error("Error sending message:", err);
        throw err;
      }
    },
    [getAccessTokenSilently],
  );

  /**
   * Mark messages as read in a conversation
   */
  const markAsRead = useCallback(
    async (conversationId) => {
      try {
        await chatApi.markMessagesAsRead(
          conversationId,
          getAccessTokenSilently,
        );

        // Update local unread count
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv._id === conversationId) {
              return { ...conv, unreadCount: 0 };
            }
            return conv;
          }),
        );

        // Recalculate total unread
        setUnreadCount((prev) => {
          const conv = conversations.find((c) => c._id === conversationId);
          return Math.max(0, prev - (conv?.unreadCount || 0));
        });
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    },
    [getAccessTokenSilently, conversations],
  );

  /**
   * Delete a message
   */
  const removeMessage = useCallback(
    async (messageId, conversationId) => {
      try {
        await chatApi.deleteMessage(messageId, getAccessTokenSilently);

        // Remove from local state
        setMessages((prev) => ({
          ...prev,
          [conversationId]: prev[conversationId].filter(
            (msg) => msg._id !== messageId,
          ),
        }));
      } catch (err) {
        setError(err.message);
        console.error("Error deleting message:", err);
        throw err;
      }
    },
    [getAccessTokenSilently],
  );

  // ==================== REAL-TIME POLLING ====================

  /**
   * Refresh conversations and messages (call this periodically or manually)
   */
  const refreshChat = useCallback(async () => {
    await fetchConversations();
    if (activeConversation) {
      await fetchMessages(activeConversation._id);
    }
  }, [fetchConversations, fetchMessages, activeConversation]);

  // ==================== CONTEXT VALUE ====================

  const value = {
    // State
    conversations,
    activeConversation,
    messages,
    loading,
    error,
    unreadCount,

    // Conversation methods
    fetchConversations,
    startConversation,
    removeConversation,
    selectConversation,

    // Message methods
    fetchMessages,
    sendMessage,
    markAsRead,
    removeMessage,

    // Utility
    refreshChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
