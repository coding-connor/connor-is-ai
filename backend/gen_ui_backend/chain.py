from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph, MessagesState
from langgraph.graph.graph import CompiledGraph
from langgraph.checkpoint.postgres import PostgresSaver


import os

from gen_ui_backend.tools.calendly import calendly
from gen_ui_backend.tools.github import github_repo
from gen_ui_backend.tools.weather import weather_data
from functools import lru_cache


# This is critical for frontend deserialization
def ensure_array(result):
    """Wrap non-array results in an array."""
    return [result] if not isinstance(result, list) else result


# TODO Replace with LangChain Loader
@lru_cache(maxsize=1)
def read_markdown_files(directory):
    content = ""
    files_to_read = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".md") or file.endswith(".txt"):
                files_to_read.append(os.path.join(root, file))

    for file_path in sorted(files_to_read):
        with open(file_path, "r") as f:
            file_content = f.read()
            if file_path.endswith(".txt"):
                # Escape curly braces
                file_content = file_content.replace("{", "{{").replace("}", "}}")
            content += file_content + "\n\n"

    # print(content)
    return content


# class MessagesState(TypedDict, total=False):
#     input: HumanMessage
#     result: Optional[str]
#     """Plain text response if no tool was used."""
#     tool_calls: Optional[List[dict]]
#     """A list of parsed tool calls."""
#     tool_result: Optional[dict]
#     """The result of a tool call."""


def invoke_model(state: MessagesState, config: RunnableConfig) -> MessagesState:
    system_prompt = read_markdown_files("gen_ui_backend/system_prompt")

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
