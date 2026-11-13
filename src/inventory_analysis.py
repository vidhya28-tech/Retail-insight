from pathlib import Path
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]

def inventory_correlation(df: pd.DataFrame) -> dict:
    inventory_days=next((c for c in df.columns if c.strip().lower() in {"inventory days","days of inventory","days on hand"}),None)
    if inventory_days is None or "Profit" not in df:
        return {"calculated":False,"reason":"No genuine inventory-days field is present alongside profit. Correlation and inventory turnover are not calculable.","required_data":["dated stock-on-hand snapshots by SKU and location","units sold by SKU and day","receipts and replenishment dates","stockout periods","supplier lead times"]}
    valid=df[[inventory_days,"Profit"]].apply(pd.to_numeric,errors="coerce").dropna()
    return {"calculated":True,"field":inventory_days,"pearson_r":float(valid.corr(method="pearson").iloc[0,1]) if len(valid)>1 else None,"n":len(valid),"interpretation":"Descriptive association only; it does not establish causality."}

if __name__=="__main__":
    path=ROOT/"data/processed/retail_cleaned.csv"
    if not path.exists(): raise FileNotFoundError("Run the data cleaning pipeline first.")
    print(inventory_correlation(pd.read_csv(path)))
