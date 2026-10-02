// Widens shopping_list_items.category beyond proteins/carbs/vegetables/other to
// dairy, grains (cereals — replaces "carbs"), fruits, spices and pantry.
// SQLite can't alter a CHECK constraint, so the table is rebuilt (see 002).
// Existing items keep their category, except carbs -> grains; regenerating the
// list re-sorts everything with the new keyword rules.
export default `
CREATE TABLE shopping_list_items_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('proteins','dairy','grains','vegetables','fruits','spices','pantry','other')
  ),
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  checked INTEGER NOT NULL DEFAULT 0,
  list_generated_at TEXT NOT NULL
);

INSERT INTO shopping_list_items_new (id, name, category, quantity, unit, checked, list_generated_at)
SELECT id, name, CASE category WHEN 'carbs' THEN 'grains' ELSE category END, quantity, unit, checked, list_generated_at
FROM shopping_list_items;

DROP TABLE shopping_list_items;
ALTER TABLE shopping_list_items_new RENAME TO shopping_list_items;
`;
