-- All financial margin calculations use weighted aggregate ratio, never average row margins.
-- 1. Overall performance
SELECT SUM(sales) sales, SUM(profit) profit, 100.0*SUM(profit)/NULLIF(SUM(sales),0) profit_margin_pct,
       COUNT(DISTINCT order_id) orders, SUM(quantity) units FROM transactions;
-- 2. Category performance
SELECT category, SUM(sales) sales, SUM(profit) profit,
       100.0*SUM(profit)/NULLIF(SUM(sales),0) profit_margin_pct FROM transactions GROUP BY category;
-- 3-4. Sub-category margin and loss makers
SELECT category, sub_category, SUM(sales) sales, SUM(profit) profit,
       100.0*SUM(profit)/NULLIF(SUM(sales),0) profit_margin_pct
FROM transactions GROUP BY category, sub_category ORDER BY profit;
-- 5. Region
SELECT region, SUM(sales) sales, SUM(profit) profit, 100.0*SUM(profit)/NULLIF(SUM(sales),0) profit_margin_pct FROM transactions GROUP BY region;
-- 6. Monthly and seasonal trends
SELECT year, month, month_name, season, SUM(sales) sales, SUM(profit) profit FROM transactions GROUP BY year,month,month_name,season ORDER BY year,month;
-- 7. Discount cohorts (descriptive, not causal)
SELECT ROUND(discount,2) discount, COUNT(*) lines, SUM(sales) sales, SUM(profit) profit,
  100.0*SUM(profit)/NULLIF(SUM(sales),0) profit_margin_pct FROM transactions GROUP BY ROUND(discount,2) ORDER BY discount;
-- 8. Product performance and demand proxy: sold units per observed calendar month in dataset.
WITH span AS (SELECT MAX((year*12+month)) - MIN((year*12+month)) + 1 AS months FROM transactions)
SELECT product_id, product_name, SUM(sales) sales, SUM(quantity) units, SUM(profit) profit,
       SUM(quantity)*1.0/NULLIF((SELECT months FROM span),0) units_per_observed_month
FROM transactions GROUP BY product_id,product_name ORDER BY sales DESC;
-- 9. Customer/segment analysis
SELECT segment, COUNT(DISTINCT customer_id) customers, COUNT(DISTINCT order_id) orders, SUM(sales) sales, SUM(profit) profit FROM transactions GROUP BY segment;
-- 10. Returns: aggregate returns to one row/order before joining to prevent line duplication.
WITH returned_orders AS (SELECT DISTINCT order_id FROM returns)
SELECT COUNT(DISTINCT t.order_id) total_orders, COUNT(DISTINCT r.order_id) returned_orders,
       100.0*COUNT(DISTINCT r.order_id)/NULLIF(COUNT(DISTINCT t.order_id),0) returned_order_rate_pct
FROM transactions t LEFT JOIN returned_orders r ON t.order_id=r.order_id;
-- 11. Product velocity is not inventory turnover and cannot establish overstock.
