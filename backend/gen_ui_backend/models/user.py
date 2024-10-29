import uuid
from gen_ui_backend.models.base import Base
from gen_ui_backend.models.chat_session import ChatSession
from sqlmodel import Field, Relationship
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from gen_ui_backend.models.chat_session import ChatSession


class User(Base, table=True):
    user_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    email: str = Field(default=None)

    # Establish a relationship back to ChatSession
    sessions: List["ChatSession"] = Relationship(back_populates="user")
