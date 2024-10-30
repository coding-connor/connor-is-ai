from typing import List, Union

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from pydantic import BaseModel


class ChatMessage(BaseModel):
    messages: List[Union[HumanMessage, AIMessage, SystemMessage]]

class ChatInput(ChatMessage):
    thread_id: str
