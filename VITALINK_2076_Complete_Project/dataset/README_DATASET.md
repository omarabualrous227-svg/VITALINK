# VITALINK 2076 — Dataset Documentation

## Included files
- `hospitals.json` / `hospitals.csv`: synthetic hospital readiness, capacity, capabilities, load, distance and ETA values.
- `ambulance_units.json` / `ambulance_units.csv`: demo response-unit definitions and conditional ETA assumptions.
- `emergency_scenarios.json` / `emergency_scenarios.csv`: the 10 Scenario Lab scenarios and expected software-workflow outcomes.
- `demo_cases.json` / `demo_cases.csv`: synthetic preload values used to exercise the workflow.

## Limitations
This is a **synthetic MVP/demo dataset**, not a live operational feed or clinical training dataset. It contains no real patient records. Some hospital labels may refer to a real institution, but all operational metrics shown here are demo values and must not be interpreted as current capacity or readiness.

The unchanged frontend still contains its own default demo values and Scenario Lab definitions. The dataset is included for documentation, spreadsheet review and optional seeding; it is not dynamically loaded by the frontend.

## Optional SQLite seeding
From the project root, stop the running server and run:

```bash
node scripts/seed-demo-state.js
```

This initializes shared state from `hospitals.json` only when the database has no existing state. It refuses to overwrite an existing state.

To intentionally replace the current shared demo state:

```bash
node scripts/seed-demo-state.js --force
```

`--force` overwrites the current shared state and adds a new audit event; it does not erase previous audit events. Back up the SQLite database first if the current state matters. The script refreshes `lastUpdated` at seed time.
