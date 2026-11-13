-- Transactions are stored at source row grain. No joins are required for core totals.
CREATE TABLE IF NOT EXISTS transactions (
  source_row_id INTEGER PRIMARY KEY,
  order_id TEXT, order_date TEXT, ship_date TEXT, ship_mode TEXT,
  customer_id TEXT, customer_name TEXT, segment TEXT,
  country TEXT, city TEXT, state TEXT, postal_code TEXT, region TEXT,
  product_id TEXT, category TEXT, sub_category TEXT, product_name TEXT,
  sales REAL, quantity REAL, discount REAL, profit REAL,
  year INTEGER, month INTEGER, month_name TEXT, quarter TEXT, season TEXT,
  source_record_json TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transactions_order_date ON transactions(order_date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category, sub_category);
CREATE TABLE IF NOT EXISTS returns (order_id TEXT PRIMARY KEY, returned TEXT);
