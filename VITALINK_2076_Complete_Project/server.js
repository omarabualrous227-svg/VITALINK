const path=require("path"),http=require("http"),express=require("express");
const {WebSocketServer,WebSocket}=require("ws");
const {openDatabase,readState,writeState,listEvents,listCases}=require("./db");
const PORT=Number(process.env.PORT||8080),HOST=process.env.HOST||"0.0.0.0";
const DB_PATH=process.env.DB_PATH||path.join(__dirname,"data","vitalink.sqlite"),db=openDatabase(DB_PATH);
const app=express();app.disable("x-powered-by");app.use(express.json({limit:"2mb"}));
let wss;
app.get("/api/health",(req,res)=>{const s=readState(db);res.json({ok:true,service:"VITALINK Backend",serverRevision:s.serverRevision,updatedAt:s.updatedAt,websocketClients:wss?.clients?.size||0,database:"sqlite"})});
app.get("/api/state",(req,res)=>res.json(readState(db)));
app.put("/api/state",(req,res)=>{
  const r=writeState(db,{state:req.body?.state,expectedRevision:req.body?.expectedRevision,source:req.body?.source,reason:req.body?.reason});
  if(!r.ok)return res.status(r.status).json(r);
  broadcast({type:"state_updated",serverRevision:r.serverRevision,state:r.state,source:req.body?.source||"unknown",reason:req.body?.reason||"update",ts:Date.now()});
  res.json({ok:true,serverRevision:r.serverRevision,updatedAt:r.updatedAt})
});
app.get("/api/events",(req,res)=>res.json({events:listEvents(db,req.query.limit)}));
app.get("/api/cases",(req,res)=>res.json({cases:listCases(db)}));
app.use(express.static(path.join(__dirname,"public"),{maxAge:0}));
app.use((req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
const server=http.createServer(app);
wss=new WebSocketServer({server,path:"/ws"});
function broadcast(p){const raw=JSON.stringify(p);for(const c of wss.clients)if(c.readyState===WebSocket.OPEN)c.send(raw)}
wss.on("connection",ws=>{const s=readState(db);ws.send(JSON.stringify({type:"hello",serverRevision:s.serverRevision,state:s.state,ts:Date.now()}));ws.on("error",()=>{})});
server.listen(PORT,HOST,()=>{console.log(`VITALINK backend: http://${HOST==="0.0.0.0"?"localhost":HOST}:${PORT}`);console.log(`SQLite: ${DB_PATH}`)});
