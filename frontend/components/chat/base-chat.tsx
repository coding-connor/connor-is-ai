import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";

interface BaseChatProps {
  onSubmit: (input: string, threadId: string) => Promise<void>;
  elements: JSX.Element[];
  input: string;
  setInput: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  submitLabel?: string;
  onNewChat: () => void;
  headerContent?: React.ReactNode;
  greeting?: React.ReactNode;
}

export function BaseChat({
  onSubmit,
  elements,
  input,
  setInput,
  isLoading,
  placeholder = "Ask something...",
  submitLabel = "Submit",
  onNewChat,
  headerContent,
  greeting,
}: BaseChatProps) {
  const { getToken } = useAuth();
  const [threadId, setThreadId] = useState<string>("");

  useEffect(() => {
    const fetchThreadId = async () => {
      try {
        const token = await getToken({ template: "backend" });
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat-session`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch thread ID");
        }

        const data = await response.json();
        setThreadId(data.session_id);
      } catch (error) {
        console.error("Error fetching Thread ID:", error);
      }
    };

    fetchThreadId();
  }, [getToken]);

  const handleNewChat = async () => {
    try {
      const token = await getToken({ template: "backend" });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat-session/new`,
        {
          method: "POST",
          body: JSON.stringify({ session_id: threadId }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to end session");
      }
      console.log("Session ended successfully");
      const data = await response.json();
      setThreadId(data.session_id);
      onNewChat();
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  return (
    <div className="flex flex-col justify-center w-full">
      <div className="w-full h-[calc(100vh-395px)] overflow-y-scroll flex flex-col gap-4 mx-auto mb-2 border-[1px] border-gray-200 rounded-lg p-3 shadow-sm bg-gray-50/25">
        <div className="absolute top-4 right-4">{headerContent}</div>
        {greeting}
        <div className="flex flex-col w-full gap-1 mt-auto">{elements}</div>
      </div>
      <div className="w-full flex flex-col gap-4 mx-auto mb-2 bg-gray-50/25">
        <form
          onSubmit={async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await onSubmit(input, threadId);
          }}
          className="w-full flex flex-row gap-2"
        >
          <Input
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {submitLabel}
          </Button>
        </form>
      </div>
      <div className="text-center text-xs mt-2 text-gray-400">
        AI makes mistakes. Check important info.{" "}
        <span className="hidden sm:inline">
          (Ideally by interviewing Connor)
        </span>
      </div>
    </div>
  );
}
