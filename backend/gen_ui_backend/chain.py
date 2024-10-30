from typing import List, Optional, TypedDict

from langchain.output_parsers.openai_tools import JsonOutputToolsParser
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.graph.graph import CompiledGraph
from langgraph.checkpoint.memory import MemorySaver
from psycopg import Connection
from langgraph.checkpoint.postgres import PostgresSaver



import os

from gen_ui_backend.tools.calendly import calendly
from gen_ui_backend.tools.github import github_repo
from gen_ui_backend.tools.weather import weather_data
from functools import lru_cache


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
        print("adding file", file_path)
        with open(file_path, "r") as f:
            file_content = f.read()
            if file_path.endswith(".txt"):
                # Escape curly braces
                file_content = file_content.replace("{", "{{").replace("}", "}}")
            content += file_content + "\n\n"

    # print(content)
    return content


class GenerativeUIState(TypedDict, total=False):
    input: HumanMessage
    result: Optional[str]
    """Plain text response if no tool was used."""
    tool_calls: Optional[List[dict]]
    """A list of parsed tool calls."""
    tool_result: Optional[dict]
    """The result of a tool call."""

def invoke_model(state: GenerativeUIState, config: RunnableConfig) -> GenerativeUIState:
    # Access the user information from the config
    print(state)

    tools_parser = JsonOutputToolsParser()

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
    model = ChatOpenAI(model="gpt-4o-mini", temperature=0.5, streaming=True)
    tools = [github_repo, weather_data, calendly]
    model_with_tools = model.bind_tools(tools)
    chain = initial_prompt | model_with_tools
    result = chain.invoke({"input": state["input"]}, config)

    if not isinstance(result, AIMessage):
        raise ValueError("Invalid result from model. Expected AIMessage.")

    if isinstance(result.tool_calls, list) and len(result.tool_calls) > 0:
        parsed_tools = tools_parser.invoke(result, config)
        return {
            "tool_calls": parsed_tools,
            "result": str(result.content) if result.content else ""
        }
    else:
        return {"result": str(result.content)}


def invoke_tools_or_return(state: GenerativeUIState) -> str:
    if "tool_calls" in state and isinstance(state["tool_calls"], list):
        return "invoke_tools"
    elif "result" in state and isinstance(state["result"], str):
        return END
    else:
        raise ValueError("Invalid state. No result or tool calls found.")


def invoke_tools(state: GenerativeUIState) -> GenerativeUIState:
    tools_map = {
        "github-repo": github_repo,
        "weather-data": weather_data,
        "calendly": calendly,
    }

    if state["tool_calls"] is not None:
        tool = state["tool_calls"][0]
        selected_tool = tools_map[tool["type"]]
        return {"tool_result": selected_tool.invoke(tool["args"])}
    else:
        raise ValueError("No tool calls found in state.")


def create_graph(conn) -> CompiledGraph:
    workflow = StateGraph(GenerativeUIState)

    workflow.add_node("invoke_model", invoke_model)  # type: ignore
    workflow.add_node("invoke_tools", invoke_tools)
    workflow.add_conditional_edges("invoke_model", invoke_tools_or_return)
    workflow.set_entry_point("invoke_model")
    workflow.set_finish_point("invoke_tools")

    
    checkpointer = PostgresSaver(conn)
    graph = workflow.compile(checkpointer)
    return graph
