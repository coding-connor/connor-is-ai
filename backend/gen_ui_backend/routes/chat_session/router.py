# router.py

from fastapi import APIRouter, Depends, HTTPException
from gen_ui_backend.utils.auth import auth_dependency
from pydantic import BaseModel
from sqlalchemy.orm import Session
from gen_ui_backend.utils.database import get_session as get_db_session
from gen_ui_backend.routes.chat_session.service import (
    initial_chat_setup,
    new_session,
)

router = APIRouter()


@router.get("")
async def chat_session_endpoint(
    db: Session = Depends(get_db_session),
    user_email: str = Depends(auth_dependency),
):
    try:
        session = initial_chat_setup(db, user_email)
        return {"session_id": str(session.session_id)}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal Server Error")


class NewSessionRequest(BaseModel):
    session_id: str


@router.post("/new")
async def new_session_endpoint(
    body: NewSessionRequest,
    db: Session = Depends(get_db_session),
    user_email: str = Depends(auth_dependency),
):
    try:
        session = new_session(db, user_email, body.session_id)
        return {"session_id": str(session.session_id)}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Failed to end session")
