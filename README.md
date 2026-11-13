# Retail Insight Lab

## Retail Business Performance & Profitability Analysis

Retail Insight Lab is a retail business analytics project developed as part of the Elevate Labs Data Analytics Internship. The project focuses on analyzing transactional retail data to understand sales performance, profitability, regional contribution, product categories, customer demand and seasonal trends.

The application combines an interactive web dashboard with Python-based analysis, SQL queries, visualizations and reporting resources.

## Project Overview

The project aims to transform retail transaction data into meaningful business insights. It helps identify profitable and low-performing product categories, compare regional performance, examine monthly sales patterns and understand product demand.

The dashboard provides an organized view of key business metrics and analytical results through interactive filters, charts and tables.

## Features

### Interactive Analytics Dashboard
- Overview of important retail business metrics.
- Data audit and quality assessment.
- Category and sub-category profitability analysis.
- Regional sales and profit comparison.
- Monthly and seasonal performance analysis.
- Product velocity and demand analysis.
- Deliverables and project resources.

### Interactive Filters
- Date range
- Country, state and city
- Region
- Product category
- Customer segment

### Business Analysis
- Total sales and profit analysis.
- Profit margin comparison.
- Category and sub-category performance.
- Regional contribution.
- Monthly sales trends.
- Product demand and sales velocity.
- Return and data quality assessment.

## Technologies Used

**Frontend**
- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- Radix UI
- Recharts

**Data Analysis**
- Python
- Pandas
- NumPy
- Matplotlib
- Seaborn
- Plotly
- Streamlit

**Database and Querying**
- SQL
- SQLite

## Key Business Findings

The analysis of 10,194 retail transaction records produced the following results:

| Metric | Result |
|---|---:|
| Total Sales | 2,326,534.35 |
| Total Profit | 292,296.81 |
| Overall Profit Margin | 12.56% |
| Total Units Sold | 38,654 |
| Distinct Orders | 5,111 |
| Returned Orders | 296 |
| Order-level Return Rate | 5.79% |

### Category Profitability

- Technology recorded the highest category profit of 146,543.38.
- Office Supplies generated a profit of 126,023.44.
- Furniture recorded a comparatively lower profit of 19,730.00 and a margin of 2.61%.

### Regional Performance

- The West region generated a profit of 110,798.82.
- The Central region generated a profit of 39,865.31.
- Regional profitability varied, highlighting opportunities for improving business performance.

*All financial values are expressed in source-currency units because the original dataset's currency has not been independently verified.*

## Inventory and Product Demand Analysis

Product velocity is examined using transaction-level sales quantities and time-based demand patterns.

The source dataset does not contain stock-on-hand, inventory-days or lead-time information. Therefore, actual inventory turnover, inventory holding days and inventory-days-to-profitability correlation cannot be calculated from the available data.

Sales velocity is treated as a demand indicator and not as a substitute for inventory turnover.

## Project Structure

```text
Retail-Insight-lab/
├── dashboard/
│   └── app.py
├── public/
├── reports/
│   ├── final_report.pdf
│   ├── executive_summary.md
│   ├── analysis_results.json
│   ├── generate_report.py
│   └── figures/
├── server/
│   └── routes/
│       └── api/
├── sql/
│   ├── schema.sql
│   ├── data_quality.sql
│   ├── queries.sql
│   └── views.sql
├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── analysis.py
│   ├── data_cleaning.py
│   ├── inventory_analysis.py
│   └── main.tsx
├── .gitignore
├── index.html
├── package.json
└── README.md
```

## Installation and Execution

### Requirements

- Node.js 20.19+ or 22.12+
- npm
- Python 3.10+ for optional Python analysis and Streamlit components

### Run the React Dashboard

Install project dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

### Run the Python Dashboard

Install the required Python packages and run:

```bash
python -m streamlit run dashboard/app.py
```

### Run Python Analysis

```bash
python src/analysis.py
python src/inventory_analysis.py
python reports/generate_report.py
```

## Project Deliverables

- Interactive Retail Insight Lab dashboard.
- Python data cleaning and analysis scripts.
- SQL schema, queries, views and data quality checks.
- Business performance charts and visualizations.
- Final project report in PDF format.
- Tableau analysis guidance and supporting resources.

## Conclusion

Retail Insight Lab demonstrates how retail transaction data can be transformed into actionable business insights using data analytics and visualization techniques.

The project highlights profitability differences across categories and regions, identifies sales trends and evaluates product demand while clearly documenting the limitations of the available inventory data.


Elevate Labs – Data Analytics Internship  
2026
