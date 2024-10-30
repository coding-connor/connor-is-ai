"use client";

import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { EndpointsContext } from "@/app/agent";
import { useActions } from "@/utils/client";
import { LocalContext } from "@/app/shared";
import { RemoteRunnable } from "@langchain/core/runnables/remote";
import { Github, GithubLoading } from "./github";
import { CurrentWeather, CurrentWeatherLoading } from "./weather";
import { createStreamableUI, createStreamableValue } from "ai/rsc";
import { StreamEvent } from "@langchain/core/tracers/log_stream";
import { AIMessage } from "@/ai/message";
import { HumanMessageText } from "./message";
import { Greeting } from "./greeting";
import { useAuth } from "@clerk/nextjs";

export interface ChatProps {}

export default function Chat() {
  const actions = useActions<typeof EndpointsContext>();
  const { getToken } = useAuth();

  const [elements, setElements] = useState<JSX.Element[]>([]);
  const [history, setHistory] = useState<[role: string, content: string][]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionId = async () => {
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
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch session ID");
        }

        const data = await response.json();
        setSessionId(data.session_id);
        console.log("Session ID:", data.session_id);
      } catch (error) {
        console.error("Error fetching session ID:", error);
      }
    };

    fetchSessionId();
  }, [getToken]);

  async function onSubmit(input: string) {
    const newElements = [...elements];

    const element = await actions.agent({
      input,
      chat_history: history,
    });

    newElements.push(
      <div className="flex flex-col w-full gap-1 mt-auto" key={elements.length}>
        <HumanMessageText content={input} />
        <div className="flex flex-col gap-1 w-full max-w-fit mr-auto">
          {element.ui}
        </div>
      </div>
    );

    // consume the value stream to obtain the final string value
    // after which we can append to our chat history state
    (async () => {
      console.log("in here 1");
      let lastEvent = await element.lastEvent;
      console.log(element);
      console.log(lastEvent);
      if (Array.isArray(lastEvent)) {
        console.log("in here 2");
        if (lastEvent[0].invoke_model && lastEvent[0].invoke_model.result) {
          console.log("in here 3");
          setHistory((prev) => [
            ...prev,
            ["human", input],
            ["ai", lastEvent[0].invoke_model.result],
          ]);
        } else if (lastEvent[1].invoke_tools) {
          console.log("in here 4");
          setHistory((prev) => [
            ...prev,
            ["human", input],
            [
              "ai",
              `Tool result: ${JSON.stringify(lastEvent[1].invoke_tools.tool_result, null)}`,
            ],
          ]);
        } else {
          console.log("in here 5");
          setHistory((prev) => [...prev, ["human", input]]);
        }
      } else if (lastEvent.invoke_model && lastEvent.invoke_model.result) {
        console.log("in here 6");
        setHistory((prev) => [
          ...prev,
          ["human", input],
          ["ai", lastEvent.invoke_model.result],
        ]);
      } else if (lastEvent.input && lastEvent.result) {
        console.log("in here 7");
        // Currently in testing this is the only part of the code I'm reaching. It could be different with tool calls, so I'll leave the above for now.
        setHistory((prev) => [
          ...prev,
          ["human", input],
          ["ai", lastEvent.result],
        ]);
      }
    })();

    console.log(history);

    setElements(newElements);
    setInput("");
  }

  return (
    <div className="flex flex-col justify-center w-full">
      <div className="w-full h-[calc(100vh-395px)] overflow-y-scroll flex flex-col gap-4 mx-auto mb-2 border-[1px] border-gray-200 rounded-lg p-3 shadow-sm bg-gray-50/25">
        <Greeting></Greeting>
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
        This AI Representative can make mistakes. Check important info.{" "}
      </div>
    </div>
  );
}
