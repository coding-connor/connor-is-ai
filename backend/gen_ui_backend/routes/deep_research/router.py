import os

from fastapi import APIRouter, Depends, HTTPException
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from psycopg import AsyncConnection

from gen_ui_backend.routes.deep_research.graph import builder
from gen_ui_backend.utils.auth import auth_dependency

from .state import ResearchInput

router = APIRouter()


@router.post("")
async def research(input: ResearchInput, token: str = Depends(auth_dependency)):
    try:
        # Set up database connection
        connection_kwargs = {
            "autocommit": True,
            "prepare_threshold": 0,
        }
        db_url = os.environ.get("DB_DIRECT_URL")

        async with await AsyncConnection.connect(db_url, **connection_kwargs) as conn:
            print("input.thread_id", input.thread_id)
            checkpointer = AsyncPostgresSaver(conn)
            graph = builder.compile(checkpointer)
            runnable = graph.with_types(input_type=ResearchInput)
            config = {
                "configurable": {"thread_id": input.thread_id},
            }

            result = await runnable.ainvoke({"topic": input.topic}, config)
            return result

    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
