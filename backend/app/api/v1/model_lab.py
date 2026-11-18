from fastapi import APIRouter

router = APIRouter(prefix="/model-lab", tags=["Model Lab"])

@router.get("/status")
def model_lab_status():
    return {"status": "ready"}
