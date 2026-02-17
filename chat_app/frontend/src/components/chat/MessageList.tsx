import { useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { Loader2 } from "lucide-react";
import type { Message } from "@/types/message";

interface MessageListProps {
  messages: Message[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadOlder: () => void;
}

export function MessageList({
  messages,
  hasMore,
  loadingMore,
  onLoadOlder,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  // Auto-scroll to bottom only when new messages are appended (not when loading older)
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const newCount = messages.length;
    prevMessageCountRef.current = newCount;

    // New message appended at the bottom
    if (newCount > prevCount && prevCount > 0) {
      const lastMsg = messages[newCount - 1];
      const prevLastMsg = messages[prevCount - 1];
      if (lastMsg && prevLastMsg && lastMsg.id > prevLastMsg.id) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }

    // Initial load — scroll to bottom immediately
    if (prevCount === 0 && newCount > 0) {
      bottomRef.current?.scrollIntoView();
    }
  }, [messages]);

  // Intersection observer to detect scrolling to top
  const observerRef = useRef<IntersectionObserver | null>(null);
  const topSentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore) {
            onLoadOlder();
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    },
    [hasMore, loadingMore, onLoadOlder]
  );

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="py-4 overflow-x-hidden">
        {/* Top sentinel for infinite scroll */}
        <div ref={topSentinelCallback}>
          {loadingMore && (
            <div className="flex justify-center py-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Send a message to start chatting</p>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
