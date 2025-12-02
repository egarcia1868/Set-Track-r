import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { BASE_URL } from "../utils/config";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { userProfile } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection once
  useEffect(() => {
    if (!userProfile?._id) return;

    // Initialize socket connection
    const socket = io(BASE_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socketRef.current = socket;

    // Connection events
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
      // Register user with their ID
      socket.emit("user:join", userProfile._id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [userProfile]);

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
      if (isTyping) {
        socketRef.current.emit("typing:start", {
          conversationId,
          userId: userProfile._id,
          displayName: userProfile.displayName || userProfile.profile?.displayName || "User",
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
    socket: socketRef.current,
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
