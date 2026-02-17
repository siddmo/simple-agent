import { useMessages } from "@/hooks/useMessages";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Bot } from "lucide-react";

export function ChatPage() {
  const { messages, hasMore, loadingMore, loadOlder, sendMessage } = useMessages();

  return (
    <div className="flex flex-col h-dvh w-full max-w-2xl mx-auto bg-background overflow-hidden">
      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">Coding Agent</h1>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
      </header>

      {/* Messages */}
      <MessageList
        messages={messages}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadOlder={loadOlder}
      />

      {/* Input */}
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
