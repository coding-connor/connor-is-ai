import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { HumanMessageText } from "./message";

export interface ResearchProps {
  onNewChat: () => void;
}

export default function Research({ onNewChat }: ResearchProps) {
  const { getToken } = useAuth();
  const [elements, setElements] = useState<JSX.Element[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  async function onSubmit(input: string) {
    setIsLoading(true);
    const newElements = [...elements];

    try {
      const token = await getToken({ template: "backend" });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/deep-research`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            topic: input,
            thread_id: threadId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Research request failed");
      }

      const data = await response.json();

      newElements.push(
        <div
          className="flex flex-col w-full gap-1 mt-auto"
          key={elements.length}
        >
          <HumanMessageText content={input} />
          <div className="flex flex-col gap-1 w-full max-w-fit mr-auto">
            {data.final_report}
          </div>
        </div>,
      );
    } catch (error) {
      console.error("Research error:", error);
      newElements.push(
        <div
          className="flex flex-col w-full gap-1 mt-auto"
          key={elements.length}
        >
          <HumanMessageText content={input} />
          <div className="flex flex-col gap-1 w-full max-w-fit mr-auto text-red-500">
            Error: Failed to complete research. Please try again.
          </div>
        </div>,
      );
    } finally {
      setIsLoading(false);
      setElements(newElements);
      setInput("");
    }
  }

  return (
    <div className="flex flex-col justify-center w-full">
      <div className="w-full h-[calc(100vh-395px)] overflow-y-scroll flex flex-col gap-4 mx-auto mb-2 border-[1px] border-gray-200 rounded-lg p-3 shadow-sm bg-gray-50/25">
        <div className="absolute top-4 right-4">
          <Button onClick={onNewChat} variant="outline">
            New Research
          </Button>
        </div>
        <div className="text-center text-gray-600">
          Enter a topic to research and I'll provide a comprehensive analysis.
        </div>
        <div className="flex flex-col w-full gap-1 mt-auto">{elements}</div>
      </div>
      <div className="w-full flex flex-col gap-4 mx-auto mb-2 bg-gray-50/25">
        <form
          onSubmit={async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await onSubmit(input);
          }}
          className="w-full flex flex-row gap-2"
        >
          <Input
            placeholder="Enter a topic to research..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Researching..." : "Research"}
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
