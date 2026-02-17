import type { Message } from "@/types/message";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-2 px-3 py-2 overflow-hidden ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback
          className={
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }
        >
          {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={`min-w-0 rounded-2xl px-3 py-2 ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
          {message.content}
        </p>
        <p
          className={`text-[10px] mt-1 ${
            isUser
              ? "text-primary-foreground/60 text-right"
              : "text-muted-foreground/60"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
