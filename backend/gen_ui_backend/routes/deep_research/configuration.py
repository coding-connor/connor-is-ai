import os
from dataclasses import dataclass, fields
from enum import Enum
from typing import Any, Dict, Optional

from langchain_core.runnables import RunnableConfig

DEFAULT_REPORT_STRUCTURE = """Use this structure to create a report on the user-provided topic:

1. Introduction (no research needed)
   - Brief overview of the topic area

2. Main Body Sections:
   - Each section should focus on a sub-topic of the user-provided topic
   
3. Conclusion
   - Aim for 1 structural element (either a list of table) that distills the main body sections 
   - Provide a concise summary of the report"""


class SearchAPI(Enum):
    TAVILY = "tavily"


@dataclass(kw_only=True)
class Configuration:
    """The configurable fields for the chatbot."""

    report_structure: str = (
        DEFAULT_REPORT_STRUCTURE  # Defaults to the default report structure
    )
    number_of_queries: int = 1  # Number of search queries to generate per iteration
    max_search_depth: int = 2  # Maximum number of reflection + search iterations
    planner_provider: str = "openai"  # Defaults to OpenAI as provider
    planner_model: str = "o3-mini"  # Defaults to o3-mini for planning
    writer_provider: str = "openai"  # Defaults to OpenAI as provider
    writer_model: str = "gpt-4o"  # Defaults to 4o for writing
    search_api: SearchAPI = SearchAPI.TAVILY  # Default to TAVILY
    search_api_config: Optional[Dict[str, Any]] = None

    @classmethod
    def from_runnable_config(
        cls, config: Optional[RunnableConfig] = None
    ) -> "Configuration":
        """Create a Configuration instance from a RunnableConfig."""
        configurable = (
            config["configurable"] if config and "configurable" in config else {}
        )
        values: dict[str, Any] = {
            f.name: os.environ.get(f.name.upper(), configurable.get(f.name))
            for f in fields(cls)
            if f.init
        }
        return cls(**{k: v for k, v in values.items() if v})
