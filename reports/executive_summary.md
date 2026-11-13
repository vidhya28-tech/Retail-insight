# Executive summary — awaiting workbook

## Project objective
Evaluate retail transactional performance, profitability, seasonal behavior, discount patterns, and product demand from the actual Superstore workbook. This project does not substitute invented observations for the assignment data.

## Source status and result status
The requested `sample_-_superstore.xls` was not included among the files available to this workspace. Therefore no worksheet names, row counts, columns, actual date range, regional coverage, financial totals, categories, return rates, correlations, or recommendations can yet be stated as findings. The analysis scripts produce those facts once the source is added to `data/raw/` and the pipeline is run. This absence is a delivery limitation, not a zero-valued result.

## Method and deliverables
The project provides source-aware Pandas cleaning, SQLite database creation, SQL queries and views, Seaborn/Matplotlib figure generation, a filtered Streamlit dashboard, Tableau CSV export generation and Tableau build guide, and a PDF report generator. Profit margin is calculated as aggregate profit divided by aggregate sales. Exact duplicates are removed, missing essential transaction records are excluded without imputation, and the cleaning log records decisions.

## Inventory limitation
No inventory-based result can be asserted until the workbook is inspected. If it lacks stock-on-hand, inventory-days, warehouse stock, and lead-time data, actual inventory turnover and inventory-days/profitability correlation cannot be computed. Product units per observed month may be used as a clearly labelled sales-velocity proxy; slow sales alone do not prove overstock. Collect dated SKU-location stock snapshots, receipts, stockouts, daily sales, and supplier lead times.

## Currency and Tableau
Source currency is not presumed. Retain original values; only if the workbook verifies USD may INR figures use the configurable illustrative assumption ₹84/USD, which is not a live exchange rate. The Tableau-ready export process and guide are included; workbook construction and Tableau Public publishing are manual and are not claimed complete.

## Next step
Add the original workbook and run the exact Windows setup and execution sequence in `README.md`. Then replace this pending-source summary with the generated empirical findings and review the charts, SQL/Python totals, dashboard filters, and PDF before submission.
