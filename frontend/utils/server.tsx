import "server-only";
import { AIProvider } from "./client";
import { ReactNode } from "react";
import { Runnable } from "@langchain/core/runnables";
import { CompiledStateGraph } from "@langchain/langgraph";
import { createStreamableUI, createStreamableValue } from "ai/rsc";
import { StreamEvent } from "@langchain/core/tracers/log_stream";

export const LAMBDA_STREAM_WRAPPER_NAME = "lambda_stream_wrapper";

export type RunUICallbacks = Record<
  string,
  ReturnType<typeof createStreamableUI | typeof createStreamableValue>
>;
export type EventHandlerFields = {
  ui: ReturnType<typeof createStreamableUI>;
  callbacks: RunUICallbacks;
};
export type DispatchEventHandlers =
  | ((event: StreamEvent, fields: EventHandlerFields) => void)
  | ((event: StreamEvent, fields: EventHandlerFields) => Promise<void>);

/**
 * Executes `streamEvents` method on a runnable
 * and converts the generator to a RSC friendly stream
 *
 * @param runnable
 * @returns React node which can be sent to the client
 */
export function streamRunnableUI<RunInput, RunOutput>(
  runnable:
    | Runnable<RunInput, RunOutput>
    | CompiledStateGraph<RunInput, Partial<RunInput>>,
  inputs: RunInput,
  options: {
    dispatchEventHandlers: DispatchEventHandlers;
  },
) {
  // Note: We will mutate this object in the future
  const ui = createStreamableUI();
  const [lastEvent, resolve, reject] = withResolvers<
    Array<any> | Record<string, any>
  >();
  (async () => {
    let lastEventValue: StreamEvent | null = null;
    const callbacks: RunUICallbacks = {};

    try {
      for await (const streamEvent of (
        runnable as Runnable<RunInput, RunOutput>
      ).streamEvents(
        inputs,
        { version: "v2" },
        {
          // May as well exclude unneeded events from streaming.
          // Note: The EventHandlers determine which events we care about.
          excludeNames: [
            "ChannelWrite<invoke_model,input,result,tool_calls,tool_result>",
            "ChannelWrite<invoke_tools,input,result,tool_calls,tool_result>",
            "ChannelWrite<invoke_tools,input,result,tool_calls,tool_result>",
            "ChannelWrite<invoke_tools,messages>",
            "ChannelWrite<invoke_model,messages>",
            "invoke_tools_or_return",
            "RunnableSequence",
            "LangGraph",
            "__start__",
            "ChatPromptTemplate",
            "JsonOutputToolsParser",
            "",
          ],
        },
      )) {
        const fields: EventHandlerFields = { ui, callbacks };
        await options.dispatchEventHandlers(streamEvent, fields);
        lastEventValue = streamEvent;
      }

      let lastEventOutput =
        lastEventValue?.data.output || lastEventValue?.data.chunk?.data?.output;
      const resolveValue = JSON.parse(JSON.stringify(lastEventOutput));
      // Sets the value of lastEvent
      resolve(resolveValue);
    } catch (error) {
      console.error("Error during streaming:", error);
    } finally {
      // This ensures the createStreamableValue stream finishes.
      Object.values(callbacks).forEach((cb) => cb.done());
      ui.done();
    }
  })();

  return { ui: ui.value, lastEvent };
}

/**
 * Polyfill to emulate the upcoming Promise.withResolvers
 */
export function withResolvers<T>() {
  let resolve: (value: T) => void;
  let reject: (reason?: any) => void;

  const innerPromise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  // @ts-expect-error
  return [innerPromise, resolve, reject] as const;
}

/**
 * Expose these endpoints outside for the client
 * We wrap the functions in order to properly resolve importing
 * client components.
 *
 * TODO: replace with createAI instead, even though that
 * implicitly handles state management
 *
 * See https://github.com/vercel/next.js/pull/59615
 * @param actions
 */
export function exposeEndpoints<T extends Record<string, unknown>>(
  actions: T,
): {
  (props: { children: ReactNode }): Promise<JSX.Element>;
  $$types?: T;
} {
  return async function AI(props: { children: ReactNode }) {
    return <AIProvider actions={actions}>{props.children}</AIProvider>;
  };
}
