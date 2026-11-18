from fastapi import APIRouter

router = APIRouter(prefix="/screener", tags=["Screener"])

@router.get("/")
def screen_assets():
    return {"results": []}
