"""
Kaggle dataset setup helper.

Set KAGGLE_DATASET to an identifier such as owner/dataset-name.
The dataset must be legally usable for your project.
"""
import os, subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
dest=ROOT/"data/raw"
dest.mkdir(parents=True,exist_ok=True)
dataset=os.getenv("KAGGLE_DATASET")
if not dataset:
    raise SystemExit("Set KAGGLE_DATASET=owner/dataset-name before running.")
subprocess.run(["kaggle","datasets","download","-d",dataset,"-p",str(dest),"--unzip"],check=True)
print("Dataset downloaded to",dest)
