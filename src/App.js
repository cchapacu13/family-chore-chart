import { useState, useEffect, useCallback } from "react";

const defaultChores = [
  { id: 1, name: "Make bed", pay: 0.25, assignedTo: "both" },
  { id: 2, name: "Clean room", pay: 0.75, assignedTo: "both" },
  { id: 3, name: "Water plants", pay: 0.25, assignedTo: "both" },
  { id: 4, name: "Feed pets", pay: 0.25, assignedTo: "both" },
  { id: 5, name: "Wash pet bowls", pay: 0.50, assignedTo: "both" },
  { id: 6, name: "Wipe table after meals", pay: 0.25, assignedTo: "chrisjr" },
  { id: 7, name: "Put away toys", pay: 0.25, assignedTo: "chrisjr" },
  { id: 8, name: "Take out trash", pay: 0.50, assignedTo: "amelia" },
  { id: 9, name: "Sweep/vacuum a room", pay: 0.50, assignedTo: "amelia" },
  { id: 10, name: "Unload dishwasher", pay: 0.50, assignedTo: "amelia" },
  { id: 11, name: "Fold laundry", pay: 0.50, assignedTo: "both" },
  { id: 12, name: "Wipe bathroom sink", pay: 0.25, assignedTo: "both" },
];

const KIDS = ["chrisjr", "amelia"];
const KID_LABELS = { chrisjr: "Chris Jr", amelia: "Amelia" };
const KID_COLORS = { chrisjr: "#f59e0b", amelia: "#3b82f6" };
const PARENT_PIN = "2014";
const KID_PIN = "0000";

function formatDollars(amt) { return `$${Number(amt).toFixed(2)}`; }
function formatTime(ts) {
  return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// ── API helpers ──────────────────────────────────────────────────────────────
async function apiGet(key) {
  try {
    const res = await fetch(`/api/store?key=${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.value ?? null;
  } catch { return null; }
}

async function apiSet(key, value) {
  try {
    await fetch("/api/store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  } catch {}
}

// ── PIN Modal ────────────────────────────────────────────────────────────────
function PinModal({ title, subtitle, onSuccess, onCancel, validate }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function handleKey(k) {
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (validate(next)) { onSuccess(); }
        else { setError("Incorrect PIN. Try again."); setPin(""); }
      }, 150);
    }
  }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:"linear-gradient(135deg,#1e1b4b,#312e81)",border:"2px solid rgba(255,255,255,0.15)",borderRadius:20,padding:"32px 28px",maxWidth:320,width:"100%",textAlign:"center" }}>
        <div style={{ fontSize:36,marginBottom:8 }}>🔒</div>
        <h2 style={{ margin:"0 0 4px",color:"#f1f5f9",fontSize:20 }}>{title}</h2>
        <p style={{ color:"#64748b",fontSize:13,margin:"0 0 24px" }}>{subtitle}</p>
        <div style={{ display:"flex",justifyContent:"center",gap:12,marginBottom:24 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:16,height:16,borderRadius:"50%",border:"2px solid #475569",background:pin.length>i?"#fbbf24":"transparent",transition:"background 0.15s" }} />
          ))}
        </div>
        {error && <p style={{ color:"#ef4444",fontSize:13,margin:"-12px 0 16px" }}>{error}</p>}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16 }}>
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k,i) => (
            <button key={i} onClick={() => k==="⌫" ? setPin(p=>p.slice(0,-1)) : k && handleKey(k)}
              style={{ padding:"14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",background:k?"rgba(255,255,255,0.08)":"transparent",color:"#f1f5f9",fontSize:18,fontWeight:"bold",cursor:k?"pointer":"default",fontFamily:"inherit" }}>
              {k}
            </button>
          ))}
        </div>
        <button onClick={onCancel} style={{ width:"100%",padding:"10px",borderRadius:10,border:"none",background:"rgba(255,255,255,0.08)",color:"#94a3b8",cursor:"pointer",fontFamily:"inherit",fontWeight:"bold" }}>Cancel</button>
      </div>
    </div>
  );
}

// ── Sync status badge ────────────────────────────────────────────────────────
function SyncBadge({ status }) {
  const cfg = {
    syncing: { color:"#fbbf24", label:"Syncing…" },
    synced:  { color:"#22c55e", label:"Saved" },
    error:   { color:"#ef4444", label:"Offline" },
    idle:    { color:"#475569", label:"" },
  }[status] || {};
  if (!cfg.label) return null;
  return (
    <span style={{ fontSize:11,color:cfg.color,marginLeft:8 }}>● {cfg.label}</span>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("tracker");
  const [chores, setChores] = useState(defaultChores);
  const [counts, setCounts] = useState({});
  const [log, setLog] = useState([]);
  const [selectedKid, setSelectedKid] = useState("chrisjr");
  const [showCashOutConfirm, setShowCashOutConfirm] = useState(false);
  const [cashOutSummary, setCashOutSummary] = useState(null);
  const [lastCashOut, setLastCashOut] = useState(null);
  const [pinModal, setPinModal] = useState(null);
  const [role, setRole] = useState("kid");
  const [logFilter, setLogFilter] = useState("all");
  const [editingChore, setEditingChore] = useState(null);
  const [newChore, setNewChore] = useState({ name:"", pay:"", assignedTo:"both" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [loaded, setLoaded] = useState(false);

  // ── Load from API on mount ──
  useEffect(() => {
    async function loadAll() {
      const [c, cn, lg, lco] = await Promise.all([
        apiGet("chores"), apiGet("counts"), apiGet("log"), apiGet("lastCashOut")
      ]);
      if (c) setChores(c);
      if (cn) setCounts(cn);
      if (lg) setLog(lg);
      if (lco) setLastCashOut(lco);
      setLoaded(true);
    }
    loadAll();
    // Poll for updates every 15 seconds so other devices stay in sync
    const interval = setInterval(async () => {
      const [cn, lg] = await Promise.all([apiGet("counts"), apiGet("log")]);
      if (cn) setCounts(cn);
      if (lg) setLog(lg);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // ── Save helpers ──
  const saveData = useCallback(async (key, value) => {
    setSyncStatus("syncing");
    await apiSet(key, value);
    setSyncStatus("synced");
    setTimeout(() => setSyncStatus("idle"), 2000);
  }, []);

  function getCount(choreId, kid) { return counts[`${choreId}-${kid}`] || 0; }

  async function changeCount(choreId, kid, delta) {
    const key = `${choreId}-${kid}`;
    const current = counts[key] || 0;
    const next = Math.max(0, current + delta);
    const newCounts = { ...counts, [key]: next };
    setCounts(newCounts);
    const chore = chores.find(c => c.id === choreId);
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      kid, choreName: chore?.name || "",
      choreId, action: delta > 0 ? "added" : "removed",
      count: next, pay: chore?.pay || 0,
    };
    const newLog = [entry, ...log];
    setLog(newLog);
    await Promise.all([saveData("counts", newCounts), saveData("log", newLog)]);
  }

  function getKidChores(kid) { return chores.filter(c => c.assignedTo===kid || c.assignedTo==="both"); }
  function getEarnings(kid) { return getKidChores(kid).reduce((s,c)=>s+(getCount(c.id,kid)*c.pay),0); }

  async function handleCashOut() {
    const summary = {
      date: new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),
      chrisjr: getEarnings("chrisjr"), amelia: getEarnings("amelia"),
    };
    summary.total = summary.chrisjr + summary.amelia;
    const cashEntry = { id:Date.now(),timestamp:Date.now(),kid:"all",choreName:"💵 CASH OUT",choreId:null,action:"cashout",count:0,pay:summary.total };
    const newLog = [cashEntry, ...log];
    const newCounts = {};
    setCashOutSummary(summary);
    setLastCashOut(summary.date);
    setCounts(newCounts);
    setLog(newLog);
    setShowCashOutConfirm(false);
    await Promise.all([
      saveData("counts", newCounts),
      saveData("log", newLog),
      saveData("lastCashOut", summary.date),
    ]);
  }

  async function saveChores(updated) {
    setChores(updated);
    await saveData("chores", updated);
  }

  function saveEdit(chore) { saveChores(chores.map(c=>c.id===chore.id?chore:c)); setEditingChore(null); }
  function deleteChore(id) { saveChores(chores.filter(c=>c.id!==id)); }
  function addChore() {
    if (!newChore.name||!newChore.pay) return;
    saveChores([...chores,{id:Date.now(),name:newChore.name,pay:parseFloat(newChore.pay),assignedTo:newChore.assignedTo}]);
    setNewChore({name:"",pay:"",assignedTo:"both"});
    setShowAddForm(false);
  }

  function requireParent(action) {
    if (role==="parent") { action(); return; }
    setPinModal({ purpose:"Parent PIN Required", subtitle:"Enter the parent PIN to continue.", validate:p=>p===PARENT_PIN, onSuccess:()=>{ setRole("parent"); setPinModal(null); action(); }});
  }
  function switchToKid() {
    setPinModal({ purpose:"Kid Mode", subtitle:"Enter the kid PIN to switch.", validate:p=>p===KID_PIN, onSuccess:()=>{ setRole("kid"); setPinModal(null); }});
  }

  const kidChores = getKidChores(selectedKid);
  const earned = getEarnings(selectedKid);
  const filteredLog = logFilter==="all" ? log : log.filter(e=>e.kid===logFilter||(logFilter==="cashout"&&e.action==="cashout"));

  if (!loaded) return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#1e1b4b,#312e81)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,color:"#a5b4fc",fontFamily:"Georgia,serif" }}>
      <div style={{ fontSize:40 }}>🏠</div>
      <div style={{ fontSize:16 }}>Loading chore chart…</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%)",fontFamily:"'Georgia',serif",color:"#f8fafc",padding:"0 0 80px" }}>

      {pinModal && <PinModal title={pinModal.purpose} subtitle={pinModal.subtitle} validate={pinModal.validate} onSuccess={pinModal.onSuccess} onCancel={()=>setPinModal(null)} />}

      {/* Cash Out Success */}
      {cashOutSummary && (
        <div style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div style={{ background:"linear-gradient(135deg,#1e1b4b,#312e81)",border:"2px solid #fbbf24",borderRadius:20,padding:"32px 28px",maxWidth:360,width:"100%",textAlign:"center",boxShadow:"0 0 60px rgba(251,191,36,0.3)" }}>
            <div style={{ fontSize:48,marginBottom:8 }}>💰</div>
            <h2 style={{ margin:"0 0 4px",color:"#fbbf24",fontSize:22 }}>Cash Out Complete!</h2>
            <p style={{ color:"#a5b4fc",fontSize:13,margin:"0 0 24px" }}>{cashOutSummary.date}</p>
            {KIDS.map(kid=>(
              <div key={kid} style={{ display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ color:KID_COLORS[kid],fontWeight:"bold" }}>{KID_LABELS[kid]}</span>
                <span style={{ color:"#f1f5f9",fontWeight:"bold",fontSize:18 }}>{formatDollars(cashOutSummary[kid])}</span>
              </div>
            ))}
            <div style={{ display:"flex",justifyContent:"space-between",padding:"14px 0 0",marginBottom:24 }}>
              <span style={{ color:"#fbbf24",fontWeight:"bold" }}>Total Paid Out</span>
              <span style={{ color:"#fbbf24",fontWeight:"bold",fontSize:20 }}>{formatDollars(cashOutSummary.total)}</span>
            </div>
            <button onClick={()=>setCashOutSummary(null)} style={{ width:"100%",padding:"12px",borderRadius:12,border:"none",background:"#fbbf24",color:"#1e1b4b",fontWeight:"bold",fontSize:15,cursor:"pointer",fontFamily:"inherit" }}>Done ✓</button>
          </div>
        </div>
      )}

      {/* Cash Out Confirm */}
      {showCashOutConfirm && (
        <div style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div style={{ background:"linear-gradient(135deg,#1e1b4b,#312e81)",border:"2px solid #22c55e",borderRadius:20,padding:"28px 24px",maxWidth:340,width:"100%",textAlign:"center" }}>
            <div style={{ fontSize:40,marginBottom:8 }}>💵</div>
            <h2 style={{ margin:"0 0 8px",color:"#22c55e",fontSize:20 }}>Ready to Cash Out?</h2>
            <p style={{ color:"#94a3b8",fontSize:14,margin:"0 0 20px" }}>This resets all chore counts after recording earnings.</p>
            <div style={{ marginBottom:20 }}>
              {KIDS.map(kid=>(
                <div key={kid} style={{ display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ color:KID_COLORS[kid] }}>{KID_LABELS[kid]}</span>
                  <span style={{ color:"#f1f5f9",fontWeight:"bold" }}>{formatDollars(getEarnings(kid))}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setShowCashOutConfirm(false)} style={{ flex:1,padding:"11px",borderRadius:10,border:"none",background:"rgba(255,255,255,0.1)",color:"#94a3b8",cursor:"pointer",fontFamily:"inherit",fontWeight:"bold" }}>Cancel</button>
              <button onClick={handleCashOut} style={{ flex:1,padding:"11px",borderRadius:10,border:"none",background:"#22c55e",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:"bold",fontSize:14 }}>Pay Out 💰</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign:"center",padding:"28px 20px 0" }}>
        <div style={{ fontSize:34,marginBottom:4 }}>🏠</div>
        <h1 style={{ margin:0,fontSize:26,fontWeight:"bold",color:"#fbbf24",textShadow:"0 2px 8px rgba(251,191,36,0.3)" }}>
          Family Chore Chart <SyncBadge status={syncStatus} />
        </h1>
        <p style={{ margin:"4px 0 0",color:"#a5b4fc",fontSize:13 }}>Teaching responsibility, one chore at a time</p>
        {lastCashOut && <p style={{ margin:"2px 0 0",color:"#475569",fontSize:11 }}>Last cash out: {lastCashOut}</p>}
        <div style={{ marginTop:10,display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.07)",borderRadius:999,padding:"6px 14px",border:"1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ fontSize:12,color:role==="parent"?"#fbbf24":"#94a3b8" }}>
            {role==="parent"?"👑 Parent Mode":"👦 Kid Mode"}
          </span>
          <button onClick={()=>role==="parent"?switchToKid():requireParent(()=>{})} style={{ fontSize:11,color:"#6366f1",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0,textDecoration:"underline" }}>
            {role==="parent"?"Switch to Kid":"Parent Login"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",justifyContent:"center",gap:6,margin:"20px 16px 0",flexWrap:"wrap" }}>
        {[
          {key:"tracker",label:"📅 Tracker"},
          {key:"log",label:"📋 Log"},
          ...(role==="parent"?[{key:"manage",label:"⚙️ Manage"}]:[]),
        ].map(t=>(
          <button key={t.key} onClick={()=>t.key==="manage"?requireParent(()=>setTab("manage")):setTab(t.key)} style={{
            padding:"9px 22px",borderRadius:999,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:"bold",transition:"all 0.2s",
            background:tab===t.key?"#fbbf24":"rgba(255,255,255,0.1)",
            color:tab===t.key?"#1e1b4b":"#e2e8f0",
            boxShadow:tab===t.key?"0 4px 14px rgba(251,191,36,0.4)":"none",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── TRACKER ── */}
      {tab==="tracker" && (
        <div style={{ maxWidth:600,margin:"20px auto 0",padding:"0 16px" }}>
          <div style={{ display:"flex",gap:10,marginBottom:18 }}>
            {KIDS.map(kid=>(
              <button key={kid} onClick={()=>setSelectedKid(kid)} style={{ flex:1,padding:"11px",borderRadius:14,border:`2px solid ${selectedKid===kid?KID_COLORS[kid]:"transparent"}`,background:selectedKid===kid?`${KID_COLORS[kid]}22`:"rgba(255,255,255,0.07)",color:selectedKid===kid?KID_COLORS[kid]:"#94a3b8",cursor:"pointer",fontFamily:"inherit",fontSize:15,fontWeight:"bold",transition:"all 0.2s" }}>{KID_LABELS[kid]}</button>
            ))}
          </div>

          <div style={{ background:"rgba(255,255,255,0.08)",borderRadius:18,padding:"18px 22px",marginBottom:18,border:`1px solid ${KID_COLORS[selectedKid]}44` }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13,color:"#94a3b8",marginBottom:4 }}>Current Earnings</div>
                <div style={{ fontSize:34,fontWeight:"bold",color:KID_COLORS[selectedKid] }}>{formatDollars(earned)}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13,color:"#64748b" }}>Completed</div>
                <div style={{ fontSize:22,fontWeight:"bold",color:"#fbbf24" }}>{kidChores.reduce((s,c)=>s+getCount(c.id,selectedKid),0)} tasks</div>
              </div>
            </div>
          </div>

          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {kidChores.map(chore=>{
              const count=getCount(chore.id,selectedKid);
              return (
                <div key={chore.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderRadius:14,background:count>0?`${KID_COLORS[selectedKid]}18`:"rgba(255,255,255,0.06)",border:`1.5px solid ${count>0?KID_COLORS[selectedKid]:"rgba(255,255,255,0.08)"}`,transition:"all 0.2s" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15,color:count>0?"#f1f5f9":"#94a3b8",fontWeight:count>0?"600":"400" }}>{chore.name}</div>
                    <div style={{ fontSize:12,color:"#475569",marginTop:2 }}>{formatDollars(chore.pay)} each</div>
                  </div>
                  {count>0 && <span style={{ fontSize:13,color:"#fbbf24",fontWeight:"bold",minWidth:52,textAlign:"center" }}>{formatDollars(count*chore.pay)}</span>}
                  {role==="parent" ? (
                    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <button onClick={()=>changeCount(chore.id,selectedKid,-1)} disabled={count===0} style={{ width:32,height:32,borderRadius:8,border:"none",background:count>0?"#ef444433":"rgba(255,255,255,0.05)",color:count>0?"#ef4444":"#374151",cursor:count>0?"pointer":"default",fontSize:18,fontWeight:"bold",display:"flex",alignItems:"center",justifyContent:"center" }}>−</button>
                      <span style={{ minWidth:22,textAlign:"center",fontSize:17,fontWeight:"bold",color:count>0?KID_COLORS[selectedKid]:"#475569" }}>{count}</span>
                      <button onClick={()=>changeCount(chore.id,selectedKid,1)} style={{ width:32,height:32,borderRadius:8,border:"none",background:`${KID_COLORS[selectedKid]}33`,color:KID_COLORS[selectedKid],cursor:"pointer",fontSize:18,fontWeight:"bold",display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
                    </div>
                  ) : (
                    <span style={{ minWidth:22,textAlign:"center",fontSize:17,fontWeight:"bold",color:count>0?KID_COLORS[selectedKid]:"#475569" }}>{count}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop:22,background:"rgba(255,255,255,0.05)",borderRadius:14,padding:"14px 18px",border:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize:11,color:"#64748b",marginBottom:10,fontWeight:"bold",letterSpacing:"0.05em",textTransform:"uppercase" }}>Summary — Both Kids</div>
            {KIDS.map(kid=>(
              <div key={kid} style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                <span style={{ color:KID_COLORS[kid],fontSize:14 }}>{KID_LABELS[kid]}</span>
                <span style={{ color:"#f1f5f9",fontSize:14 }}>{formatDollars(getEarnings(kid))}</span>
              </div>
            ))}
            <div style={{ borderTop:"1px solid rgba(255,255,255,0.08)",marginTop:8,paddingTop:8,display:"flex",justifyContent:"space-between" }}>
              <span style={{ color:"#fbbf24",fontWeight:"bold",fontSize:14 }}>Total to Pay Out</span>
              <span style={{ color:"#fbbf24",fontWeight:"bold",fontSize:14 }}>{formatDollars(KIDS.reduce((s,k)=>s+getEarnings(k),0))}</span>
            </div>
          </div>

          {role==="parent" ? (
            <button onClick={()=>setShowCashOutConfirm(true)} style={{ width:"100%",marginTop:14,padding:"15px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#16a34a,#22c55e)",color:"#fff",fontWeight:"bold",fontSize:16,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 20px rgba(34,197,94,0.35)" }}>💵 Cash Out</button>
          ) : (
            <div style={{ marginTop:14,textAlign:"center",color:"#475569",fontSize:13 }}>Cash out requires parent login</div>
          )}
        </div>
      )}

      {/* ── LOG ── */}
      {tab==="log" && (
        <div style={{ maxWidth:600,margin:"20px auto 0",padding:"0 16px" }}>
          <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" }}>
            {[["all","All"],["chrisjr","Chris Jr"],["amelia","Amelia"],["cashout","Cash Outs"]].map(([val,label])=>(
              <button key={val} onClick={()=>setLogFilter(val)} style={{ padding:"6px 16px",borderRadius:999,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:"bold",background:logFilter===val?"#6366f1":"rgba(255,255,255,0.08)",color:logFilter===val?"#fff":"#94a3b8" }}>{label}</button>
            ))}
          </div>
          {filteredLog.length===0 ? (
            <div style={{ textAlign:"center",color:"#475569",padding:"40px 0",fontSize:15 }}>No activity yet</div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {filteredLog.map(entry=>(
                <div key={entry.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:12,background:entry.action==="cashout"?"rgba(34,197,94,0.1)":entry.action==="added"?"rgba(255,255,255,0.06)":"rgba(239,68,68,0.07)",border:`1px solid ${entry.action==="cashout"?"#22c55e33":entry.action==="added"?"rgba(255,255,255,0.07)":"#ef444422"}` }}>
                  <span style={{ fontSize:20 }}>{entry.action==="cashout"?"💰":entry.action==="added"?"✅":"↩️"}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14,color:"#f1f5f9",fontWeight:"500" }}>{entry.choreName}</div>
                    <div style={{ fontSize:12,color:"#64748b",marginTop:2 }}>
                      {entry.action!=="cashout" && <span style={{ color:KID_COLORS[entry.kid],marginRight:6 }}>{KID_LABELS[entry.kid]}</span>}
                      {entry.action==="added"?`Added · count → ${entry.count}`:entry.action==="removed"?`Removed · count → ${entry.count}`:`Total paid: ${formatDollars(entry.pay)}`}
                    </div>
                  </div>
                  <span style={{ fontSize:11,color:"#475569",textAlign:"right",flexShrink:0 }}>{formatTime(entry.timestamp)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MANAGE ── */}
      {tab==="manage" && role==="parent" && (
        <div style={{ maxWidth:600,margin:"20px auto 0",padding:"0 16px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
            <h2 style={{ margin:0,fontSize:18,color:"#e2e8f0" }}>All Chores</h2>
            <button onClick={()=>setShowAddForm(v=>!v)} style={{ padding:"8px 16px",borderRadius:999,border:"none",background:"#fbbf24",color:"#1e1b4b",fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",fontSize:13 }}>
              {showAddForm?"✕ Cancel":"+ Add Chore"}
            </button>
          </div>
          {showAddForm && (
            <div style={{ background:"rgba(251,191,36,0.08)",border:"1.5px solid #fbbf24",borderRadius:14,padding:"14px",marginBottom:14 }}>
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                <input placeholder="Chore name" value={newChore.name} onChange={e=>setNewChore(p=>({...p,name:e.target.value}))} style={inputStyle} />
                <div style={{ display:"flex",gap:8 }}>
                  <input placeholder="Pay ($0.25)" value={newChore.pay} onChange={e=>setNewChore(p=>({...p,pay:e.target.value}))} type="number" step="0.25" style={{ ...inputStyle,flex:1 }} />
                  <select value={newChore.assignedTo} onChange={e=>setNewChore(p=>({...p,assignedTo:e.target.value}))} style={{ ...inputStyle,flex:1 }}>
                    <option value="both">Both Kids</option>
                    <option value="chrisjr">Chris Jr</option>
                    <option value="amelia">Amelia</option>
                  </select>
                </div>
                <button onClick={addChore} style={{ padding:"10px",borderRadius:10,border:"none",background:"#fbbf24",color:"#1e1b4b",fontWeight:"bold",cursor:"pointer",fontFamily:"inherit",fontSize:14 }}>Add Chore</button>
              </div>
            </div>
          )}
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {chores.map(chore=>(
              <div key={chore.id}>
                {editingChore?.id===chore.id ? (
                  <div style={{ background:"rgba(99,102,241,0.15)",border:"1.5px solid #6366f1",borderRadius:14,padding:"14px" }}>
                    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                      <input value={editingChore.name} onChange={e=>setEditingChore(p=>({...p,name:e.target.value}))} style={inputStyle} />
                      <div style={{ display:"flex",gap:8 }}>
                        <input value={editingChore.pay} onChange={e=>setEditingChore(p=>({...p,pay:parseFloat(e.target.value)||0}))} type="number" step="0.25" style={{ ...inputStyle,flex:1 }} />
                        <select value={editingChore.assignedTo} onChange={e=>setEditingChore(p=>({...p,assignedTo:e.target.value}))} style={{ ...inputStyle,flex:1 }}>
                          <option value="both">Both Kids</option>
                          <option value="chrisjr">Chris Jr</option>
                          <option value="amelia">Amelia</option>
                        </select>
                      </div>
                      <div style={{ display:"flex",gap:8 }}>
                        <button onClick={()=>saveEdit(editingChore)} style={{ flex:1,padding:"8px",borderRadius:8,border:"none",background:"#6366f1",color:"#fff",fontWeight:"bold",cursor:"pointer",fontFamily:"inherit" }}>Save</button>
                        <button onClick={()=>setEditingChore(null)} style={{ flex:1,padding:"8px",borderRadius:8,border:"none",background:"rgba(255,255,255,0.1)",color:"#94a3b8",cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderRadius:14,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15,color:"#f1f5f9" }}>{chore.name}</div>
                      <div style={{ fontSize:12,color:"#64748b",marginTop:2 }}>{chore.assignedTo==="both"?"Both kids":KID_LABELS[chore.assignedTo]}</div>
                    </div>
                    <span style={{ color:"#fbbf24",fontWeight:"bold",fontSize:15,marginRight:8 }}>{formatDollars(chore.pay)}</span>
                    <button onClick={()=>setEditingChore({...chore})} style={iconBtn("#6366f1")}>✏️</button>
                    <button onClick={()=>deleteChore(chore.id)} style={iconBtn("#ef4444")}>🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding:"10px 14px",borderRadius:10,border:"1.5px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.08)",color:"#f1f5f9",fontFamily:"inherit",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box" };
function iconBtn(color) { return { width:34,height:34,borderRadius:8,border:`1px solid ${color}44`,background:`${color}22`,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }; }
