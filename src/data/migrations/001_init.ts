// Initial schema. Kept as a TS string because Metro can't import raw .sql files.
export default `
CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('breakfast','lunch','dinner','snack')),
  protein_g REAL NOT NULL,
  servings INTEGER NOT NULL DEFAULT 1,
  photo_uri TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meal_ingredients (
  id TEXT PRIMARY KEY,
  meal_id TEXT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS calendar_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('breakfast','lunch','dinner','snack')),
  meal_id TEXT NOT NULL REFERENCES meals(id),
  servings_used INTEGER NOT NULL DEFAULT 1,
  is_leftover INTEGER NOT NULL DEFAULT 0,
  source_entry_id TEXT REFERENCES calendar_entries(id),
  eaten INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_calendar_entries_date ON calendar_entries(date);

CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  protein_target_g REAL NOT NULL DEFAULT 120,
  leftover_lunch_enabled INTEGER NOT NULL DEFAULT 1,
  plan_days INTEGER NOT NULL DEFAULT 7,
  variety_preference TEXT NOT NULL DEFAULT 'balanced'
);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('proteins','carbs','vegetables','other')),
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  checked INTEGER NOT NULL DEFAULT 0,
  list_generated_at TEXT NOT NULL
);
`;
