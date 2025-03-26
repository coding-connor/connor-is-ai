from gen_ui_backend.types import ChatMessage
from gen_ui_backend.utils.storage_service import FileReaderService
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph, MessagesState
from langgraph.graph.graph import CompiledGraph
from langgraph.checkpoint.postgres import PostgresSaver
from langchain_core.runnables import chain
from psycopg import Connection
import os

from gen_ui_backend.tools.calendly import calendly
from gen_ui_backend.tools.github import github_repo
from gen_ui_backend.tools.weather import weather_data
from functools import lru_cache

BASE_DIR = os.environ.get("BASE_DIR", "system_prompts")
PROMPT_FILE_NAME = "aggregated_system_prompt.txt"


# TODO make this a Pydantic class or something more elegant
# This is critical for frontend deserialization. It gets pretty low-level into the langchain implementation to find out why, but the tl;dr is that the message returned populates the event streamed to the frontend, and the frontend deserialization expects that the message property of this event is an array.
def ensure_array(result):
    """Wrap non-array results in an array."""
    return [result] if not isinstance(result, list) else result


# TODO Replace with LangChain Loader
@lru_cache(maxsize=1)
def read_prompt(file_name: str) -> str:
    file_reader = FileReaderService(BASE_DIR)
    return file_reader.read_file(file_name)


def invoke_model(state: MessagesState, config: RunnableConfig) -> MessagesState:
    system_prompt = read_prompt(PROMPT_FILE_NAME)

    initial_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                system_prompt,
            ),
            MessagesPlaceholder("input"),
        ]
    )
    model = ChatOpenAI(model="gpt-4o-mini", temperature=0, streaming=True)
    tools = [github_repo, weather_data, calendly]
    model_with_tools = model.bind_tools(tools)
    chain = initial_prompt | model_with_tools
    result = chain.invoke({"input": state["messages"]}, config)

    if not isinstance(result, AIMessage):
        raise ValueError("Invalid result from model. Expected AIMessage.")

    return {"messages": ensure_array(result)}


def invoke_tools_or_return(state: MessagesState) -> str:
    last_message = state["messages"][-1]
    if (
        hasattr(last_message, "tool_calls")
        and isinstance(last_message.tool_calls, list)
        and len(last_message.tool_calls) > 0
    ):
        return "invoke_tools"
    elif hasattr(last_message, "content") and isinstance(last_message.content, str):
        return END
    else:
        raise ValueError("Invalid state. No message content or tool calls found.")


def invoke_tools(state: MessagesState) -> MessagesState:
    tools_map = {
        "github-repo": github_repo,
        "weather-data": weather_data,
        "calendly": calendly,
    }

    last_message = state["messages"][-1]

    try:
        if last_message.tool_calls is not None:
            tool = last_message.tool_calls[0]
            selected_tool = tools_map[tool["name"]]
            tool_result = selected_tool.invoke(tool["args"])
            tool_result["type"] = "text"
            tool_result = ToolMessage(content=[tool_result], tool_call_id=tool["id"])
            print(tool_result)
            return {"messages": ensure_array(tool_result)}
        else:
            raise ValueError("No tool calls found in state.")
    except Exception as e:
        # TODO replace with logger
        print(e)
        return {
            "messages": ensure_array(
                ToolMessage(
                    content={
                        "error": "An error occurred while processing the tool call."
                    },
                    tool_call_id=tool["id"],
                )
            )
        }


def create_graph(conn) -> CompiledGraph:
    workflow = StateGraph(MessagesState)

    workflow.add_node("invoke_model", invoke_model)  # type: ignore
    workflow.add_node("invoke_tools", invoke_tools)
    workflow.add_conditional_edges("invoke_model", invoke_tools_or_return)
    workflow.set_entry_point("invoke_model")
    workflow.set_finish_point("invoke_tools")

    checkpointer = PostgresSaver(conn)
    graph = workflow.compile(checkpointer)
    return graph


# Kind of annoying workaround. Langserve doesn't support Langgraph, as they want to you use Langraph Cloud. But that a lot of overhead to add another paid service, so this wrapper works for now.
# Specifically, in order to use a Langgraph checkpointer I need to get the thread_id from the request to pass it into the config for the graph.
@chain
def graph_wrapper(inputs):
    connection_kwargs = {
        "autocommit": True,
        "prepare_threshold": 0,
    }
    db_url = os.environ.get("DB_DIRECT_URL")
    # Note: keep an eye on usage and make this db connection more sophisticated with pooling if required
    with Connection.connect(db_url, **connection_kwargs) as conn:
        graph = create_graph(conn)
        runnable = graph.with_types(input_type=ChatMessage)
        # Create an instance of the handler
        config = {
            "configurable": {"thread_id": inputs["thread_id"]},
        }

        return runnable.invoke(inputs, config)
