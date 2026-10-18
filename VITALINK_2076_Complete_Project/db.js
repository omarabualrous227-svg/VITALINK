const { DatabaseSync } = require("node:sqlite");
const path=require("path"),fs=require("fs");
function openDatabase(dbPath){
  fs.mkdirSync(path.dirname(dbPath),{recursive:true});
  const db=new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA synchronous=NORMAL;
    CREATE TABLE IF NOT EXISTS state_store(
      id INTEGER PRIMARY KEY CHECK(id=1),
      server_revision INTEGER NOT NULL,
      state_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_events(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id TEXT,
      case_revision INTEGER,
      server_revision INTEGER NOT NULL,
      source TEXT,
      reason TEXT,
      created_at TEXT NOT NULL,
      state_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sync_events_case ON sync_events(case_id,id DESC);
  `);
  return db
}
function readState(db){
  const row=db.prepare("SELECT server_revision,state_json,updated_at FROM state_store WHERE id=1").get();
  if(!row)return {serverRevision:0,state:null,updatedAt:null};
  let state=null;try{state=JSON.parse(row.state_json)}catch(e){}
  return {serverRevision:Number(row.server_revision||0),state,updatedAt:row.updated_at}
}
function validateState(state){
  if(!state||typeof state!=="object")return "state must be an object";
  if(!state.case||typeof state.case!=="object")return "state.case is required";
  if(!Array.isArray(state.hospitals))return "state.hospitals must be an array";
  if(JSON.stringify(state).length>1500000)return "state payload is too large";
  return null
}
function writeState(db,{state,expectedRevision,source="unknown",reason="update"}){
  const err=validateState(state);if(err)return {ok:false,status:400,error:err};
  const current=readState(db);
  if(Number(expectedRevision)!==Number(current.serverRevision))return {ok:false,status:409,error:"revision_conflict",...current};
  const nextRevision=current.serverRevision+1,now=new Date().toISOString(),raw=JSON.stringify(state);
  db.exec("BEGIN IMMEDIATE");
  try{
    db.prepare(`INSERT INTO state_store(id,server_revision,state_json,updated_at) VALUES(1,?,?,?)
      ON CONFLICT(id) DO UPDATE SET server_revision=excluded.server_revision,state_json=excluded.state_json,updated_at=excluded.updated_at`).run(nextRevision,raw,now);
    db.prepare(`INSERT INTO sync_events(case_id,case_revision,server_revision,source,reason,created_at,state_json) VALUES(?,?,?,?,?,?,?)`).run(
      String(state.case?.id||"PENDING"),Number(state.case?.revision||0),nextRevision,String(source||"unknown").slice(0,120),String(reason||"update").slice(0,160),now,raw
    );
    db.exec("COMMIT")
  }catch(e){db.exec("ROLLBACK");throw e}
  return {ok:true,status:200,serverRevision:nextRevision,state,updatedAt:now}
}
function listEvents(db,limit=50){
  const safe=Math.max(1,Math.min(200,Number(limit)||50));
  return db.prepare(`SELECT id,case_id,case_revision,server_revision,source,reason,created_at FROM sync_events ORDER BY id DESC LIMIT ?`).all(safe)
}
function listCases(db){
  return db.prepare(`SELECT case_id,MAX(case_revision) case_revision,MAX(server_revision) server_revision,MAX(created_at) updated_at,COUNT(*) event_count FROM sync_events GROUP BY case_id ORDER BY MAX(id) DESC LIMIT 100`).all()
}
module.exports={openDatabase,readState,writeState,listEvents,listCases};
