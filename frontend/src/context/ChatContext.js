import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import * as chatApi from "../utils/chatApi";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { getAccessTokenSilently, isAuthenticated, userProfile } = useAuth();
  const { onNewMessage, isConnected: isSocketConnected } = useSocket();

  // State
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const hasFetchedRef = useRef(false);

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
   * Archive a conversation (hide it from the list)
   */
  const archiveConversation = useCallback(
    async (conversationId) => {
      try {
        console.log("ChatContext: Archiving conversation", conversationId);
        setError(null);
        await chatApi.archiveConversation(conversationId, getAccessTokenSilently);
        console.log("ChatContext: API call successful");

        // Remove from local state
        setConversations((prev) => {
          console.log("ChatContext: Removing from conversations list");
          return prev.filter((c) => c._id !== conversationId);
        });

        // Clear active conversation if it was archived
        if (activeConversation?._id === conversationId) {
          console.log("ChatContext: Clearing active conversation");
          setActiveConversation(null);
        }

        // Clear messages for this conversation
        setMessages((prev) => {
          const updated = { ...prev };
          delete updated[conversationId];
          return updated;
        });
        console.log("ChatContext: Archive complete");
      } catch (err) {
        setError(err.message);
        console.error("Error archiving conversation:", err);
        throw err;
      }
    },
    [getAccessTokenSilently, activeConversation],
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

        // Update local unread count and get the previous unread count
        let previousUnread = 0;
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv._id === conversationId) {
              previousUnread = conv.unreadCount || 0;
              return { ...conv, unreadCount: 0 };
            }
            return conv;
          }),
        );

        // Recalculate total unread by subtracting the previous unread count
        setUnreadCount((prev) => Math.max(0, prev - previousUnread));
      } catch (err) {
        console.error("Error marking messages as read:", err);
      }
    },
    [getAccessTokenSilently],
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

  /**
   * Add an incoming message from Socket.io to local state
   */
  const addIncomingMessage = useCallback((conversationId, message) => {
    setMessages((prev) => {
      const existingMessages = prev[conversationId] || [];

      // Check if message already exists (prevent duplicates)
      const messageExists = existingMessages.some(
        (msg) => msg._id === message._id,
      );

      if (messageExists) {
        return prev; // Don't add duplicate
      }

      return {
        ...prev,
        [conversationId]: [...existingMessages, message],
      };
    });

    // Update conversation's last message
    setConversations((prev) => {
      const conversationExists = prev.some((conv) => conv._id === conversationId);

      // If conversation doesn't exist in local state (was archived),
      // we need to refetch to get the unarchived conversation
      if (!conversationExists) {
        fetchConversations();
        return prev;
      }

      return prev.map((conv) => {
        if (conv._id === conversationId) {
          return {
            ...conv,
            lastMessage: {
              text: message.text,
              sender: message.sender,
              sentAt: message.createdAt,
            },
          };
        }
        return conv;
      });
    });
  }, [fetchConversations]);

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

  // ==================== INITIALIZATION ====================

  /**
   * Fetch conversations once when authenticated to populate unread count
   * Uses ref to prevent re-fetching on every render
   */
  useEffect(() => {
    if (isAuthenticated && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  /**
   * Listen for incoming messages globally and update unread count
   */
  useEffect(() => {
    if (!isAuthenticated || !userProfile || !isSocketConnected) {
      return;
    }

    const cleanup = onNewMessage((newMessage) => {
      if (!newMessage.conversationId) return;

      // Check if this message is from the current user
      const isOwnMessage = String(newMessage.sender?._id) === String(userProfile._id);

      // SKIP OWN MESSAGES - they're already added by the REST API when we send them
      if (isOwnMessage) return;

      // This is a message from another user - add it to local state
      addIncomingMessage(newMessage.conversationId, newMessage);

      // Check if the message is for a conversation that's NOT currently active
      const isForInactiveConversation =
        !activeConversation ||
        String(newMessage.conversationId) !== String(activeConversation._id);

      // Increment unread count if message is for an inactive conversation
      if (isForInactiveConversation) {
        // Increment the conversation's unread count
        setConversations((prev) =>
          prev.map((conv) => {
            if (String(conv._id) === String(newMessage.conversationId)) {
              return {
                ...conv,
                unreadCount: (conv.unreadCount || 0) + 1,
              };
            }
            return conv;
          })
        );

        // Increment total unread count
        setUnreadCount((prev) => prev + 1);
      }
    });

    return cleanup;
  }, [onNewMessage, addIncomingMessage, activeConversation, isAuthenticated, userProfile, isSocketConnected]);

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
    archiveConversation,
    removeConversation,
    selectConversation,

    // Message methods
    fetchMessages,
    sendMessage,
    markAsRead,
    removeMessage,
    addIncomingMessage,

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
