"use client";

import { useState } from "react";
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

export interface ChatProps {}

export default function Chat() {
  const actions = useActions<typeof EndpointsContext>();

  const [elements, setElements] = useState<JSX.Element[]>([]);
  const [history, setHistory] = useState<[role: string, content: string][]>([]);
  const [input, setInput] = useState("");

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
    <div className="w-[70vw] overflow-y-scroll h-[80vh] flex flex-col gap-4 mx-auto border-[1px] border-gray-200 rounded-lg p-3 shadow-sm bg-gray-50/25">
      <LocalContext.Provider value={onSubmit}>
        <div className="flex flex-col w-full gap-1 mt-auto">{elements}</div>
      </LocalContext.Provider>
      <form
        onSubmit={async (e) => {
          e.stopPropagation();
          e.preventDefault();
          await onSubmit(input);
        }}
        className="w-full flex flex-row gap-2"
      >
        <Input
          placeholder="What are you looking for in your next job?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}