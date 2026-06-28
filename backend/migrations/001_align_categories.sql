-- Align the transactions/budgets category CHECK constraints with the category
-- set the frontend actually uses (frontend/src/data.js CATS). The original
-- constraints allowed a different lowercase set (groceries, rent, ...), which
-- did not match the app's categories (Groceries, Housing, Dining, ...).
--
-- Both tables are empty, so dropping/recreating the constraints is safe.
-- The full set covers expense and income categories; `type` distinguishes them.

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_category_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_category_check
  CHECK (category IN (
    'Groceries','Housing','Transport','Dining','Entertainment','Utilities',
    'Shopping','Health','Other','Salary','Freelance','Other Income'
  ));

ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_category_check;
ALTER TABLE budgets ADD CONSTRAINT budgets_category_check
  CHECK (category IN (
    'Groceries','Housing','Transport','Dining','Entertainment','Utilities',
    'Shopping','Health','Other','Salary','Freelance','Other Income'
  ));
