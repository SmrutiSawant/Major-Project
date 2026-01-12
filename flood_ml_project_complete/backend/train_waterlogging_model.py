import pandas as pd
import xgboost as xgb
import joblib
from sklearn.model_selection import train_test_split

# Load dataset
df = pd.read_csv("india_waterlogging_training_data.csv")

X = df.drop("waterlogging_risk", axis=1)
y = df["waterlogging_risk"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    stratify=y,
    random_state=42
)

# Train model
model = xgb.XGBClassifier(
    objective="multi:softprob",
    num_class=5,
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric="mlogloss"
)

model.fit(X_train, y_train)

# Simple safe logging (NO sklearn metrics)
print("Training completed successfully")
print("Test set size:", len(X_test))
print("Class distribution:")
print(y_test.value_counts().sort_index())

# Save model
joblib.dump(model, "waterlogging_xgb_model.pkl")
print("Model saved as waterlogging_xgb_model.pkl")
