from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(title="India Waterlogging Predictor")
model = joblib.load("waterlogging_xgb_model.pkl")

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
    X = np.array([[
        data.rainfall_1d, data.rainfall_3d, data.rainfall_7d,
        data.humidity, data.soil_type, data.slope,
        data.crop_type, data.days_since_sowing
    ]])

    probs = model.predict_proba(X)[0]
    idx = int(np.argmax(probs))

    return {
        "risk_level": idx,
        "risk_label": labels[idx],
        "probabilities": dict(zip(labels, map(float, probs))),
        "confidence": float(max(probs))
    }
