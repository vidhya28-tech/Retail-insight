CREATE VIEW IF NOT EXISTS category_profitability AS
SELECT category, SUM(sales) sales, SUM(profit) profit, 100.0*SUM(profit)/NULLIF(SUM(sales),0) profit_margin_pct FROM transactions GROUP BY category;
CREATE VIEW IF NOT EXISTS subcategory_profitability AS
SELECT category, sub_category, SUM(sales) sales, SUM(profit) profit, 100.0*SUM(profit)/NULLIF(SUM(sales),0) profit_margin_pct FROM transactions GROUP BY category,sub_category;
CREATE VIEW IF NOT EXISTS regional_performance AS
SELECT region, SUM(sales) sales, SUM(profit) profit, 100.0*SUM(profit)/NULLIF(SUM(sales),0) profit_margin_pct FROM transactions GROUP BY region;
