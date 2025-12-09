import { useEffect } from "react";
import { useChat } from "../context/ChatContext";
import ConversationsList from "../components/chat/ConversationsList";
import ChatWindow from "../components/chat/ChatWindow";
import "../components/chat/Chat.css";

export default function Chat() {
  const { selectConversation } = useChat();

  // Clear active conversation when leaving the chat page
  useEffect(() => {
    return () => {
      selectConversation(null);
    };
  }, [selectConversation]);

  return (
    <div className="chat-page">
      <ConversationsList />
      <ChatWindow />
    </div>
  );
}
