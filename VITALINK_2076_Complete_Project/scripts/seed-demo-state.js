const path = require("node:path");
const fs = require("node:fs");
const { openDatabase, readState, writeState } = require("../db");
const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "data", "vitalink.sqlite");
const datasetPath = path.join(__dirname, "..", "dataset", "hospitals.json");
const force = process.argv.includes("--force");
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const db = openDatabase(dbPath);
try {
  const current = readState(db);
  if (current.state && !force) {
    console.error("A VITALINK state already exists. Nothing was changed.");
    console.error("To replace the current shared demo state intentionally, run with --force.");
    process.exitCode = 2;
  } else {
    const now = Date.now();
    const hospitals = dataset.records.map(h => ({ ...h, lastUpdated: now }));
    const state = {
      lang: "en", screen: "patient", analysisStage: 0, toast: null,
      declineReason: "no_beds", scenario: null,
      scenarioFlags: { gpsDenied: false, unit03Busy: false }, scenarioProgress: {},
      case: {
        id: "PENDING", revision: 0, name: "", age: "", requestFor: "self", location: "",
        emergency: "chest", notes: "", created: false, assigned: false, status: "DRAFT",
        ambulance: "Unit 03", vitals: { bp: "", hr: "", spo2: "", temp: "", rr: "", con: "alert" },
        selected: null, readinessRequest: null, hospitalConfirmed: false, lastRecommendation: null,
        override: null, recommendationChange: null, routeAlert: null,
        prearrival: { team: false, bay: false, monitor: false },
        milestones: { enroute: null, arrived: null, handoff: null, closed: null },
        handoffBriefAt: null, handoffNote: "", timeline: []
      },
      hospitals
    };
    const result = writeState(db, { state, expectedRevision: current.serverRevision, source: "dataset-seed", reason: force ? "seed-demo-state-force" : "seed-demo-state" });
    if (!result.ok) { console.error(`Dataset seed failed: ${result.error || "unknown error"}`); process.exitCode = 1; }
    else {
      console.log("VITALINK demo dataset loaded into SQLite.");
      console.log(`Database: ${dbPath}`);
      console.log(`Hospitals seeded: ${hospitals.length}`);
      console.log(`Server revision: ${result.serverRevision}`);
      console.log("All values are synthetic demo data; no frontend file was modified.");
    }
  }
} finally { db.close(); }
