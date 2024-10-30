import { RemoteRunnable } from "@langchain/core/runnables/remote";
import { exposeEndpoints, streamRunnableUI } from "@/utils/server";
import "server-only";
import { StreamEvent } from "@langchain/core/tracers/log_stream";
import { EventHandlerFields } from "@/utils/server";
import {
  Github,
  GithubError,
  GithubLoading,
  GithubProps,
} from "@/components/chat/github";
import {
  CurrentWeatherLoading,
  CurrentWeather,
} from "@/components/chat/weather";
import { createStreamableUI, createStreamableValue } from "ai/rsc";
import { AIMessage } from "@/ai/message";
import {
  Calendly,
  CalendlyError,
  CalendlyLoading,
} from "@/components/chat/calendly";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { getAuthToken } from "@/utils/server-token";

const API_URL = "http://localhost:8000/chat";

type ToolComponent<T = any> = {
  loading: (props?: T) => JSX.Element;
  final: (props?: T) => JSX.Element;
  error?: (props?: T) => JSX.Element;
};

type ToolComponentMap = {
  [tool: string]: ToolComponent;
};

type ToolState = {
  selectedToolComponent: ToolComponent | null;
  selectedToolUI: ReturnType<typeof createStreamableUI> | null;
};

type EventHandler = (event: StreamEvent, ...args: any[]) => void;

const TOOL_COMPONENT_MAP: ToolComponentMap = {
  "github-repo": {
    loading: (props?: any) => <GithubLoading {...props} />,
    final: (props?: any) => <Github {...props} />,
    error: (props?: any) => <GithubError {...props} />,
  },
  "weather-data": {
    loading: (props?: any) => <CurrentWeatherLoading {...props} />,
    final: (props?: any) => <CurrentWeather {...props} />,
  },
  calendly: {
    loading: (props?: any) => <CalendlyLoading {...props} />,
    final: (props?: any) => <Calendly {...props} />,
    error: (props?: any) => <CalendlyError {...props} />,
  },
};

function isInvokeModelEvent(type: string, event: StreamEvent): boolean {
  return (
    type === "end" &&
    event.data.output &&
    typeof event.data.output === "object" &&
    event.name === "invoke_model"
  );
}

function isInvokeToolsEvent(type: string, event: StreamEvent): boolean {
  return (
    type === "end" &&
    event.data.output &&
    typeof event.data.output === "object" &&
    event.name === "invoke_tools"
  );
}

function isChatModelStreamEvent(event: StreamEvent): boolean {
  return (
    event.event === "on_chat_model_stream" &&
    event.data.chunk &&
    typeof event.data.chunk === "object"
  );
}

async function agent(inputs: {
  input: string;
  chat_history: [role: string, content: string][];
  session_id: string;
}) {
  "use server";
  const token = await getAuthToken();

  const remoteRunnable = new RemoteRunnable({
    url: API_URL,
    options: { headers: { cookie: `__session=${token};` } },
  });

  // Note: The selected tool component and UI are stored in the outer scope, this allows for mutation to maximize performance
  const toolState: ToolState = {
    selectedToolComponent: null,
    selectedToolUI: null,
  };

  const handleInvokeModelEvent: EventHandler = (
    event: StreamEvent,
    fields: EventHandlerFields,
    toolState: ToolState
  ) => {
    if (
      "tool_calls" in event.data.output &&
      event.data.output.tool_calls.length > 0
    ) {
      const toolCall = event.data.output.tool_calls[0];
      if (!toolState.selectedToolComponent && !toolState.selectedToolUI) {
        toolState.selectedToolComponent = TOOL_COMPONENT_MAP[toolCall.type];
        toolState.selectedToolUI = createStreamableUI(
          toolState.selectedToolComponent.loading()
        );
        fields.ui.append(toolState.selectedToolUI?.value);
      }
    }
  };

  const handleInvokeToolsEvent: EventHandler = (
    event: StreamEvent,
    fields: EventHandlerFields,
    toolState: ToolState
  ) => {
    if (toolState.selectedToolUI && toolState.selectedToolComponent) {
      const toolData = event.data.output.tool_result;
      if (toolData.error) {
        toolState.selectedToolUI.done(
          toolState.selectedToolComponent.error(toolData)
        );
        return;
      }
      console.log("Tool data:", toolData);
      toolState.selectedToolUI.done(
        toolState.selectedToolComponent.final(toolData)
      );
    }
  };

  const handleChatModelStreamEvent: EventHandler = (
    event: StreamEvent,
    fields: EventHandlerFields
  ) => {
    if (!fields.callbacks[event.run_id]) {
      const textStream = createStreamableValue();
      fields.ui.append(<AIMessage value={textStream.value} />);
      fields.callbacks[event.run_id] = textStream;
    }

    if (fields.callbacks[event.run_id]) {
      fields.callbacks[event.run_id].append(event.data.chunk.content);
    }
  };

  const dispatchEventHandlers: EventHandler = (
    event: StreamEvent,
    fields: EventHandlerFields
  ) => {
    const [type] = event.event.split("_").slice(2);

    if (isInvokeModelEvent(type, event)) {
      console.log("Invoke model event:", event);
      handleInvokeModelEvent(event, fields, toolState);
    }
    if (isInvokeToolsEvent(type, event)) {
      console.log("Invoke tools event:", event);
      handleInvokeToolsEvent(event, fields, toolState);
    }
    if (isChatModelStreamEvent(event)) {
      handleChatModelStreamEvent(event, fields);
    }
  };

  console.log("Inputs:", inputs);

  return streamRunnableUI(
    remoteRunnable,
    {
      input: [
        ...inputs.chat_history.map(([role, content]) => ({
          type: role,
          content,
          session_id: inputs.session_id,
        })),
        {
          type: "human",
          content: inputs.input,
          session_id: inputs.session_id,
        },
      ],
    },
    {
      dispatchEventHandlers,
    }
  );
}

export const EndpointsContext = exposeEndpoints({ agent });
