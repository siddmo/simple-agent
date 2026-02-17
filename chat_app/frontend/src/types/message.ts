export interface Message {
  id: number;
  role: "user" | "agent";
  content: string;
  timestamp: string;
}

export interface MessageListResponse {
  messages: Message[];
  has_more: boolean;
}
