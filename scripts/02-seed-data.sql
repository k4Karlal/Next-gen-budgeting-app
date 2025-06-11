-- Insert default categories
INSERT INTO categories (name, type, color) VALUES
  ('Salary', 'income', '#10B981'),
  ('Freelance', 'income', '#059669'),
  ('Investments', 'income', '#047857'),
  ('Other Income', 'income', '#065F46'),
  ('Housing', 'expense', '#EF4444'),
  ('Food & Dining', 'expense', '#F97316'),
  ('Transportation', 'expense', '#EAB308'),
  ('Shopping', 'expense', '#8B5CF6'),
  ('Entertainment', 'expense', '#EC4899'),
  ('Bills & Utilities', 'expense', '#6B7280'),
  ('Healthcare', 'expense', '#14B8A6'),
  ('Education', 'expense', '#3B82F6'),
  ('Travel', 'expense', '#F59E0B'),
  ('Other Expenses', 'expense', '#6366F1')
ON CONFLICT DO NOTHING;
