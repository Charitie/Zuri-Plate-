// Integrity fixes on top of 001:
//  - calendar_entries: ON DELETE CASCADE for meal_id and source_entry_id, so deleting
//    a meal removes its calendar entries, and deleting a dinner removes its leftover lunch.
//    SQLite can't alter constraints, so the table is rebuilt (the "12-step" pattern:
//    create new, copy, drop old, rename). Runs with foreign_keys OFF — see db.ts.
//  - user_settings.onboarded_at: a real "has finished onboarding" flag.
//  - meals.photo_uri: stored relative to the documents dir, because the absolute
//    path changes between iOS installs/restores. See imageService.ts.
export default `
CREATE TABLE calendar_entries_new (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  slot TEXT NOT NULL CHECK (slot IN ('breakfast','lunch','dinner','snack')),
  meal_id TEXT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  servings_used INTEGER NOT NULL DEFAULT 1,
  is_leftover INTEGER NOT NULL DEFAULT 0,
  source_entry_id TEXT REFERENCES calendar_entries(id) ON DELETE CASCADE,
  eaten INTEGER NOT NULL DEFAULT 0
);

INSERT INTO calendar_entries_new (id, date, slot, meal_id, servings_used, is_leftover, source_entry_id, eaten)
SELECT id, date, slot, meal_id, servings_used, is_leftover, source_entry_id, eaten
FROM calendar_entries
WHERE meal_id IN (SELECT id FROM meals);

DROP TABLE calendar_entries;
ALTER TABLE calendar_entries_new RENAME TO calendar_entries;

UPDATE calendar_entries SET source_entry_id = NULL
WHERE source_entry_id IS NOT NULL AND source_entry_id NOT IN (SELECT id FROM calendar_entries);

CREATE INDEX IF NOT EXISTS idx_calendar_entries_date ON calendar_entries(date);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_source ON calendar_entries(source_entry_id);

ALTER TABLE user_settings ADD COLUMN onboarded_at TEXT;

UPDATE meals SET photo_uri = substr(photo_uri, instr(photo_uri, 'meal-photos/'))
WHERE photo_uri IS NOT NULL AND instr(photo_uri, 'meal-photos/') > 0;
`;
