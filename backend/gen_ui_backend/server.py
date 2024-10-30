import uvicorn
from gen_ui_backend.utils.auth import auth_dependency
from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langserve import add_routes
from gen_ui_backend.routes.chat_session.router import router as chat_session

from gen_ui_backend.chain import create_graph
from gen_ui_backend.types import ChatInputType

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Connor AI Assistant Backend",
    version="1.0",
    description="A simple api server using Langchain's Runnable interfaces",
    dependencies=[Depends(auth_dependency)],
)

# Configure CORS
origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = create_graph()

runnable = graph.with_types(input_type=ChatInputType, output_type=dict)

# Langchain Runnable Routes 
add_routes(app, runnable, path="/chat", playground_type="chat")

# Non-Langchain Routes
app.include_router(chat_session, prefix="/chat-session")

def start():
    uvicorn.run("gen_ui_backend.server:app", host="0.0.0.0", port=8000)
