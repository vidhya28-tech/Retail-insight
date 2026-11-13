# Tableau dashboard guide

## Inputs and honest scope
Run the Python pipeline first. It generates `data/tableau_exports/` CSVs from the workbook actually placed in `data/raw/`. The export names are `category_profitability.csv`, `subcategory_profitability.csv`, `regional_performance.csv`, `monthly_trends.csv`, `seasonal_performance.csv`, `product_performance.csv`, and `discount_impact.csv`. These are grouped aggregates; the cleaned line-level CSV is also available at `data/processed/retail_cleaned.csv`. No Tableau workbook is included or claimed as published.

## Connect the data
In Tableau Desktop/Public, choose **Connect → To a File → Text File**, open one CSV, then use **Add** on the Data Source page to add the other files. Prefer the cleaned transaction CSV as the primary logical table when all filters need to behave consistently. If you use separate aggregate exports, relate only on common dimensions and beware joining differently-grained aggregates (which can multiply values); safest is one worksheet per export and dashboard filter actions only where a shared dimension exists. Use `Order Date` as a Date type and `Sales`, `Profit`, `Quantity`, and `Discount` as numeric types. Confirm source currency in the data dictionary; never assume USD without workbook evidence.

## Worksheets
1. **Category profit & sales:** horizontal bars, category; SUM(Profit), labels; add SUM(Sales) to tooltip.
2. **Sub-category margin:** sorted horizontal bars; sub-category; margin calculation below; color profit with a diverging palette centered at zero.
3. **Regional performance:** bars by region for profit, with sales in tooltip; companion margin table.
4. **Monthly trend:** continuous/ordered month line chart; sales and profit on separate sheets or dual axis with clear units.
5. **Seasonality:** seasonal sales bars. Season uses calendar-month grouping derived in Python (Northern Hemisphere reporting convention), not weather observations.
6. **Product performance:** top/bottom products by sales and units; identify velocity only as units per observed calendar month.
7. **Discount impact:** discount cohort bars or scatter plot against profit, with transaction count tooltip; descriptive association, not causation.

## Calculated fields
For row-level source data, use aggregate-safe weighted margin:

```text
Profit Margin (%) = SUM([Profit]) / NULLIF(SUM([Sales]), 0) * 100
```

For a line-level product proxy, create `Units per Observed Month = SUM([Quantity]) / [Observed Months]`; use the actual min/max order-date months in the workbook to establish the observation window, and recompute for a filtered window if the question concerns that window. This is not stock turnover, days of supply, or proof of overstock. Never average per-row profit margins to produce total margin.

## Dashboard layout and filters
Build a 1200×850 executive dashboard: title and verified date/currency note across top; KPI strip (Sales, Profit, weighted Margin, distinct Orders); category and monthly trend in the center; regional and sub-category views below. Keep a clear zero-profit reference and source-currency label. Add global filters for **Region**, **Category (product type)**, **Sub-Category**, **Order Date**, **Season**, and **Segment**, then choose **Apply to Worksheets → All Using This Data Source**. If using separate data sources, use dashboard filter actions only for matching dimensions; verify that each chart responds correctly after every filter. Do not claim product type is an available filter unless the Category field exists.

## Publish
Save the workbook locally as `Retail_Business_Performance.twbx` (packaged extract if permitted), then use **Server → Tableau Public → Save to Tableau Public** and sign in. Inspect tooltips, filter actions, totals, axis units, and privacy before publishing. Do not publish customer-level personally identifiable information. Include the workbook URL only after actual publication; this repository does not include a published workbook.
