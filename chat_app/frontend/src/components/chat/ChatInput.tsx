import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizonal } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t bg-background px-4 py-3 flex gap-2 items-end"
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        placeholder={disabled ? "Waiting for agent..." : "Type a message..."}
        disabled={disabled}
        rows={1}
        className="min-w-0 flex-1 resize-none rounded-xl border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground disabled:opacity-50"
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !value.trim()}
        className="shrink-0 rounded-xl h-10 w-10"
      >
        <SendHorizonal className="h-4 w-4" />
      </Button>
    </form>
  );
}
