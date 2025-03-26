import { AIMessage } from "@/ai/message";
import {
  Calendly,
  CalendlyError,
  CalendlyLoading,
} from "@/components/chat/calendly";
import { Github, GithubError, GithubLoading } from "@/components/chat/github";
import { LoadingMessage } from "@/components/chat/message";
import {
  CurrentWeather,
  CurrentWeatherLoading,
} from "@/components/chat/weather";
import {
  EventHandlerFields,
  exposeEndpoints,
  streamRunnableUI,
} from "@/utils/server";
import { getAuthToken } from "@/utils/server-token";
import { RemoteRunnable } from "@langchain/core/runnables/remote";
import { StreamEvent } from "@langchain/core/tracers/log_stream";
import { createStreamableValue } from "ai/rsc";
import "server-only";

const API_URL = `${process.env.K8S_BACKEND_URL}`;

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
  selectedToolUI: JSX.Element | null;
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

function isChainStartEvent(event: StreamEvent): boolean {
  return event.event === "on_chain_start" && event.name === "graph_wrapper";
}

function isToolStartEvent(event: StreamEvent): boolean {
  return event.event === "on_tool_start" && event.name in TOOL_COMPONENT_MAP;
}

function IsToolsEndEvent(event: StreamEvent): boolean {
  return event.event === "on_tool_end" && event.name in TOOL_COMPONENT_MAP;
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
  thread_id: string;
  endpoint: string;
}) {
  "use server";
  const token = await getAuthToken();

  const remoteRunnable = new RemoteRunnable({
    url: `${API_URL}/${inputs.endpoint}`,
    options: { headers: { cookie: `__session=${token};` } },
  });

  // Note: The selected tool component and UI are stored in the outer scope, this allows for mutation to maximize performance
  const toolState: ToolState = {
    selectedToolComponent: null,
    selectedToolUI: null,
  };

  const handleChainStartEvent: EventHandler = (
    event: StreamEvent,
    fields: EventHandlerFields,
  ) => {
    fields.ui.append(<LoadingMessage />);
  };

  const handleToolStartEventt: EventHandler = (
    event: StreamEvent,
    fields: EventHandlerFields,
    toolState: ToolState,
  ) => {
    const toolCall = event.name;
    if (!toolState.selectedToolComponent && !toolState.selectedToolUI) {
      toolState.selectedToolComponent = TOOL_COMPONENT_MAP[toolCall];
      toolState.selectedToolUI = toolState.selectedToolComponent.loading();
      fields.ui.update(toolState.selectedToolUI);
    }
  };

  const handleToolsEndEvent: EventHandler = (
    event: StreamEvent,
    fields: EventHandlerFields,
    toolState: ToolState,
  ) => {
    if (!toolState.selectedToolUI || !toolState.selectedToolComponent) {
      console.warn("Missing tool state in handleToolsEndEvent");
      return;
    }

    const toolData = event.data.output;

    if (toolData.error && toolState.selectedToolComponent.error) {
      toolState.selectedToolUI =
        toolState.selectedToolComponent.error(toolData);
      fields.ui.update(toolState.selectedToolUI);
    } else {
      const component = toolState.selectedToolComponent.final(toolData);
      toolState.selectedToolUI = component;
      fields.ui.update(toolState.selectedToolUI);
    }
  };

  const handleChatModelStreamEvent: EventHandler = (
    event: StreamEvent,
    fields: EventHandlerFields,
  ) => {
    if (!fields.callbacks[event.run_id]) {
      const textStream = createStreamableValue();
      fields.ui.update(<AIMessage value={textStream.value} />);
      fields.callbacks[event.run_id] = textStream;
    }

    if (fields.callbacks[event.run_id]) {
      fields.callbacks[event.run_id].append(event.data.chunk.content);
    }
  };

  const dispatchEventHandlers: EventHandler = (
    event: StreamEvent,
    fields: EventHandlerFields,
  ) => {
    if (isChainStartEvent(event, inputs.endpoint)) {
      handleChainStartEvent(event, fields);
    }
    if (isToolStartEvent(event)) {
      handleToolStartEventt(event, fields, toolState);
    }
    if (IsToolsEndEvent(event)) {
      handleToolsEndEvent(event, fields, toolState);
    }
    if (isChatModelStreamEvent(event)) {
      handleChatModelStreamEvent(event, fields);
    }
  };

  return streamRunnableUI(
    remoteRunnable,
    {
      messages: [
        {
          type: "human",
          content: inputs.input,
        },
      ],
      thread_id: inputs.thread_id,
    },
    {
      dispatchEventHandlers,
    },
  );
}

export const EndpointsContext = exposeEndpoints({ agent });
