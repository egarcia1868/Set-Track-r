import { useState, useRef, useEffect } from "react";
import { useChat } from "../../context/ChatContext";
import { useSocket } from "../../context/SocketContext";
import "./Chat.css";

export default function MessageInput({ conversationId }) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const { sendMessage, error } = useChat();
  const { emitTyping, sendMessage: sendSocketMessage } = useSocket();
  const typingTimeoutRef = useRef(null);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);

    // Emit typing indicator
    if (newText.trim()) {
      emitTyping(conversationId, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        emitTyping(conversationId, false);
      }, 2000);
    } else {
      emitTyping(conversationId, false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!text.trim() || isSending) return;

    // Stop typing indicator
    emitTyping(conversationId, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      setIsSending(true);
      const message = await sendMessage(conversationId, text.trim());

      // Also emit via socket for real-time delivery
      sendSocketMessage(conversationId, message);

      setText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container">
      {error && <div className="message-error">{error}</div>}
      <form className="message-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="message-input"
          placeholder="Type a message..."
          value={text}
          onChange={handleTextChange}
          onKeyPress={handleKeyPress}
          disabled={isSending}
        />
        <button
          type="submit"
          className="send-button"
          disabled={!text.trim() || isSending}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
