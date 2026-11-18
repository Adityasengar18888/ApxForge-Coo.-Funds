from fastapi import APIRouter

router = APIRouter(prefix="/news", tags=["News & Sentiment"])

@router.get("/")
def get_news():
    return {"articles": []}
