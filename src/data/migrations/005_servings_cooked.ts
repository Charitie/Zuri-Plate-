// Splits calendar_entries.servings_used, which meant "cooked" for shopping but was
// also read as "eaten" for protein, so leftovers were counted twice.
//  - servings_cooked: what gets cooked (and bought). Leftovers cook 0.
//  - servings_used: what is eaten in that slot. A dinner that makes leftovers eats 1;
//    the rest is eaten as the leftover lunch.
// Before this, a dinner with servings_used > 1 always meant "cook the whole recipe,
// eat one serving" (see the old leftoverLinker), so that's how it's backfilled.
export default `
ALTER TABLE calendar_entries ADD COLUMN servings_cooked INTEGER NOT NULL DEFAULT 0;

UPDATE calendar_entries SET servings_cooked = servings_used WHERE is_leftover = 0;

UPDATE calendar_entries SET servings_used = 1
WHERE is_leftover = 0 AND slot = 'dinner' AND servings_used > 1;
`;
