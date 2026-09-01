"""
Generate a simple feature table from labelled image folders.

Creates:
data/processed/features.csv

This is a feature-preparation utility, not a claim of benchmark performance.
"""
from pathlib import Path
import csv, cv2

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT/"data/raw"
OUT = ROOT/"data/processed/features.csv"

rows=[]
for label_name, label in [("real",0),("fake",1)]:
    folder=DATA/label_name
    if not folder.exists(): continue
    for p in folder.rglob("*"):
        if p.suffix.lower() not in {".jpg",".jpeg",".png",".bmp",".webp"}: continue
        im=cv2.imread(str(p))
        if im is None: continue
        gray=cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
        rows.append({
            "brightness":float(gray.mean()),
            "contrast":float(gray.std()),
            "blur_score":float(cv2.Laplacian(gray,cv2.CV_64F).var()),
            "glare_ratio":float((gray>245).mean()),
            "ocr_confidence":0.0,
            "reference_similarity":0.0,
            "visual_score":0.0,
            "label":label
        })

OUT.parent.mkdir(parents=True,exist_ok=True)
with OUT.open("w",newline="") as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0].keys()) if rows else
                     ["brightness","contrast","blur_score","glare_ratio","ocr_confidence","reference_similarity","visual_score","label"])
    w.writeheader(); w.writerows(rows)
print(f"Wrote {len(rows)} rows to {OUT}")
