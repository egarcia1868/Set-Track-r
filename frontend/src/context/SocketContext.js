import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth0 } from "@auth0/auth0-react";
import { BASE_URL } from "../utils/config";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { userProfile } = useAuth();
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection once
  useEffect(() => {
    if (!userProfile?._id || !isAuthenticated) return;

    // Prevent duplicate socket creation - if socket already exists and is connected, reuse it
    if (socketRef.current && socketRef.current.connected) {
      return;
    }

    // If socket exists but is disconnected, disconnect it properly first
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Get auth token and initialize socket connection
    const initSocket = async () => {
      try {
        const token = await getAccessTokenSilently();

        // Initialize socket connection with auth token
        const socket = io(BASE_URL, {
          transports: ["websocket", "polling"],
          withCredentials: true,
          auth: { token }, // Send token for server-side verification
        });

        socketRef.current = socket;

        // Connection events
        socket.on("connect", () => {
          setIsConnected(true);
          // User is auto-registered on server via auth middleware
        });

        socket.on("connect_error", (error) => {
          console.error("Socket connection error:", error.message);
          setIsConnected(false);
        });

        socket.on("error", (error) => {
          console.error("Socket error:", error.message);
        });

        socket.on("disconnect", () => {
          setIsConnected(false);
        });
      } catch (error) {
        console.error("Failed to get auth token for socket:", error);
      }
    };

    initSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [userProfile, isAuthenticated, getAccessTokenSilently]);

  /**
   * Join a conversation room
   */
  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit("conversation:join", conversationId);
    }
  }, []);

  /**
   * Leave a conversation room
   */
  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit("conversation:leave", conversationId);
    }
  }, []);

  /**
   * Send a message via socket (for real-time broadcasting)
   */
  const sendMessage = useCallback((conversationId, message) => {
    if (socketRef.current && conversationId && message) {
      socketRef.current.emit("message:send", { conversationId, message });
    }
  }, []);

  /**
   * Listen for new messages
   */
  const onNewMessage = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on("message:new", callback);

      // Cleanup function
      return () => {
        socketRef.current.off("message:new", callback);
      };
    }
  }, []);

  /**
   * Emit typing indicator
   */
  const emitTyping = useCallback((conversationId, isTyping) => {
    if (socketRef.current && conversationId && userProfile) {
      const displayName = userProfile.displayName || userProfile.profile?.displayName || userProfile.name || "User";

      if (isTyping) {
        socketRef.current.emit("typing:start", {
          conversationId,
          userId: userProfile._id,
          displayName,
        });
      } else {
        socketRef.current.emit("typing:stop", {
          conversationId,
          userId: userProfile._id,
        });
      }
    }
  }, [userProfile]);

  /**
   * Listen for typing indicators
   */
  const onTypingUpdate = useCallback((callback) => {
    if (socketRef.current) {
      socketRef.current.on("typing:update", callback);

      // Cleanup function
      return () => {
        socketRef.current.off("typing:update", callback);
      };
    }
  }, []);

  const value = {
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    onNewMessage,
    emitTyping,
    onTypingUpdate,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
