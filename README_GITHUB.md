# Retail Insight Lab

Retail Insight Lab is a retail analytics project with an interactive beige-themed dashboard, transaction filters, Python analysis tools, SQL examples, Tableau-ready exports, and generated reporting assets.

> **Privacy and Git history:** The dashboard now uses `data/processed/retail_public.csv`, a 10,194-row copy with `Customer Name`, `Customer ID`, and `Postal Code` removed. The original workbook and full cleaned dataset were committed in earlier Git history. `.gitignore` does not remove tracked files or erase history. Keep this existing repository **private** unless its history is reviewed and sanitized first. Do not publish it publicly as-is.

## Features

- React dashboard with Overview, Data Audit, Profitability, Seasonality, Product Velocity, and Deliverables views.
- Date, country/state/city, region, category, and customer-segment filters.
- Country, state, and city options based on the complete cleaned transaction set.
- Charts and tables for sales, profit, margin, product performance, and seasonality.
- Python cleaning and analysis scripts, a Streamlit dashboard, SQL examples, Tableau CSV exports, and report figures/PDF.
- The dashboard retains the original source values; INR figures are explicitly illustrative and source currency is unverified.

## Technologies

- React 19, TypeScript, Vite 8, React Router
- Tailwind CSS, shadcn/ui, Radix UI, Lucide, Recharts
- Python, pandas, NumPy, Streamlit, Plotly, Matplotlib, Seaborn, ReportLab
- SQL examples and SQLite database builder

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- Python 3.10+ for the optional analysis pipeline and Streamlit dashboard

## Run the React dashboard

From the repository root:

```text
npm ci
npm run dev
```

Vite prints the local preview URL. To create a production build:

```text
npm run build
```

The React app reads `data/processed/retail_public.csv` and `reports/analysis_results.json` from the repository. The sanitized CSV retains the 10,194 transaction rows and the fields needed for dashboard metrics and location filters, while omitting customer names, customer IDs, and postal codes.

## Optional Python analysis and Streamlit dashboard

Install the Python dependencies:

```text
python -m venv .venv
python -m pip install -r requirements.txt
```

The source workbook is intentionally excluded from new Git additions. To run the workbook-based analysis pipeline, place an approved workbook at `data/raw/sample_-_superstore(2).xls`, then run:

```text
python src/analysis.py
python src/inventory_analysis.py
python reports/generate_report.py
python -m streamlit run dashboard/app.py
```

The Python pipeline writes derived outputs under `data/processed/`, `data/tableau_exports/`, `database/`, and `reports/`. Verify permissions and remove identifying fields before publishing any newly generated outputs.

## Project structure

- `src/` — React application, pages, styles, and Python analysis modules
- `dashboard/` — Streamlit dashboard
- `data/processed/` — cleaned transaction data and quality metadata
- `data/tableau_exports/` — grouped CSV analysis exports
- `reports/` — summaries, charts, and PDF report
- `sql/` — schema, quality checks, queries, and views
- `server/` — Nitro API routes

## Screenshots

No application screenshots are included yet. Add a captured dashboard image under `docs/screenshots/` and link it here when available, for example:

```markdown
![Retail Insight Lab dashboard](docs/screenshots/dashboard.png)
```

## Data and responsible interpretation

The cleaned dataset contains sample transaction rows and the dashboard uses the sanitized copy. The original source workbook contains customer-identifying columns and should not be republished without confirming its license and privacy status. Sales velocity is a demand proxy, not inventory turnover; the workbook does not contain stock-on-hand or lead-time fields. Discount comparisons are descriptive, not causal. Currency conversion is an illustrative ₹84 per assumed USD, not a verified exchange rate.

## GitHub publishing

For this current repository and its existing history, use a **private** GitHub repository. A public repository requires a separately reviewed, sanitized history that excludes the committed source workbook and full cleaned dataset; simply adding ignore rules or switching the dashboard to the sanitized copy is not sufficient.

No hosting or deployment is configured by these instructions.
