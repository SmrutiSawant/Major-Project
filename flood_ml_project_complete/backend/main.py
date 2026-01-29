from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(title="India Waterlogging Predictor")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React
    allow_methods=["*"],
    allow_headers=["*"],
)


model = joblib.load("waterlogging_xgb_model.pkl")

@app.get("/")
def root():
    return {"message": "India Waterlogging Predictor API is running"}

class FloodInput(BaseModel):
    rainfall_1d: float
    rainfall_3d: float
    rainfall_7d: float
    humidity: float
    soil_type: int
    slope: int
    crop_type: int
    days_since_sowing: int

labels = ["NO_RISK","LOW","MODERATE","HIGH","SEVERE"]

@app.post("/predict")
def predict(data: FloodInput):

    # 🔴 SANITY CHECK: No rain → no flood
    if data.rainfall_7d < 1.0:
        return {
            "risk_level": 0,
            "risk_label": "NO_RISK",
            "probabilities": {
                "NO_RISK": 1.0,
                "LOW": 0.0,
                "MODERATE": 0.0,
                "HIGH": 0.0,
                "SEVERE": 0.0
            },
            "confidence": 1.0,
            "note": "Rainfall too low for flooding"
        }

    
    X = np.array([[
        data.rainfall_1d,
        data.rainfall_3d,
        data.rainfall_7d,
        data.humidity,
        data.soil_type,
        data.slope,
        data.crop_type,
        data.days_since_sowing
    ]])

    probs = model.predict_proba(X)[0]
    idx = int(np.argmax(probs))

    return {
        "risk_level": idx,
        "risk_label": labels[idx],
        "probabilities": dict(zip(labels, map(float, probs))),
        "confidence": float(max(probs))
    }

