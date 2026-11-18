from fastapi import APIRouter

router = APIRouter(prefix="/predict", tags=["Predictions"])

@router.get("/")
def get_predictions():
    return {"predictions": []}

