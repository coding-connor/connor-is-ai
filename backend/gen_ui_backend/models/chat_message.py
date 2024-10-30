import uuid
from gen_ui_backend.models.base import Base
from sqlmodel import Field, Relationship
from typing import TYPE_CHECKING, Optional
from datetime import datetime, timezone

if TYPE_CHECKING:
    from gen_ui_backend.models.chat_session import ChatSession


class ChatMessage(Base, table=True):
    message_id: uuid.UUID = Field(
        default_factory=uuid.uuid4, primary_key=True, index=True
    )
    session_id: uuid.UUID = Field(
        foreign_key="chatsession.session_id", index=True
    )  # Foreign key to ChatSession
    sender: str = Field(
        index=True
    )  # Could be restricted to values "user" or "bot" with validation
    model: Optional[str]
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationship back to ChatSession
    session: "ChatSession" = Relationship(back_populates="messages")
