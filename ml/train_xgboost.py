from pathlib import Path
import pandas as pd
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

ROOT=Path(__file__).resolve().parents[1]
csv_path=ROOT/"data/processed/features.csv"
out=ROOT/"models/fraud_xgboost.joblib"

df=pd.read_csv(csv_path)
if len(df)<10 or df.label.nunique()<2:
    raise SystemExit("Need at least 10 labelled samples and both real/fake classes.")

X=df.drop(columns=["label"])
y=df["label"]
Xtr,Xte,ytr,yte=train_test_split(X,y,test_size=.2,random_state=42,stratify=y)
model=XGBClassifier(n_estimators=150,max_depth=4,learning_rate=.05,
                    subsample=.9,colsample_bytree=.9,eval_metric="logloss")
model.fit(Xtr,ytr)
print(classification_report(yte,model.predict(Xte)))
out.parent.mkdir(exist_ok=True)
joblib.dump(model,out)
print("Saved",out)
