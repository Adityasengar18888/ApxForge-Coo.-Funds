from fastapi import APIRouter

router = APIRouter(prefix="/stats-lab", tags=["Statistics Lab"])

@router.get("/status")
def stats_lab_status():
    return {"status": "ready"}
