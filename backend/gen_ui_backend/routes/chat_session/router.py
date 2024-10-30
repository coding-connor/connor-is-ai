# router.py

from fastapi import APIRouter, Depends, HTTPException
from gen_ui_backend.utils.auth import auth_dependency
from sqlalchemy.orm import Session
from gen_ui_backend.utils.database import get_session as get_db_session
from gen_ui_backend.routes.chat_session.service import get_or_create_chat_session

router = APIRouter()


@router.get("/")
async def chat_session_endpoint(
    db: Session = Depends(get_db_session),
    user_email: str = Depends(auth_dependency),
):
    try:
        session = get_or_create_chat_session(db, user_email)
        return {"session_id": str(session.session_id)}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal Server Error")
