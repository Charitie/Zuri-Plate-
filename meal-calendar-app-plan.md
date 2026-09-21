# Meal Calendar App — Plan & Project Structure

**Stack:** React Native (Expo) + TypeScript, local-first (SQLite), no backend for V1.

---

## 1. Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | React Native + **Expo** | Fastest path to camera, image manipulation, and app store builds without native config overhead |
| Language | TypeScript | Data model has enough shape (meals, entries, ingredients) to benefit from types |
| Local storage | **SQLite** (`expo-sqlite`) | Relational data (meals ↔ ingredients ↔ calendar entries ↔ leftovers) fits SQL better than a key-value store |
| State | **Zustand** | Lightweight, no boilerplate, plays well with a repo-backed data layer |
| Navigation | React Navigation (bottom tabs + stacks) | Standard, well-supported |
| Photos | `expo-image-picker` + `expo-image-manipulator` + `expo-file-system` | Capture → compress (≤800px, ~150–250KB JPEG) → store locally, path saved in DB |
| Dates | `date-fns` | Lightweight date math for weekly plans |
| Testing | Jest + React Native Testing Library | Unit-test the plan generator and aggregators, which carry the real logic |

Local-first now, designed so a sync backend (e.g. Supabase) can be bolted on later without a schema rewrite — see §8.

---

## 2. Data Model (SQLite)

```
meals
  id (uuid, pk)
  name
  type            -- breakfast | lunch | dinner | snack
  protein_g
  servings
  photo_uri        -- nullable, local file path
  created_at
  updated_at

meal_ingredients
  id (uuid, pk)
  meal_id (fk -> meals)
  name
  quantity
  unit

calendar_entries
  id (uuid, pk)
  date              -- YYYY-MM-DD
  slot              -- breakfast | lunch | dinner | snack
  meal_id (fk -> meals)
  servings_used
  is_leftover       -- bool
  source_entry_id   -- fk -> calendar_entries, nullable (the dinner this lunch came from)
  eaten             -- bool

user_settings
  id (pk, singleton row)
  protein_target_g
  leftover_lunch_enabled
  plan_days
  variety_preference   -- e.g. "balanced_kenyan"

shopping_list_items
  id (uuid, pk)
  name
  category           -- proteins | carbs | vegetables | other
  quantity
  unit
  checked
  list_generated_at
```

`source_entry_id` is what makes "Tuesday's lunch = Monday's dinner leftover" queryable and displayable without duplicating meal data.

---

## 3. Core Modules (mapped to the user journey)

1. **Onboarding wizard** — 3 screens → writes `user_settings`
2. **Plan generator** — heuristic algorithm, not ML (see §4) → writes `calendar_entries`
3. **Calendar / Day view** — today card, protein progress, tap-through to details
4. **Meal library** — CRUD, photo capture + compression, ingredient list
5. **Leftover linker** — on dinner save with servings > 1, auto-creates next day's lunch entry
6. **Shopping list generator** — aggregates ingredients across the remaining planned days, grouped by category, with a checklist state
7. **Protein tracker** — daily sum + rolling weekly view
8. **Mid-week edits** — swap/delete/add entries, everything downstream (protein totals, shopping list) recomputes reactively
9. **Next-week regeneration** — reuses saved settings, avoids exact repeats from the prior week where the library allows it

---

## 4. Plan Generation Algorithm (V1 — deterministic heuristic, no ML)

For each day in the plan window:
1. Pick breakfast + snack + dinner from the meal library, weighted toward hitting `protein_target_g`, avoiding meals already used this week where the pool is large enough.
2. If `leftover_lunch_enabled` and the prior day's dinner had `servings > 1`, lunch = that leftover (auto-linked via `source_entry_id`); otherwise pick a lunch meal normally.
3. Sum protein for the day; carry the running weekly total for the overview screen.

This is intentionally simple for V1 — swappable for a smarter/weighted version later without touching the UI layer, since the UI only depends on `calendar_entries` + repo functions.

---

## 5. Project Structure

```
meal-calendar-app/
├── app.config.ts
├── package.json
├── tsconfig.json
├── babel.config.js
├── assets/
├── src/
│   ├── app/
│   │   ├── RootNavigator.tsx
│   │   └── TabNavigator.tsx
│   ├── screens/
│   │   ├── onboarding/
│   │   │   ├── WelcomeScreen.tsx
│   │   │   ├── ProteinTargetScreen.tsx
│   │   │   ├── LeftoverPrefScreen.tsx
│   │   │   └── PlanDaysScreen.tsx
│   │   ├── calendar/
│   │   │   ├── CalendarScreen.tsx
│   │   │   ├── DayDetailScreen.tsx
│   │   │   └── PlanWizardScreen.tsx
│   │   ├── meals/
│   │   │   ├── MealLibraryScreen.tsx
│   │   │   ├── MealDetailScreen.tsx
│   │   │   └── MealEditorScreen.tsx
│   │   ├── shopping/
│   │   │   └── ShoppingListScreen.tsx
│   │   └── settings/
│   │       └── SettingsScreen.tsx
│   ├── components/
│   │   ├── MealCard.tsx
│   │   ├── ProteinProgressBar.tsx
│   │   ├── DayCell.tsx
│   │   ├── ShoppingListItemRow.tsx
│   │   └── PhotoPicker.tsx
│   ├── data/
│   │   ├── db.ts                    # SQLite connection + init
│   │   ├── migrations/
│   │   │   └── 001_init.sql
│   │   ├── repositories/
│   │   │   ├── mealsRepo.ts
│   │   │   ├── calendarRepo.ts
│   │   │   ├── shoppingRepo.ts
│   │   │   └── settingsRepo.ts
│   │   └── types.ts
│   ├── domain/
│   │   ├── planGenerator.ts
│   │   ├── proteinCalculator.ts
│   │   ├── shoppingAggregator.ts
│   │   └── leftoverLinker.ts
│   ├── store/
│   │   ├── useSettingsStore.ts
│   │   ├── useCalendarStore.ts
│   │   └── useMealsStore.ts
│   ├── services/
│   │   ├── imageService.ts          # capture + compress + save to FileSystem
│   │   └── dateService.ts
│   ├── hooks/
│   │   ├── useProteinToday.ts
│   │   └── useWeeklyProtein.ts
│   └── theme/
│       ├── colors.ts
│       └── typography.ts
├── __tests__/
│   ├── domain/
│   │   ├── planGenerator.test.ts
│   │   └── shoppingAggregator.test.ts
│   └── data/
│       └── mealsRepo.test.ts
└── e2e/                              # optional, Detox
```

`domain/` holds all the logic that doesn't depend on React Native APIs — this is what gets unit-tested directly. `screens/` and `components/` stay thin: they call repos/stores, they don't compute.

---

## 6. Build Phases

| Phase | Scope |
|---|---|
| 0 | Expo project scaffold, navigation shell, SQLite init + migration runner, theme tokens |
| 1 | Onboarding wizard + settings persistence |
| 2 | Meal library CRUD, photo capture/compression, ingredients |
| 3 | Plan generator + calendar view + day detail + protein bar |
| 4 | Leftover linking + daily home flow |
| 5 | Shopping list generation + checklist |
| 6 | Mid-week edits (swap/delete/add) + weekly protein overview |
| 7 | Next-week regeneration avoiding repeats + polish pass |
| 8 (post-V1) | Optional sync backend |

---

## 7. Key Decisions to Flag

- **No auth/multi-device sync in V1** — data lives only on-device. Worth adding a manual JSON export/import early as a backup safety net, since there's no cloud copy.
- **Photos** stay in the app's local FileSystem sandbox; only the relative path is stored in SQLite.
- **UUIDs for all IDs**, even though there's no backend yet — makes a future sync layer a data-sync problem, not a schema-migration problem.

---

## 8. Future Sync Path (not built now, just kept open)

Because IDs are UUIDs and every row has `created_at`/`updated_at`, a later Supabase (or similar) integration can sync by last-write-wins timestamp comparison without renaming or re-keying anything already on-device.
