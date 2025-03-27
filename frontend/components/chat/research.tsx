import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { AIMessageText, HumanMessageText } from "./message";
import { BaseChat } from "./base-chat";
import { Greeting } from "./greeting";

export interface ResearchProps {
  onNewChat: () => void;
}

export default function Research({ onNewChat }: ResearchProps) {
  const { getToken } = useAuth();
  const [elements, setElements] = useState<JSX.Element[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(input: string, threadId: string) {
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
          <div className="flex flex-col gap-1 w-full max-w-fit mr-auto prose prose-sm">
            <AIMessageText content={data.final_report} />
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

  const handleNewChat = () => {
    setElements([]);
    setInput("");
  };

  return (
    <BaseChat
      onSubmit={onSubmit}
      elements={elements}
      input={input}
      setInput={setInput}
      isLoading={isLoading}
      placeholder="Enter a topic to research..."
      submitLabel={isLoading ? "Researching..." : "Research"}
      greeting={<Greeting endpoint="deep-research" />}
      onNewChat={handleNewChat}
    />
  );
}
