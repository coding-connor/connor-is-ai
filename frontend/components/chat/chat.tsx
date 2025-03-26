"use client";

import { EndpointsContext } from "@/app/agent";
import { LocalContext } from "@/app/shared";
import { useActions } from "@/utils/client";
import { useAuth } from "@clerk/nextjs";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Greeting } from "./greeting";
import { HumanMessageText } from "./message";
import { ModeSelector } from "./mode-selector";

export interface ChatProps {
  endpoint?: string;
}

export default function Chat({ endpoint = "chat" }: ChatProps) {
  const actions = useActions<typeof EndpointsContext>();
  const { getToken } = useAuth();

  const [elements, setElements] = useState<JSX.Element[]>([]);
  const [input, setInput] = useState("");
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
        console.log("Thread ID:", data.session_id);
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
      setElements([]);
      setInput("");
      console.log("Thread ID:", data.session_id);
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  async function onSubmit(input: string) {
    const newElements = [...elements];

    const element = await actions.agent({
      input,
      thread_id: threadId,
      endpoint,
    });

    newElements.push(
      <div className="flex flex-col w-full gap-1 mt-auto" key={elements.length}>
        <HumanMessageText content={input} />
        <div className="flex flex-col gap-1 w-full max-w-fit mr-auto">
          {element.ui}
        </div>
      </div>,
    );

    setElements(newElements);
    setInput("");
  }

  return (
    <div className="flex flex-col justify-center w-full">
      <div className="w-full h-[calc(100vh-395px)] overflow-y-scroll flex flex-col gap-4 mx-auto mb-2 border-[1px] border-gray-200 rounded-lg p-3 shadow-sm bg-gray-50/25">
        <div className="absolute top-4 right-4">
          <ModeSelector onNewChat={handleNewChat} />
        </div>
        <Greeting endpoint={endpoint} />
        <LocalContext.Provider value={onSubmit}>
          <div className="flex flex-col w-full gap-1 mt-auto">{elements}</div>
        </LocalContext.Provider>
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
            placeholder="Ask Connor something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit">Submit</Button>
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
