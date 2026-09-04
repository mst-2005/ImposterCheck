# Architecture

1. Frontend sends an image to FastAPI.
2. OpenCV computes brightness, contrast, blur and glare signals.
3. PaddleOCR extracts text when installed.
4. Reference text is compared with OCR output.
5. EfficientNetB0 supplies a visual signal when a trained model exists.
6. XGBoost combines engineered features when its trained artifact exists.
7. A deterministic fallback is used when optional trained artifacts are absent.
8. API returns PASS / REVIEW / REJECT with risk score and model provenance.

## Production note
Thresholds, datasets, calibration, security controls and validation must be tuned and independently evaluated before production use.
