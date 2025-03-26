from fastapi import APIRouter
from langserve import add_routes
from gen_ui_backend.types import ChatInput
from gen_ui_backend.routes.chat.chain import graph_wrapper

router = APIRouter()

# Langserve Routes
add_routes(
    router,
    graph_wrapper.with_types(input_type=ChatInput),
    path="",
    playground_type="chat",
)
