from __future__ import annotations

from pathlib import Path
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"
DATE_CANDIDATES = {"order date": "Order Date", "ship date": "Ship Date"}


def find_workbook(path: Path | None = None) -> Path:
    if path:
        if not path.exists():
            raise FileNotFoundError(f"Workbook not found: {path}")
        return path
    exact_source = RAW / "sample_-_superstore(2).xls"
    if exact_source.exists():
        return exact_source
    candidates = sorted([*RAW.glob("*.xls"), *RAW.glob("*.xlsx")])
    if not candidates:
        raise FileNotFoundError(f"Place sample_-_superstore.xls in {RAW} before running the pipeline.")
    return candidates[0]


def clean_workbook(path: Path | None = None) -> tuple[pd.DataFrame, dict]:
    source = find_workbook(path)
    workbook = pd.ExcelFile(source)
    frames = {sheet: pd.read_excel(source, sheet_name=sheet) for sheet in workbook.sheet_names}
    if not frames:
        raise ValueError("Workbook contains no readable worksheets.")
    sheet = next((s for s, f in frames.items() if len(f.columns) > 0 and "order id" in [str(c).strip().lower() for c in f.columns]), next((s for s, f in frames.items() if len(f.columns) > 0), workbook.sheet_names[0]))
    df = frames[sheet].copy()
    df.columns = [str(c).strip() for c in df.columns]
    returns_sheet = next((name for name, frame in frames.items() if name != sheet and "return" in name.lower() and "order id" in [str(c).strip().lower() for c in frame.columns]), None)
    returns_frame = frames[returns_sheet].copy() if returns_sheet else pd.DataFrame()
    if not returns_frame.empty:
        returns_frame.columns = [str(c).strip() for c in returns_frame.columns]
    rows_before = len(df)
    exact_duplicates = int(df.duplicated().sum())
    df = df.drop_duplicates().copy()
    missing_before = df.isna().sum().to_dict()

    for column in df.columns:
        key = column.strip().lower()
        if key in DATE_CANDIDATES:
            df[column] = pd.to_datetime(df[column], errors="coerce")
    for column in df.columns:
        if column.strip().lower() in {"sales", "profit", "discount", "quantity", "shipping cost", "unit price"}:
            df[column] = pd.to_numeric(df[column], errors="coerce")

    # Preserve missing values rather than guessing; rows lacking essential transaction measures cannot support analysis.
    essential = [c for c in ["Sales", "Profit", "Quantity", "Order Date"] if c in df.columns]
    removed_invalid = int(df[essential].isna().any(axis=1).sum()) if essential else 0
    if essential:
        df = df.dropna(subset=essential).copy()
    if "Order Date" in df.columns:
        df["Year"] = df["Order Date"].dt.year.astype("Int64")
        df["Month"] = df["Order Date"].dt.month.astype("Int64")
        df["Month Name"] = df["Order Date"].dt.month_name()
        df["Quarter"] = "Q" + df["Order Date"].dt.quarter.astype(str)
        # Seasons are Northern Hemisphere calendar groupings, explicitly a reporting convention.
        df["Season"] = df["Order Date"].dt.month.map({12:"Winter",1:"Winter",2:"Winter",3:"Spring",4:"Spring",5:"Spring",6:"Summer",7:"Summer",8:"Summer",9:"Autumn",10:"Autumn",11:"Autumn"})
    if "Sales" in df and (df["Sales"] < 0).any():
        raise ValueError("Negative sales found; review source semantics before using this pipeline.")
    if "Quantity" in df and (df["Quantity"] <= 0).any():
        raise ValueError("Non-positive quantities found; review source semantics before using this pipeline.")
    PROCESSED.mkdir(parents=True, exist_ok=True)
    out = PROCESSED / "retail_cleaned.csv"
    df.to_csv(out, index=False)
    if not returns_frame.empty:
        returns_frame = returns_frame.drop_duplicates().dropna(subset=[next(c for c in returns_frame.columns if c.lower() == "order id")])
        returns_frame.to_csv(PROCESSED / "returns_cleaned.csv", index=False)
    info = {
        "source_file": source.name, "sheets": {name: len(frame) for name, frame in frames.items()},
        "selected_sheet": sheet, "source_rows": rows_before, "exact_duplicates_removed": exact_duplicates,
        "rows_removed_for_missing_required_fields": removed_invalid, "clean_rows": len(df),
        "missing_before_cleaning": {str(k): int(v) for k, v in missing_before.items()},
        "columns": {str(c): str(t) for c, t in df.dtypes.items()},
        "date_min": str(df["Order Date"].min().date()) if "Order Date" in df else None,
        "date_max": str(df["Order Date"].max().date()) if "Order Date" in df else None,
        "observed_calendar_months": int(df["Order Date"].dt.to_period("M").nunique()) if "Order Date" in df else 0,
        "currency_evidence": "USD" if "Currency" in df.columns and df["Currency"].astype(str).str.upper().eq("USD").any() else "Unconfirmed; preserve source values",
        "inventory_fields": [c for c in df.columns if any(x in c.lower() for x in ["stock", "inventory", "lead time", "warehouse"])],
        "returns_fields": list(returns_frame.columns) if not returns_frame.empty else [c for c in df.columns if "return" in c.lower()],
        "returns_sheet": returns_sheet,
        "cleaning_decisions": ["Removed exact duplicate rows only.", "Parsed recognized order/ship dates and numeric measures.", "Dropped rows missing available essential sales/profit/quantity/order-date measures; no imputation.", "Derived year, month, quarter, and calendar season when order date exists.", "If a separate returns worksheet exists, preserved its deduplicated order-level records in returns_cleaned.csv."],
    }
    import json
    (PROCESSED / "data_quality.json").write_text(json.dumps(info, indent=2, default=str), encoding="utf-8")
    return df, info


if __name__ == "__main__":
    _, summary = clean_workbook()
    print(f"Cleaned {summary['clean_rows']} rows from {summary['source_file']}.")
