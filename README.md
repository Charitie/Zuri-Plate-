# Meal Calendar App

React Native (Expo) + TypeScript. Local-first — all data lives in on-device SQLite, no backend for V1.

## Getting started

```bash
npm install
npx expo start
```

## Project layout

- `src/data/` — SQLite connection, migrations, and repositories (the only layer that touches SQL).
- `src/domain/` — pure logic: plan generation, protein math, shopping-list aggregation, leftover linking. No React Native imports, so this is what's covered by `__tests__/`.
- `src/store/` — Zustand stores that wrap the repositories for the UI.
- `src/screens/` + `src/components/` — UI. Screens stay thin; they call stores/repos, they don't compute.
- `src/services/` — device APIs (camera/image compression, date helpers).

## Running tests

```bash
npm test
```

Tests cover `planGenerator` and `shoppingAggregator` — the two places with real logic worth protecting.

## Known TODOs / things a real build needs before shipping

1. **`RootNavigator.hasCompletedOnboarding`** is currently a stub that always returns `false` (onboarding shows every launch). Wire this to a persisted flag — either a dedicated `onboarding_complete` column on `user_settings`, or an `AsyncStorage` key set at the end of `PlanDaysScreen`.
2. **SQL migration import** (`import initSql from './migrations/001_init.sql'` in `src/data/db.ts`) needs a Metro transform that can import `.sql` as text (e.g. `expo-sqlite`'s asset loader, or a small custom Metro resolver). If you'd rather not configure that, inline the migration as a template string in `db.ts` instead — it's the same SQL either way.
3. **No backup path.** Local-first means a lost/reset phone loses the meal library and plan history. A JSON export/import screen (Settings → Export Data) is worth adding early, even before any real sync backend.
4. **Plan generator variety** is currently pure random selection weighted only by "not used this week." If the meal library is small, expect visible repeats — fine for V1, worth revisiting once real meal counts are known.
5. **Shopping list categorization** (`domain/shoppingAggregator.ts`) uses a keyword list against ingredient names. It's a reasonable V1 shortcut for Kenyan staples but will misclassify anything not in `CATEGORY_KEYWORDS` — falls back to `other`, so nothing gets silently dropped.

## Data model

See `src/data/types.ts` for the full shape, and `src/data/migrations/001_init.sql` for the schema. Everything uses UUIDs for IDs so a future sync backend is a data-merge problem, not a schema migration.
