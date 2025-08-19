# IMDB

## Tech choices

- App runtime: Expo SDK
- Routing: expo-router
- UI: react-native-paper
- Icons: expo/vector-icons
- Charts: react-native-svg + victory-native
- Local DB: expo-sqlite
- State: zustand
- Forms/Validation: react-hook-form
- Dates: dayjs
- File/Share: expo-file-system, expo-sharing (for CSV export)
- Notifications: expo-notifications
- Telemetry & crash: sentry-expo (tbd)
- Theming: Light/Dark with paper's theme

## MVP scope

1. Add/View transactions (amount, date, account, category, note)
2. Auto-categorize based on payee/keywords
3. Budgets per category (monthly) with progress bars
4. Simple analytics: sped by category, month trnd line
5. Local-only storage; csv import/export

Stretch (later)

- Recurring transactions, multi-currency, receipt scanning (OCR), cloud sync, bank agregation

## Data Model (SQLite)

- accounts(id, name, type, currency, created_at)
- categories (id, name, type CHECK(type IN ('expense', 'income')), icon, color, created_at)
- transactions(id, account_id, category_id, amount REAL, currency, date ISO, payee, note, created_at)
- budgets (id, category_id, period_start ISO, period_end ISO, amount REAL, created_at)
- rules (id, patternt TEXT, cattegory_id, priority INT)
- app_meta(k TEXT PRIMARY KEY, v TEXT)

## Milestones

### M1 - Database & Migrations

- [ ] Initialize SQLite and run the schema
- [ ] Write migration helper (store `schema_version` in `app_meta`)
- [ ] Implement DAL functions:
  - insert transaction, list transactions({month, category, account search})
  - upsetCategory, list categories, upsetBudget, list budgets
  - applyRulesFor(txn)

### M2 - Transactions UX

- [ ] Transactions List: infinite scroll, month filter, search, pull-to-refresh
- [ ] Add/Edit Txn Form: amount keypad, date picker, account/category picker, rule preview
- [ ] Quick Add: FAB opens bottom sheet with minimal fields
- [ ] Auto-categorize: on save, test rules; allow override

### M3 - Categories & Budgets

- [ ] Categories screen: CRUD, color & icon picker, type (expense/income)
- [ ] Budgets screen: create monthly budget per category; show usage progress
- [ ] Budget calculations: sum of txns by category within period

### M4 - Analytics

- [ ] Spend by category (pie) for selected month
- [ ] Monthly trend (line) last 6–12 months
- [ ] Top merchants list

### M5 - Import/Export

- [ ] CSV export of transactions (month/all) to Files/Share
- [ ] CSV import: mapping wizard (date, amount, payee, category); preview & bulk insert
- [ ] Duplicate detection (hash date+amount+payee)

### M6 - Notifications

- [ ] Expo Notifications: monthly budget reminders (1st and 25th), weekly “review your spend”
- [ ] Empty states, helpful tooltips, undo snackbars
- [ ] Error boundaries (nice fallback UI), global toast system

### M7 - Hardening & Release

- [ ] Unit tests for utils (money, date, CSV, rules)
- [ ] Snapshot tests for key components
- [ ] EAS Update (OTA) setup; app icons/splash; store build config

## QA checklist

- [ ] Add 30 fake txns via a debug screen; verify totals vs manual spreadsheet.
- [ ] Edge cases: negative amounts (refunds), future dates, empty budgets.
- [ ] Performance: 5k transactions smooth scroll; monthly aggregations <100ms.
- [ ] Dark mode legibility; accessible tap targets; large text setting works.
- [ ] Detox/E2E (stretch): “Add txn → appears in list → affects budget”.
