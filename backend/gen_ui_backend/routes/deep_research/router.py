from fastapi import APIRouter
from langserve import add_routes

from gen_ui_backend.routes.deep_research.graph import graph_wrapper
from gen_ui_backend.types import ChatInput

router = APIRouter()

# Langserve Routes
add_routes(
    router,
    graph_wrapper.with_types(input_type=ChatInput),
    path="",
    playground_type="chat",
)
