"""
SmartBus AI service (prototype).

Exposes /predict/eta, /predict/crowd, /predict/catchability and
/recommend/bus, matching the architecture in the project spec:

    Frontend -> Backend (Node/Express) -> AI Service (this file)

IMPORTANT: this prototype does NOT ship a trained ML model, because there
is no historical trip/occupancy data to train one on yet. Every endpoint
here uses a transparent, documented rule instead, and every response is
labelled with "modelType": "rule_based" so callers never mistake this for
a validated prediction. Once real historical data exists, replace the
function bodies in models/eta_model.py and models/crowd_model.py with a
trained scikit-learn model (RandomForestRegressor / GradientBoosting are
good starting points per the spec) - the API contracts below should not
need to change.

Run with:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8001
"""

from fastapi import FastAPI
from pydantic import BaseModel

from models.eta_model import predict_eta_minutes
from models.crowd_model import predict_crowd_percent

app = FastAPI(title="SmartBus AI Service", version="0.1.0")


class EtaRequest(BaseModel):
    distanceRemainingKm: float
    avgSpeedKmph: float = 32.0
    timeOfDayHour: int | None = None
    dayOfWeek: int | None = None  # 0=Mon..6=Sun


class EtaResponse(BaseModel):
    etaMinutes: int
    modelType: str


class CrowdRequest(BaseModel):
    currentOccupancyPercent: float
    stopsRemaining: int
    avgBoardingPerStop: float = 6.0
    avgAlightingPerStop: float = 4.0


class CrowdResponse(BaseModel):
    predictedOccupancyPercent: float
    crowdLevel: str
    modelType: str


class CatchabilityRequest(BaseModel):
    etaToBoardingMinutes: float
    status: str  # AT_STOP | APPROACHING | COMING | PASSED | COMPLETED


class CatchabilityResponse(BaseModel):
    catchability: float  # 0..1
    verdict: str
    modelType: str


class BusCandidate(BaseModel):
    busId: str
    etaMinutes: float
    occupancyPercent: float
    isDirect: bool = True


class RecommendRequest(BaseModel):
    candidates: list[BusCandidate]
    preference: str = "fastest"  # fastest | least_crowded | direct | lowest_wait


class RecommendResponse(BaseModel):
    busId: str
    recommendationScore: float
    reason: str
    modelType: str


@app.get("/health")
def health():
    return {"ok": True, "service": "smartbus-ai"}


@app.post("/predict/eta", response_model=EtaResponse)
def predict_eta(req: EtaRequest):
    minutes = predict_eta_minutes(req.distanceRemainingKm, req.avgSpeedKmph)
    return {"etaMinutes": minutes, "modelType": "rule_based"}


@app.post("/predict/crowd", response_model=CrowdResponse)
def predict_crowd(req: CrowdRequest):
    percent, level = predict_crowd_percent(
        req.currentOccupancyPercent,
        req.stopsRemaining,
        req.avgBoardingPerStop,
        req.avgAlightingPerStop,
    )
    return {"predictedOccupancyPercent": percent, "crowdLevel": level, "modelType": "rule_based"}


@app.post("/predict/catchability", response_model=CatchabilityResponse)
def predict_catchability(req: CatchabilityRequest):
    if req.status in ("PASSED", "COMPLETED"):
        return {"catchability": 0.02, "verdict": "LIKELY MISSED", "modelType": "rule_based"}
    if req.status == "AT_STOP" or req.etaToBoardingMinutes <= 10:
        score = max(0.7, 1 - req.etaToBoardingMinutes / 30)
        return {"catchability": round(score, 2), "verdict": "HIGH CHANCE OF CATCHING", "modelType": "rule_based"}
    if req.etaToBoardingMinutes <= 20:
        return {"catchability": 0.5, "verdict": "MAY CATCH", "modelType": "rule_based"}
    return {"catchability": 0.15, "verdict": "LIKELY MISSED", "modelType": "rule_based"}


@app.post("/recommend/bus", response_model=RecommendResponse)
def recommend_bus(req: RecommendRequest):
    if not req.candidates:
        return {"busId": "", "recommendationScore": 0.0, "reason": "No candidates.", "modelType": "rule_based"}

    def score(c: BusCandidate) -> float:
        if req.preference == "least_crowded":
            return c.occupancyPercent * 2 + c.etaMinutes * 0.5
        return c.etaMinutes * 2 + c.occupancyPercent * 0.3

    ranked = sorted(req.candidates, key=score)
    best = ranked[0]
    reason = f"Closest available bus with low expected waiting time ({best.etaMinutes:.0f} min)."
    if req.preference == "least_crowded" and len(ranked) > 1:
        reason = f"Arrives a little later but has a lower predicted crowd ({best.occupancyPercent:.0f}%)."

    # normalize score into a 0..1 "recommendationScore" for the response shape
    max_score = max(score(c) for c in req.candidates) or 1
    normalized = 1 - (score(best) / max_score)
    return {
        "busId": best.busId,
        "recommendationScore": round(max(0.0, min(1.0, normalized)), 2),
        "reason": reason,
        "modelType": "rule_based",
    }
