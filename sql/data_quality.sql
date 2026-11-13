-- Confirm row grain and required measures
SELECT COUNT(*) AS rows, COUNT(DISTINCT order_id) AS orders, SUM(sales) AS sales, SUM(profit) AS profit FROM transactions;
SELECT SUM(order_id IS NULL) missing_order_id, SUM(sales IS NULL) missing_sales, SUM(profit IS NULL) missing_profit, SUM(quantity IS NULL) missing_quantity FROM transactions;
SELECT COUNT(*) AS duplicate_source_rows FROM (SELECT source_record_json FROM transactions GROUP BY source_record_json HAVING COUNT(*) > 1);
SELECT MIN(order_date) first_order_date, MAX(order_date) last_order_date FROM transactions;
