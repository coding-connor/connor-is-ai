import uuid
from gen_ui_backend.models.base import Base
from sqlmodel import Field, Relationship
from typing import TYPE_CHECKING, List, Optional
from datetime import datetime, timezone

if TYPE_CHECKING:
    from gen_ui_backend.models.chat_message import ChatMessage
    from gen_ui_backend.models.user import User


class ChatSession(Base, table=True):
    session_id: uuid.UUID = Field(
        default_factory=uuid.uuid4, primary_key=True, index=True
    )
    user_id: uuid.UUID = Field(
        foreign_key="user.user_id", index=True
    )  # Foreign key to User
    started_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    ended_at: Optional[datetime] = None

    # Relationship back to User and to ChatMessage
    user: "User" = Relationship(back_populates="sessions")
    messages: List["ChatMessage"] = Relationship(back_populates="session")
