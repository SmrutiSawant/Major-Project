import numpy as np
import pandas as pd

np.random.seed(42)
N = 12000

soil_map = {"clay": 0, "loam": 1, "sandy": 2}
crop_map = {
    "rice": 0,
    "wheat": 1,
    "maize": 2,
    "sugarcane": 3,
    "cotton": 4,
    "vegetables": 5
}
slope_map = {"flat": 0, "gentle": 1, "steep": 2}

# Crop → allowed soil types
crop_soil_constraints = {
    0: [0, 1],  # rice → clay, loam
    1: [1, 2],  # wheat → loam, sandy
    2: [1, 2],  # maize → loam, sandy
    3: [0, 1],  # sugarcane → clay, loam
    4: [1, 2],  # cotton → loam, sandy
    5: [1, 2],  # vegetables → loam, sandy
}

data = []

for _ in range(N):
    # Rainfall & weather
    r7 = np.random.gamma(2, 25)
    r3 = r7 * np.random.uniform(0.3, 0.7)
    r1 = r3 * np.random.uniform(0.2, 0.5)
    humidity = np.random.uniform(40, 95)

    # Crop first
    crop = np.random.choice(list(crop_map.values()))

    # Soil constrained by crop
    soil = np.random.choice(crop_soil_constraints[crop])

    # Other features
    slope = np.random.choice(list(slope_map.values()))
    days = np.random.randint(5, 120)

    # Risk score
    score = (
        0.04 * r7 +
        0.02 * r3 +
        0.01 * humidity +
        (soil == 0) * 15 +
        (slope == 0) * 10 -
        crop * 2
    )

    # Label assignment
    if score < 30:
        label = 0
    elif score < 45:
        label = 1
    elif score < 65:
        label = 2
    elif score < 85:
        label = 3
    else:
        label = 4

    data.append([
        r1, r3, r7, humidity,
        soil, slope, crop, days, label
    ])

df = pd.DataFrame(data, columns=[
    "rainfall_1d", "rainfall_3d", "rainfall_7d", "humidity",
    "soil_type", "slope", "crop_type", "days_since_sowing",
    "waterlogging_risk"
])

df.to_csv("india_waterlogging_training_data.csv", index=False)
print("Dataset created with crop–soil constraints")
