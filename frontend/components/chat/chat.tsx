"use client";

import { EndpointsContext } from "@/app/agent";
import { LocalContext } from "@/app/shared";
import { useActions } from "@/utils/client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Greeting } from "./greeting";
import { HumanMessageText } from "./message";
import { ModeSelector } from "./mode-selector";
import { BaseChat } from "./base-chat";

export interface ChatProps {
  endpoint?: string;
}

export default function Chat({ endpoint = "chat" }: ChatProps) {
  const actions = useActions<typeof EndpointsContext>();
  const [elements, setElements] = useState<JSX.Element[]>([]);
  const [input, setInput] = useState("");

  async function onSubmit(input: string, threadId: string) {
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

  const handleNewChat = () => {
    setElements([]);
    setInput("");
  };

  return (
    <LocalContext.Provider value={onSubmit}>
      <BaseChat
        onSubmit={onSubmit}
        elements={elements}
        input={input}
        setInput={setInput}
        placeholder="Ask Connor something..."
        headerContent={<ModeSelector onNewChat={handleNewChat} />}
        greeting={<Greeting endpoint={endpoint} />}
        onNewChat={handleNewChat}
      />
    </LocalContext.Provider>
  );
}
