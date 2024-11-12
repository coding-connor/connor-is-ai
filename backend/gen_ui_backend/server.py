import os
from psycopg import Connection
import uvicorn
from gen_ui_backend.utils.auth import auth_dependency
from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langserve import add_routes
from gen_ui_backend.routes.chat_session.router import router as chat_session

from langchain_core.runnables import chain
from langchain.callbacks.base import BaseCallbackHandler

from gen_ui_backend.chain import create_graph
from gen_ui_backend.types import ChatInput, ChatMessage

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Connor AI Assistant Backend",
    version="1.0",
    description="A simple api server using Langchain's Runnable interfaces",
    dependencies=[Depends(auth_dependency)],
)

# TODO load from env
# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:3000",
    "https://connor-haines.vercel.app",
]

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


# Kind of annoying workaround. Langserve doesn't support Langgraph, as they want to you use Langraph Cloud. But that a lot of overhead to add another paid service, so this wrapper works for now.
# Specifically, in order to use a Langgraph checkpointer I need to get the thread_id from the request to pass it into the config for the graph.
@chain
def graph_wrapper(inputs):
    connection_kwargs = {
        "autocommit": True,
        "prepare_threshold": 0,
    }
    db_url = os.environ.get("DB_DIRECT_URL")
    # Note: keep an eye on usage and make this db connection more sophisticated with pooling if required
    with Connection.connect(db_url, **connection_kwargs) as conn:
        graph = create_graph(conn)
        runnable = graph.with_types(input_type=ChatMessage)
        # Create an instance of the handler
        config = {
            "configurable": {"thread_id": inputs["thread_id"]},
        }

        return runnable.invoke(inputs, config)


# Langserve Routes
add_routes(
    app,
    graph_wrapper.with_types(input_type=ChatInput),
    path="/chat",
    playground_type="chat",
)

# Non-Language Routes
app.include_router(chat_session, prefix="/chat-session")


def start(reload=True):
    uvicorn.run("gen_ui_backend.server:app", host="0.0.0.0", port=8000, reload=reload)


if __name__ == "__main__":
    start(reload=False)
