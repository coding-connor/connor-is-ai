import uuid
from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime


class User(SQLModel, table=True):
    user_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True)
    email: str = Field(default=None)

    # Establish a relationship back to ChatSession
    sessions: List["ChatSession"] = Relationship(back_populates="user")


class ChatSession(SQLModel, table=True):
    session_id: uuid.UUID = Field(
        default_factory=uuid.uuid4, primary_key=True, index=True
    )
    user_id: uuid.UUID = Field(
        foreign_key="user.user_id", index=True
    )  # Foreign key to User
    started_at: datetime = Field(
        default_factory=lambda: datetime.now(datetime.timezone.utc)
    )
    ended_at: Optional[datetime] = None

    # Relationship back to User and to ChatMessage
    user: "User" = Relationship(back_populates="sessions")
    messages: List["ChatMessage"] = Relationship(back_populates="session")


class ChatMessage(SQLModel, table=True):
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
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(datetime.timezone.utc)
    )

    # Relationship back to ChatSession
    session: "ChatSession" = Relationship(back_populates="messages")
