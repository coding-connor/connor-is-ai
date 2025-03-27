from fastapi import APIRouter, Depends, HTTPException

from gen_ui_backend.routes.deep_research.graph import graph_wrapper
from gen_ui_backend.utils.auth import auth_dependency

from .state import ResearchInput

router = APIRouter()


@router.post("")
async def research(input: ResearchInput, token: str = Depends(auth_dependency)):
    try:
        # Run the research graph synchronously
        print(input)
        result = await graph_wrapper.ainvoke(input)
        print("result")
        print(result)
        return result
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
