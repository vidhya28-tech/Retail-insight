from __future__ import annotations
from pathlib import Path
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from data_cleaning import clean_workbook, ROOT
from database import build_database

sns.set_theme(style="whitegrid", palette=["#A85D45", "#7D9676", "#708DA3"])
OUT=ROOT/"reports"; FIG=OUT/"figures"; EXPORT=ROOT/"data"/"tableau_exports"

def group_sum(df, keys):
    keys=[k for k in keys if k in df.columns]
    if not keys: return pd.DataFrame()
    aggregations = {
        k: "sum"
        for k in ["Sales", "Profit", "Quantity", "Discount"]
        if k in df.columns and k not in keys
    }
    result=df.groupby(keys, dropna=False).agg(aggregations).reset_index()
    if {"Sales","Profit"} <= set(result.columns): result["Profit Margin (%)"]=np.where(result.Sales.ne(0), result.Profit/result.Sales*100, np.nan)
    return result

def save_chart(df, x, y, filename, title, kind="bar"):
    if df.empty or x not in df or y not in df: return
    fig,ax=plt.subplots(figsize=(10,5)); sns.barplot(data=df,x=x,y=y,ax=ax,color="#A85D45") if kind=="bar" else sns.lineplot(data=df,x=x,y=y,ax=ax,color="#A85D45",marker="o")
    ax.set_title(title,loc="left",weight="bold",color="#3B3028"); ax.set_xlabel(""); ax.set_ylabel(y); fig.tight_layout(); fig.savefig(FIG/filename,dpi=170); plt.close(fig)

def run_analysis(df: pd.DataFrame, quality: dict):
    FIG.mkdir(parents=True,exist_ok=True); EXPORT.mkdir(parents=True,exist_ok=True)
    tables={"category_profitability":group_sum(df,["Category"]),"subcategory_profitability":group_sum(df,["Category","Sub-Category"]),"regional_performance":group_sum(df,["Region"]),"monthly_trends":group_sum(df,["Year","Month","Month Name","Season"]),"seasonal_performance":group_sum(df,["Season"]),"product_performance":group_sum(df,["Product ID","Product Name","Category","Sub-Category"]),"discount_impact":group_sum(df,["Category","Discount"])}
    for name,table in tables.items(): table.to_csv(EXPORT/f"{name}.csv",index=False)
    save_chart(tables["category_profitability"],"Category","Profit","category_profit.png","Category profit"); save_chart(tables["regional_performance"],"Region","Profit","regional_profit.png","Regional profit")
    if not tables["monthly_trends"].empty and "Sales" in tables["monthly_trends"]:
        trend=tables["monthly_trends"].copy(); trend["Period"]=trend[[c for c in ["Year","Month"] if c in trend]].astype(str).agg("-".join,axis=1); save_chart(trend,"Period","Sales","monthly_sales.png","Monthly sales trend","line")
    findings={"dataset":quality,"inventory_analysis":{"possible_fields":quality.get("inventory_fields",[]),"correlation_calculated":False,"reason":"Inventory-days or stock-level fields are absent; no inventory correlation/turnover can be derived."},"summary":{},"recommendations":[]}
    if "Sales" in df: findings["summary"]["total_sales"]=float(df.Sales.sum())
    if "Profit" in df: findings["summary"]["total_profit"]=float(df.Profit.sum())
    if {"Sales","Profit"}<=set(df.columns): findings["summary"]["profit_margin_pct"]=float(df.Profit.sum()/df.Sales.sum()*100) if df.Sales.sum() else None
    for name,key in [("category_profitability","Category"),("subcategory_profitability","Sub-Category"),("regional_performance","Region")]:
        table=tables[name]
        if not table.empty and "Profit" in table:
            findings["summary"][name]=table.sort_values("Profit",ascending=False).to_dict(orient="records")
    if not tables["subcategory_profitability"].empty and "Profit" in tables["subcategory_profitability"]:
        loss=tables["subcategory_profitability"].query("Profit < 0")
        if len(loss): findings["recommendations"].append({"finding":"Loss-making sub-categories exist in the observed period.","evidence":loss[[c for c in ["Category","Sub-Category","Sales","Profit","Profit Margin (%)"] if c in loss]].to_dict("records"),"action":"Review unit economics, discounting, and fulfilment costs before assortment changes."})
    if "Quantity" in df and "Product Name" in df:
        products=group_sum(df,["Product ID","Product Name","Category","Sub-Category"])
        if "Quantity" in products: products["Units per observed month"]=products.Quantity/max(1,quality.get("observed_calendar_months",1)); products.sort_values("Units per observed month").head(10).to_csv(EXPORT/"lowest_sales_velocity_candidates.csv",index=False)
    findings["recommendations"].append({"finding":"Sales velocity can be estimated from units sold over the dataset’s observed time span.","evidence":"See product_performance.csv and lowest_sales_velocity_candidates.csv.","action":"Treat low observed demand as a review queue only—not proof of excess stock. Collect daily stock on hand, receipts, stockouts, lead times, and replenishment events to calculate inventory turnover and days of supply."})
    (OUT/"analysis_results.json").write_text(json.dumps(findings,indent=2,default=str),encoding="utf-8")
    return findings

if __name__=="__main__":
    source=ROOT/"data"/"raw"/"sample_-_superstore(2).xls"
    frame,quality=clean_workbook(source); build_database(frame); result=run_analysis(frame,quality); print(json.dumps(result["summary"],indent=2,default=str))
