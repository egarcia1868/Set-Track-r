import { useState } from "react";
import ConversationsList from "../components/chat/ConversationsList";
import ChatWindow from "../components/chat/ChatWindow";
import "../components/chat/Chat.css";

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  return (
    <div className="chat-page">
      <ConversationsList onSelectConversation={setSelectedConversation} />
      <ChatWindow />
    </div>
  );
}
