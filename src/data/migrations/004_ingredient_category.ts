// Optional per-ingredient shopping category. NULL = "auto": the shopping list
// falls back to keyword matching, so improving the keywords still helps every
// ingredient the user never overrode.
export default `
ALTER TABLE meal_ingredients ADD COLUMN category TEXT CHECK (
  category IS NULL OR category IN ('proteins','dairy','grains','vegetables','fruits','spices','pantry','other')
);
`;
