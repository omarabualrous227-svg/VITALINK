import {spawn} from "node:child_process";import {mkdtempSync,rmSync,existsSync} from "node:fs";import {tmpdir} from "node:os";import path from "node:path";
const tmp=mkdtempSync(path.join(tmpdir(),"vitalink-test-")),port=18767;
const child=spawn(process.execPath,["server-lite.js"],{cwd:path.resolve("."),env:{...process.env,PORT:String(port),HOST:"127.0.0.1",DB_PATH:path.join(tmp,"test.sqlite")},stdio:["ignore","pipe","pipe"]});
const base=`http://127.0.0.1:${port}`,sleep=ms=>new Promise(r=>setTimeout(r,ms)),assert=(v,m)=>{if(!v)throw new Error(m)};
async function waitHealth(){for(let i=0;i<60;i++){try{const r=await fetch(base+"/api/health");if(r.ok)return await r.json()}catch{}await sleep(100)}throw new Error("server did not start")}
try{
  assert((await waitHealth()).ok,"health");
  const ws=new WebSocket(`ws://127.0.0.1:${port}/ws?client=test`),messages=[];ws.onmessage=e=>messages.push(JSON.parse(e.data));
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject});await sleep(100);assert(messages.some(x=>x.type==="hello"),"ws hello");
  const state={case:{id:"VL-TEST-ABC123",revision:1,status:"RECEIVED_911"},hospitals:[],scenario:null,scenarioFlags:{},scenarioProgress:{},declineReason:"no_beds"};
  let r=await fetch(base+"/api/state",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({state,expectedRevision:0,source:"integration-test",reason:"first"})}),j=await r.json();
  assert(r.status===200&&j.serverRevision===1,"first write");await sleep(100);assert(messages.some(x=>x.type==="state_updated"&&x.serverRevision===1),"ws broadcast");
  r=await fetch(base+"/api/state");j=await r.json();assert(j.serverRevision===1&&j.state.case.id==="VL-TEST-ABC123","read");
  r=await fetch(base+"/api/state",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({state,expectedRevision:0,source:"stale",reason:"conflict"})});j=await r.json();assert(r.status===409&&j.serverRevision===1,"conflict");
  state.case.revision=2;state.case.status="DISPATCHED";
  r=await fetch(base+"/api/state",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({state,expectedRevision:1,source:"integration-test",reason:"second"})});j=await r.json();assert(r.status===200&&j.serverRevision===2,"second write");
  r=await fetch(base+"/api/events?limit=10");j=await r.json();assert(j.events.length===2,"events");
  r=await fetch(base+"/api/cases");j=await r.json();assert(j.cases.some(x=>x.case_id==="VL-TEST-ABC123"),"cases");
  assert(existsSync(path.join(tmp,"test.sqlite")),"db");
  console.log("PASS health\nPASS SQLite persistence\nPASS REST state sync\nPASS revision conflict protection\nPASS WebSocket broadcast\nPASS audit events\nPASS case history");
  ws.close()
}finally{child.kill("SIGTERM");await sleep(100);rmSync(tmp,{recursive:true,force:true})}
