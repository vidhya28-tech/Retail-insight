from __future__ import annotations
import json, sqlite3
from pathlib import Path
import pandas as pd
ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "database" / "retail_bi.db"


def build_database(df: pd.DataFrame) -> Path:
    DB.parent.mkdir(parents=True, exist_ok=True)
    if DB.exists(): DB.unlink()
    records = df.copy()
    records.insert(0, "source_row_id", range(1, len(records)+1))
    records["source_record_json"] = records.drop(columns=["source_row_id"]).apply(lambda row: json.dumps(row.to_dict(), default=str), axis=1)
    mapping = {"Order ID":"order_id","Order Date":"order_date","Ship Date":"ship_date","Ship Mode":"ship_mode","Customer ID":"customer_id","Customer Name":"customer_name","Segment":"segment","Country":"country","City":"city","State":"state","Postal Code":"postal_code","Region":"region","Product ID":"product_id","Category":"category","Sub-Category":"sub_category","Product Name":"product_name","Sales":"sales","Quantity":"quantity","Discount":"discount","Profit":"profit","Year":"year","Month":"month","Month Name":"month_name","Quarter":"quarter","Season":"season"}
    records = records.rename(columns={k:v for k,v in mapping.items() if k in records.columns})
    for col in records.columns:
        if pd.api.types.is_datetime64_any_dtype(records[col]): records[col] = records[col].dt.strftime("%Y-%m-%d")
    with sqlite3.connect(DB) as conn:
        records.to_sql("transactions", conn, if_exists="replace", index=False)
        returns_path = ROOT / "data" / "processed" / "returns_cleaned.csv"
        if returns_path.exists():
            returns = pd.read_csv(returns_path)
            order_col = next((c for c in returns.columns if c.strip().lower() == "order id"), None)
            flag_col = next((c for c in returns.columns if c.strip().lower() == "returned"), None)
            if order_col:
                returns_table = pd.DataFrame({"order_id": returns[order_col].astype(str), "returned": returns[flag_col].astype(str) if flag_col else "Yes"}).drop_duplicates("order_id")
                returns_table.to_sql("returns", conn, if_exists="replace", index=False)
        else:
            conn.execute("CREATE TABLE returns (order_id TEXT PRIMARY KEY, returned TEXT)")
        if {"category", "sales", "profit"}.issubset(records.columns):
            conn.execute("CREATE VIEW category_profitability AS SELECT category, SUM(sales) sales, SUM(profit) profit, 100.0*SUM(profit)/NULLIF(SUM(sales),0) profit_margin_pct FROM transactions GROUP BY category")
        if {"category", "sub_category", "sales", "profit"}.issubset(records.columns):
            conn.execute("CREATE VIEW subcategory_profitability AS SELECT category, sub_category, SUM(sales) sales, SUM(profit) profit, 100.0*SUM(profit)/NULLIF(SUM(sales),0) profit_margin_pct FROM transactions GROUP BY category,sub_category")
        if {"region", "sales", "profit"}.issubset(records.columns):
            conn.execute("CREATE VIEW regional_performance AS SELECT region, SUM(sales) sales, SUM(profit) profit, 100.0*SUM(profit)/NULLIF(SUM(sales),0) profit_margin_pct FROM transactions GROUP BY region")
    return DB

if __name__ == "__main__":
    from data_cleaning import clean_workbook
    frame,_=clean_workbook(); print(build_database(frame))
