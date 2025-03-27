import operator
from typing import Annotated, List, Literal, TypedDict

from pydantic import BaseModel, Field
from typing_extensions import TypedDict


class Section(BaseModel):
    name: str = Field(
        description="Name for this section of the report.",
    )
    description: str = Field(
        description="Brief overview of the main topics and concepts to be covered in this section.",
    )
    research: bool = Field(
        description="Whether to perform web research for this section of the report."
    )
    content: str = Field(description="The content of the section.")


class Sections(BaseModel):
    sections: List[Section] = Field(
        description="Sections of the report.",
    )


class SearchQuery(BaseModel):
    search_query: str = Field(
        description="The search query to use for web research.",
    )


class Queries(BaseModel):
    queries: List[SearchQuery] = Field(
        description="List of search queries.",
    )


class Feedback(BaseModel):
    grade: Literal["pass", "fail"] = Field(
        description="Evaluation result indicating whether the response meets requirements ('pass') or needs revision ('fail')."
    )
    follow_up_queries: List[SearchQuery] = Field(
        description="List of follow-up search queries.",
    )


class ReportStateInput(TypedDict):
    topic: str  # Report topic


class ResearchInput(BaseModel):
    topic: str
    thread_id: str


class ReportStateOutput(TypedDict):
    final_report: str  # Final report


class ReportState(TypedDict):
    topic: str  # Report topic
    feedback_on_report_plan: str  # Feedback on the report plan
    sections: list[Section]  # List of report sections
    completed_sections: Annotated[list, operator.add]  # Send() API key
    report_sections_from_research: (
        str  # String of any completed sections from research to write final sections
    )
    final_report: str  # Final report


class SectionState(TypedDict):
    topic: str  # Report topic
    section: Section  # Report section
    search_iterations: int  # Number of search iterations done
    search_queries: list[SearchQuery]  # List of search queries
    source_str: str  # String of formatted source content from web search
    report_sections_from_research: (
        str  # String of any completed sections from research to write final sections
    )
    completed_sections: list[
        Section
    ]  # Final key we duplicate in outer state for Send() API


class SectionOutputState(TypedDict):
    completed_sections: list[
        Section
    ]  # Final key we duplicate in outer state for Send() API
