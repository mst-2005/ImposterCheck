from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
for p in [ROOT/"models/efficientnetb0_document.keras",
          ROOT/"models/fraud_xgboost.joblib"]:
    print(("FOUND " if p.exists() else "MISSING "), p)
try:
    import paddleocr; print("PaddleOCR: OK")
except Exception as e: print("PaddleOCR: NOT AVAILABLE -", e)
try:
    import sentence_transformers; print("Sentence-BERT package: OK")
except Exception as e: print("Sentence-BERT: NOT AVAILABLE -", e)
try:
    import tensorflow; print("TensorFlow: OK")
except Exception as e: print("TensorFlow: NOT AVAILABLE -", e)
