# SIH26188 – The Imposter Check

A modular document/identity verification prototype.

## Pipeline
Upload image -> quality checks -> OCR -> reference matching -> visual model -> semantic model -> XGBoost risk score -> decision.

## Quick start (Windows)
```powershell
cd backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-ml.txt
cd ..
python -m uvicorn backend.app.main:app --reload
```

Open http://127.0.0.1:8000

## Real ML training
1. Put a legally usable labelled dataset under `data/raw/`.
2. Adjust the dataset paths in `training/train_efficientnet.py`.
3. Run:
```powershell
python training/train_efficientnet.py
```
4. Generate fraud features and train XGBoost:
```powershell
python ml/generate_features.py
python ml/train_xgboost.py
```
5. Verify:
```powershell
python ml/verify_models.py
```

The application works without trained weights by using deterministic fallbacks. Do not present fallback/demo models as real benchmarked production models.
