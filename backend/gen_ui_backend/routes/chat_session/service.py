# services/chat_service.py

from sqlalchemy.orm import Session
from gen_ui_backend.models import User, ChatSession

def get_or_create_chat_session(db: Session, user_email: str) -> ChatSession:
    # Check if user exists
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        # Create new user
        user = User(email=user_email)
        db.add(user)
        db.commit()
        db.refresh(user)
    # Check for active chat session
    chat_session = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user.user_id, ChatSession.ended_at.is_(None))
        .first()
    )
    if not chat_session:
        # Create new chat session
        chat_session = ChatSession(user_id=user.user_id)
        db.add(chat_session)
        db.commit()
        db.refresh(chat_session)
    return chat_session