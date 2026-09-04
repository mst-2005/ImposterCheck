from pathlib import Path
import pandas as pd
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

ROOT = Path(__file__).resolve().parents[1]
csv_path = ROOT / "data/processed/features.csv"
out = ROOT / "models/fraud_xgboost.joblib"

df = pd.read_csv(csv_path)
if len(df) < 10 or df.label.nunique() < 2:
    raise SystemExit("Need at least 10 labelled samples and both real/fake classes.")

X = df.drop(columns=["label"])
y = df["label"]

Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# Use cost-sensitive learning to strictly eliminate false negatives
model = XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.03,
    scale_pos_weight=3.5,
    subsample=0.9,
    colsample_bytree=0.9,
    eval_metric="logloss",
    random_state=42
)
model.fit(Xtr, ytr)

y_pred = model.predict(Xte)
print("=== XGBoost Forensic Evaluation ===")
print(classification_report(yte, y_pred, target_names=["Real", "Fraud/Fake"]))
print("Confusion Matrix:")
print(confusion_matrix(yte, y_pred))

out.parent.mkdir(exist_ok=True)
joblib.dump(model, out)
print(f"Saved optimized fraud detector to {out}")
