import { useState, useEffect, useCallback, useRef } from "react";
import type { Message, MessageListResponse } from "@/types/message";

const API_BASE = "/api";

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initial fetch — latest 50
  useEffect(() => {
    fetch(`${API_BASE}/messages?limit=50`)
      .then((r) => r.json())
      .then((data: MessageListResponse) => {
        setMessages(data.messages);
        setHasMore(data.has_more);
      })
      .catch(console.error);
  }, []);

  // SSE connection for real-time updates
  useEffect(() => {
    const es = new EventSource(`${API_BASE}/messages/stream`);
    eventSourceRef.current = es;

    es.addEventListener("message", (e) => {
      const msg: Message = JSON.parse(e.data);
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      es.close();
    };
  }, []);

  // Load older messages (scroll up)
  const loadOlder = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    const oldestId = messages[0]?.id;
    if (oldestId === undefined) {
      setLoadingMore(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/messages?limit=50&before_id=${oldestId}`
      );
      const data: MessageListResponse = await res.json();
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.has_more);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [messages, hasMore, loadingMore]);

  const sendMessage = useCallback(async (content: string) => {
    await fetch(`${API_BASE}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user", content }),
    });
  }, []);

  return { messages, hasMore, loadingMore, loadOlder, sendMessage };
}
