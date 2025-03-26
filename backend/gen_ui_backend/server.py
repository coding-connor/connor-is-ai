import os
import uvicorn
from gen_ui_backend.utils.auth import auth_dependency
from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from gen_ui_backend.routes.chat_session.router import router as chat_session
from gen_ui_backend.routes.chat.router import router as chat

from langchain.callbacks.base import BaseCallbackHandler

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Connor AI Assistant Backend",
    version="1.0",
    description="A simple api server using Langchain's Runnable interfaces",
    dependencies=[Depends(auth_dependency)],
)

allowed_origins = os.environ.get("ALLOWED_ORIGINS", "")
origins = allowed_origins.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class VerboseDebugCallback(BaseCallbackHandler):
    """Catches and logs all callback events."""

    def __getattribute__(self, name: str):
        attr = super().__getattribute__(name)

        if name.startswith("on_") and callable(attr):

            def wrapper(*args, **kwargs):
                print(f"\n{'='*20} {name} {'='*20}")
                if args:
                    print(f"Args: {args}")
                if kwargs:
                    print(f"Kwargs: {kwargs}")
                print("=" * 50 + "\n")
                return attr(*args, **kwargs)

            return wrapper

        return attr


# Routes
app.include_router(chat, prefix="/chat")
app.include_router(chat_session, prefix="/chat-session")


def start(reload=True):
    uvicorn.run("gen_ui_backend.server:app", host="0.0.0.0", port=8000, reload=reload)


if __name__ == "__main__":
    start(reload=False)
