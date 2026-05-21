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
const PARENT_PIN = "2014";
const KID_PIN = "0000";

// ── Kid themes ───────────────────────────────────────────────────────────────
const KID_THEMES = {
  chrisjr: {
    soccer: {
      primary: "#16a34a",
      secondary: "#15803d",
      accent: "#bbf7d0",
      bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      cardBg: "#ffffff",
      emoji: "⚽",
      sport: "Soccer",
      headerBg: "linear-gradient(135deg, #16a34a, #15803d)",
      tabActive: "#16a34a",
      btnPlus: "#16a34a",
      btnMinus: "#ef4444",
      badge: "#dcfce7",
      badgeText: "#15803d",
    },
    basketball: {
      primary: "#ea580c",
      secondary: "#c2410c",
      accent: "#fed7aa",
      bg: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
      cardBg: "#ffffff",
      emoji: "🏀",
      sport: "Basketball",
      headerBg: "linear-gradient(135deg, #ea580c, #c2410c)",
      tabActive: "#ea580c",
      btnPlus: "#ea580c",
      btnMinus: "#7c3aed",
      badge: "#ffedd5",
      badgeText: "#c2410c",
    },
  },
  amelia: {
    art: {
      primary: "#7c3aed",
      secondary: "#6d28d9",
      accent: "#ede9fe",
      bg: "linear-gradient(135deg, #fdf4ff 0%, #fae8ff 50%, #ede9fe 100%)",
      cardBg: "#ffffff",
      emoji: "🎨",
      sport: "Art Studio",
      headerBg: "linear-gradient(135deg, #7c3aed, #db2777)",
      tabActive: "#7c3aed",
      btnPlus: "#7c3aed",
      btnMinus: "#db2777",
      badge: "#ede9fe",
      badgeText: "#6d28d9",
    },
  },
};

// Sport toggle — Chris Jr alternates between soccer and basketball
function getChrisTheme(sport) { return KID_THEMES.chrisjr[sport]; }
function getAmeliaTheme() { return KID_THEMES.amelia.art; }
function getTheme(kid, sport) {
  if (kid === "chrisjr") return getChrisTheme(sport);
  return getAmeliaTheme();
}

function formatDollars(amt) { return `$${Number(amt).toFixed(2)}`; }
function formatTime(ts) {
  return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

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
function PinModal({ title, subtitle, onSuccess, onCancel, validate, theme }) {
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
    <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:"#ffffff",borderRadius:24,padding:"32px 28px",maxWidth:320,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize:40,marginBottom:8 }}>🔒</div>
        <h2 style={{ margin:"0 0 4px",color:"#1e293b",fontSize:20,fontWeight:800 }}>{title}</h2>
        <p style={{ color:"#94a3b8",fontSize:13,margin:"0 0 24px" }}>{subtitle}</p>
        <div style={{ display:"flex",justifyContent:"center",gap:12,marginBottom:24 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:16,height:16,borderRadius:"50%",border:`2px solid ${theme?.primary||"#7c3aed"}`,background:pin.length>i?(theme?.primary||"#7c3aed"):"transparent",transition:"background 0.15s" }} />
          ))}
        </div>
        {error && <p style={{ color:"#ef4444",fontSize:13,margin:"-12px 0 16px" }}>{error}</p>}
        <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16 }}>
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k,i) => (
            <button key={i} onClick={() => k==="⌫" ? setPin(p=>p.slice(0,-1)) : k && handleKey(k)}
              style={{ padding:"14px",borderRadius:12,border:`1px solid #e2e8f0`,background:k?"#f8fafc":"transparent",color:"#1e293b",fontSize:18,fontWeight:"bold",cursor:k?"pointer":"default",fontFamily:"inherit",transition:"background 0.15s" }}>
              {k}
            </button>
          ))}
        </div>
        <button onClick={onCancel} style={{ width:"100%",padding:"10px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#94a3b8",cursor:"pointer",fontFamily:"inherit",fontWeight:"bold" }}>Cancel</button>
      </div>
    </div>
  );
}

function SyncBadge({ status }) {
  const cfg = { syncing:{color:"#f59e0b",label:"Saving…"}, synced:{color:"#16a34a",label:"Saved ✓"}, error:{color:"#ef4444",label:"Offline"}, idle:{label:""} }[status]||{};
  if (!cfg.label) return null;
  return <span style={{ fontSize:11,color:cfg.color,marginLeft:6,fontWeight:600 }}>{cfg.label}</span>;
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("tracker");
  const [chores, setChores] = useState(defaultChores);
  const [counts, setCounts] = useState({});
  const [log, setLog] = useState([]);
  const [selectedKid, setSelectedKid] = useState("chrisjr");
  const [chrisSport, setChrisSport] = useState("soccer"); // "soccer" | "basketball"
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

  const theme = getTheme(selectedKid, chrisSport);

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
    const interval = setInterval(async () => {
      const [cn, lg] = await Promise.all([apiGet("counts"), apiGet("log")]);
      if (cn) setCounts(cn);
      if (lg) setLog(lg);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

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
    const entry = { id:Date.now()+Math.random(), timestamp:Date.now(), kid, choreName:chore?.name||"", choreId, action:delta>0?"added":"removed", count:next, pay:chore?.pay||0 };
    const newLog = [entry, ...log];
    setLog(newLog);
    await Promise.all([saveData("counts", newCounts), saveData("log", newLog)]);
  }

  function getKidChores(kid) { return chores.filter(c => c.assignedTo===kid||c.assignedTo==="both"); }
  function getEarnings(kid) { return getKidChores(kid).reduce((s,c)=>s+(getCount(c.id,kid)*c.pay),0); }

  async function handleCashOut() {
    const summary = { date:new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"}), chrisjr:getEarnings("chrisjr"), amelia:getEarnings("amelia") };
    summary.total = summary.chrisjr + summary.amelia;
    const cashEntry = { id:Date.now(),timestamp:Date.now(),kid:"all",choreName:"💵 CASH OUT",choreId:null,action:"cashout",count:0,pay:summary.total };
    const newLog = [cashEntry, ...log];
    setCashOutSummary(summary);
    setLastCashOut(summary.date);
    setCounts({});
    setLog(newLog);
    setShowCashOutConfirm(false);
    await Promise.all([saveData("counts",{}), saveData("log",newLog), saveData("lastCashOut",summary.date)]);
  }

  async function saveChores(updated) { setChores(updated); await saveData("chores", updated); }
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
    setPinModal({ purpose:"Parent Access", subtitle:"Enter the parent PIN to continue.", validate:p=>p===PARENT_PIN, onSuccess:()=>{ setRole("parent"); setPinModal(null); action(); }});
  }
  function switchToKid() {
    setPinModal({ purpose:"Kid Mode", subtitle:"Enter the kid PIN to switch.", validate:p=>p===KID_PIN, onSuccess:()=>{ setRole("kid"); setPinModal(null); }});
  }

  const kidChores = getKidChores(selectedKid);
  const earned = getEarnings(selectedKid);
  const filteredLog = logFilter==="all"?log:log.filter(e=>e.kid===logFilter||(logFilter==="cashout"&&e.action==="cashout"));

  if (!loaded) return (
    <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,fontFamily:"system-ui,sans-serif" }}>
      <div style={{ fontSize:48 }}>🏠</div>
      <div style={{ fontSize:18,fontWeight:700,color:"#16a34a" }}>Loading Chore Tracker…</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh",background:theme.bg,fontFamily:"system-ui,-apple-system,sans-serif",color:"#1e293b",padding:"0 0 100px",transition:"background 0.4s ease" }}>

      {pinModal && <PinModal title={pinModal.purpose} subtitle={pinModal.subtitle} validate={pinModal.validate} onSuccess={pinModal.onSuccess} onCancel={()=>setPinModal(null)} theme={theme} />}

      {/* Cash Out Success */}
      {cashOutSummary && (
        <div style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div style={{ background:"#fff",borderRadius:24,padding:"32px 28px",maxWidth:360,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize:56,marginBottom:8 }}>🎉</div>
            <h2 style={{ margin:"0 0 4px",color:"#16a34a",fontSize:24,fontWeight:800 }}>Cash Out!</h2>
            <p style={{ color:"#94a3b8",fontSize:13,margin:"0 0 24px" }}>{cashOutSummary.date}</p>
            {KIDS.map(kid => {
              const t = getTheme(kid, chrisSport);
              return (
                <div key={kid} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid #f1f5f9" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ fontSize:24 }}>{t.emoji}</span>
                    <span style={{ fontWeight:700,color:t.primary,fontSize:16 }}>{KID_LABELS[kid]}</span>
                  </div>
                  <span style={{ fontWeight:800,color:"#1e293b",fontSize:22 }}>{formatDollars(cashOutSummary[kid])}</span>
                </div>
              );
            })}
            <div style={{ display:"flex",justifyContent:"space-between",padding:"16px 0 0",marginBottom:24 }}>
              <span style={{ fontWeight:800,color:"#16a34a",fontSize:16 }}>Total Paid Out</span>
              <span style={{ fontWeight:800,color:"#16a34a",fontSize:24 }}>{formatDollars(cashOutSummary.total)}</span>
            </div>
            <button onClick={()=>setCashOutSummary(null)} style={{ width:"100%",padding:"14px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#16a34a,#22c55e)",color:"#fff",fontWeight:800,fontSize:16,cursor:"pointer",fontFamily:"inherit" }}>Awesome! ✓</button>
          </div>
        </div>
      )}

      {/* Cash Out Confirm */}
      {showCashOutConfirm && (
        <div style={{ position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
          <div style={{ background:"#fff",borderRadius:24,padding:"28px 24px",maxWidth:340,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize:48,marginBottom:8 }}>💵</div>
            <h2 style={{ margin:"0 0 8px",color:"#16a34a",fontSize:22,fontWeight:800 }}>Ready to Cash Out?</h2>
            <p style={{ color:"#94a3b8",fontSize:14,margin:"0 0 20px" }}>This records today's earnings and resets all chore counts.</p>
            <div style={{ marginBottom:20 }}>
              {KIDS.map(kid => {
                const t = getTheme(kid, chrisSport);
                return (
                  <div key={kid} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f1f5f9" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <span>{t.emoji}</span>
                      <span style={{ color:t.primary,fontWeight:700 }}>{KID_LABELS[kid]}</span>
                    </div>
                    <span style={{ fontWeight:800,fontSize:18 }}>{formatDollars(getEarnings(kid))}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setShowCashOutConfirm(false)} style={{ flex:1,padding:"12px",borderRadius:12,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#94a3b8",cursor:"pointer",fontFamily:"inherit",fontWeight:700 }}>Cancel</button>
              <button onClick={handleCashOut} style={{ flex:1,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#16a34a,#22c55e)",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:800,fontSize:15 }}>Pay Out 💰</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ background:theme.headerBg,padding:"28px 20px 24px",textAlign:"center",boxShadow:"0 4px 20px rgba(0,0,0,0.1)",transition:"background 0.4s ease" }}>
        <div style={{ fontSize:40,marginBottom:6 }}>{theme.emoji}</div>
        <h1 style={{ margin:0,fontSize:24,fontWeight:900,color:"#ffffff",letterSpacing:"-0.02em",textShadow:"0 2px 8px rgba(0,0,0,0.2)" }}>
          Chapa Family Chore Tracker <SyncBadge status={syncStatus} />
        </h1>
        <p style={{ margin:"6px 0 0",color:"rgba(255,255,255,0.8)",fontSize:13,fontWeight:500 }}>
          {theme.sport} Season 🏆
        </p>
        {lastCashOut && <p style={{ margin:"4px 0 0",color:"rgba(255,255,255,0.6)",fontSize:11 }}>Last cash out: {lastCashOut}</p>}
        {/* Role badge */}
        <div style={{ marginTop:12,display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.2)",borderRadius:999,padding:"6px 14px",backdropFilter:"blur(8px)" }}>
          <span style={{ fontSize:12,color:"#fff",fontWeight:700 }}>
            {role==="parent"?"👑 Parent Mode":"👦 Kid Mode"}
          </span>
          <button onClick={()=>role==="parent"?switchToKid():requireParent(()=>{})} style={{ fontSize:11,color:"rgba(255,255,255,0.8)",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:0,textDecoration:"underline" }}>
            {role==="parent"?"Switch to Kid":"Parent Login"}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display:"flex",justifyContent:"center",gap:6,margin:"16px 16px 0",flexWrap:"wrap" }}>
        {[
          {key:"tracker",label:"📅 Tracker"},
          {key:"log",label:"📋 Log"},
          ...(role==="parent"?[{key:"manage",label:"⚙️ Manage"}]:[]),
        ].map(t=>(
          <button key={t.key} onClick={()=>t.key==="manage"?requireParent(()=>setTab("manage")):setTab(t.key)} style={{
            padding:"9px 22px",borderRadius:999,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,transition:"all 0.2s",
            background:tab===t.key?theme.tabActive:"#ffffff",
            color:tab===t.key?"#ffffff":"#64748b",
            boxShadow:tab===t.key?`0 4px 14px ${theme.primary}44`:"0 1px 4px rgba(0,0,0,0.08)",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── TRACKER ── */}
      {tab==="tracker" && (
        <div style={{ maxWidth:600,margin:"16px auto 0",padding:"0 16px" }}>

          {/* Kid selector */}
          <div style={{ display:"flex",gap:10,marginBottom:16 }}>
            {KIDS.map(kid => {
              const t = getTheme(kid, chrisSport);
              const active = selectedKid===kid;
              return (
                <button key={kid} onClick={()=>setSelectedKid(kid)} style={{
                  flex:1,padding:"14px 10px",borderRadius:16,
                  border:`2.5px solid ${active?t.primary:"#e2e8f0"}`,
                  background:active?t.primary:"#ffffff",
                  color:active?"#ffffff":"#94a3b8",
                  cursor:"pointer",fontFamily:"inherit",fontSize:15,fontWeight:800,
                  transition:"all 0.2s",
                  boxShadow:active?`0 4px 16px ${t.primary}55`:"0 1px 4px rgba(0,0,0,0.06)",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                }}>
                  <span style={{ fontSize:20 }}>{t.emoji}</span>
                  {KID_LABELS[kid]}
                </button>
              );
            })}
          </div>

          {/* Sport toggle for Chris Jr */}
          {selectedKid==="chrisjr" && (
            <div style={{ display:"flex",gap:8,marginBottom:16,justifyContent:"center" }}>
              <button onClick={()=>setChrisSport("soccer")} style={{ padding:"6px 18px",borderRadius:999,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:chrisSport==="soccer"?"#16a34a":"#f1f5f9",color:chrisSport==="soccer"?"#fff":"#64748b",transition:"all 0.2s" }}>⚽ Soccer</button>
              <button onClick={()=>setChrisSport("basketball")} style={{ padding:"6px 18px",borderRadius:999,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:chrisSport==="basketball"?"#ea580c":"#f1f5f9",color:chrisSport==="basketball"?"#fff":"#64748b",transition:"all 0.2s" }}>🏀 Basketball</button>
            </div>
          )}

          {/* Earnings card */}
          <div style={{ background:"#ffffff",borderRadius:20,padding:"20px 22px",marginBottom:16,boxShadow:`0 4px 20px ${theme.primary}22`,border:`2px solid ${theme.accent}` }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13,color:"#94a3b8",marginBottom:4,fontWeight:600 }}>Current Earnings</div>
                <div style={{ fontSize:38,fontWeight:900,color:theme.primary }}>{formatDollars(earned)}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13,color:"#94a3b8",fontWeight:600 }}>Completed</div>
                <div style={{ fontSize:26,fontWeight:900,color:theme.primary }}>
                  {kidChores.reduce((s,c)=>s+getCount(c.id,selectedKid),0)} tasks
                </div>
              </div>
            </div>
          </div>

          {/* Chore list */}
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {kidChores.map(chore => {
              const count = getCount(chore.id, selectedKid);
              return (
                <div key={chore.id} style={{
                  display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:16,
                  background: count>0?theme.accent:"#ffffff",
                  border:`2px solid ${count>0?theme.primary:"#e2e8f0"}`,
                  transition:"all 0.2s",
                  boxShadow: count>0?`0 2px 12px ${theme.primary}22`:"0 1px 4px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15,color:count>0?theme.secondary:"#64748b",fontWeight:count>0?700:500 }}>{chore.name}</div>
                    <div style={{ fontSize:12,color:"#94a3b8",marginTop:2,fontWeight:500 }}>{formatDollars(chore.pay)} each</div>
                  </div>
                  {count>0 && <span style={{ fontSize:14,color:theme.primary,fontWeight:800,minWidth:52,textAlign:"center" }}>{formatDollars(count*chore.pay)}</span>}
                  {role==="parent" ? (
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <button onClick={()=>changeCount(chore.id,selectedKid,-1)} disabled={count===0} style={{ width:34,height:34,borderRadius:10,border:"none",background:count>0?"#fee2e2":"#f1f5f9",color:count>0?"#ef4444":"#cbd5e1",cursor:count>0?"pointer":"default",fontSize:20,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s" }}>−</button>
                      <span style={{ minWidth:26,textAlign:"center",fontSize:18,fontWeight:900,color:count>0?theme.primary:"#cbd5e1" }}>{count}</span>
                      <button onClick={()=>changeCount(chore.id,selectedKid,1)} style={{ width:34,height:34,borderRadius:10,border:"none",background:theme.accent,color:theme.primary,cursor:"pointer",fontSize:20,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s" }}>+</button>
                    </div>
                  ) : (
                    <span style={{ minWidth:26,textAlign:"center",fontSize:18,fontWeight:900,color:count>0?theme.primary:"#cbd5e1" }}>{count}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div style={{ marginTop:20,background:"#ffffff",borderRadius:16,padding:"16px 20px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #f1f5f9" }}>
            <div style={{ fontSize:11,color:"#94a3b8",marginBottom:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase" }}>Both Kids — Summary</div>
            {KIDS.map(kid => {
              const t = getTheme(kid, chrisSport);
              return (
                <div key={kid} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                    <span style={{ fontSize:16 }}>{t.emoji}</span>
                    <span style={{ color:t.primary,fontSize:14,fontWeight:700 }}>{KID_LABELS[kid]}</span>
                  </div>
                  <span style={{ color:"#1e293b",fontSize:15,fontWeight:800 }}>{formatDollars(getEarnings(kid))}</span>
                </div>
              );
            })}
            <div style={{ borderTop:"2px solid #f1f5f9",marginTop:10,paddingTop:10,display:"flex",justifyContent:"space-between" }}>
              <span style={{ color:"#16a34a",fontWeight:800,fontSize:15 }}>Total to Pay Out</span>
              <span style={{ color:"#16a34a",fontWeight:900,fontSize:18 }}>{formatDollars(KIDS.reduce((s,k)=>s+getEarnings(k),0))}</span>
            </div>
          </div>

          {role==="parent" ? (
            <button onClick={()=>setShowCashOutConfirm(true)} style={{ width:"100%",marginTop:16,padding:"16px",borderRadius:16,border:"none",background:"linear-gradient(135deg,#16a34a,#22c55e)",color:"#fff",fontWeight:900,fontSize:17,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 6px 20px rgba(34,197,94,0.4)",letterSpacing:"0.01em" }}>
              💵 Cash Out
            </button>
          ) : (
            <div style={{ marginTop:14,textAlign:"center",color:"#94a3b8",fontSize:13,fontWeight:500 }}>Cash out requires parent login</div>
          )}
        </div>
      )}

      {/* ── LOG ── */}
      {tab==="log" && (
        <div style={{ maxWidth:600,margin:"16px auto 0",padding:"0 16px" }}>
          <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" }}>
            {[["all","All"],["chrisjr","Chris Jr"],["amelia","Amelia"],["cashout","Cash Outs"]].map(([val,label])=>(
              <button key={val} onClick={()=>setLogFilter(val)} style={{ padding:"7px 16px",borderRadius:999,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:logFilter===val?theme.tabActive:"#ffffff",color:logFilter===val?"#fff":"#64748b",boxShadow:logFilter===val?`0 2px 8px ${theme.primary}44`:"0 1px 4px rgba(0,0,0,0.06)" }}>{label}</button>
            ))}
          </div>
          {filteredLog.length===0 ? (
            <div style={{ textAlign:"center",color:"#94a3b8",padding:"40px 0",fontSize:15 }}>No activity yet</div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {filteredLog.map(entry => {
                const t = entry.kid!=="all" ? getTheme(entry.kid, chrisSport) : null;
                return (
                  <div key={entry.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:14,background:"#ffffff",border:`1.5px solid ${entry.action==="cashout"?"#bbf7d0":entry.action==="added"?"#e2e8f0":"#fee2e2"}`,boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                    <span style={{ fontSize:22 }}>{entry.action==="cashout"?"💰":entry.action==="added"?"✅":"↩️"}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14,color:"#1e293b",fontWeight:600 }}>{entry.choreName}</div>
                      <div style={{ fontSize:12,color:"#94a3b8",marginTop:2 }}>
                        {t && <span style={{ color:t.primary,marginRight:6,fontWeight:700 }}>{KID_LABELS[entry.kid]}</span>}
                        {entry.action==="added"?`Added · count → ${entry.count}`:entry.action==="removed"?`Removed · count → ${entry.count}`:`Total paid: ${formatDollars(entry.pay)}`}
                      </div>
                    </div>
                    <span style={{ fontSize:11,color:"#94a3b8",textAlign:"right",flexShrink:0,fontWeight:500 }}>{formatTime(entry.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MANAGE ── */}
      {tab==="manage" && role==="parent" && (
        <div style={{ maxWidth:600,margin:"16px auto 0",padding:"0 16px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
            <h2 style={{ margin:0,fontSize:18,color:"#1e293b",fontWeight:800 }}>All Chores</h2>
            <button onClick={()=>setShowAddForm(v=>!v)} style={{ padding:"8px 18px",borderRadius:999,border:"none",background:theme.primary,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13 }}>
              {showAddForm?"✕ Cancel":"+ Add Chore"}
            </button>
          </div>
          {showAddForm && (
            <div style={{ background:"#fff",border:`2px solid ${theme.primary}`,borderRadius:16,padding:"16px",marginBottom:14,boxShadow:`0 4px 16px ${theme.primary}22` }}>
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
                <button onClick={addChore} style={{ padding:"11px",borderRadius:12,border:"none",background:theme.primary,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14 }}>Add Chore</button>
              </div>
            </div>
          )}
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {chores.map(chore=>(
              <div key={chore.id}>
                {editingChore?.id===chore.id ? (
                  <div style={{ background:"#fff",border:`2px solid ${theme.primary}`,borderRadius:16,padding:"14px" }}>
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
                        <button onClick={()=>saveEdit(editingChore)} style={{ flex:1,padding:"9px",borderRadius:10,border:"none",background:theme.primary,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Save</button>
                        <button onClick={()=>setEditingChore(null)} style={{ flex:1,padding:"9px",borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#94a3b8",cursor:"pointer",fontFamily:"inherit" }}>Cancel</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:16,background:"#ffffff",border:"1.5px solid #f1f5f9",boxShadow:"0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15,color:"#1e293b",fontWeight:600 }}>{chore.name}</div>
                      <div style={{ fontSize:12,color:"#94a3b8",marginTop:2 }}>{chore.assignedTo==="both"?"Both kids":KID_LABELS[chore.assignedTo]}</div>
                    </div>
                    <span style={{ color:theme.primary,fontWeight:800,fontSize:15,marginRight:8 }}>{formatDollars(chore.pay)}</span>
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

const inputStyle = { padding:"10px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#1e293b",fontFamily:"inherit",fontSize:14,outline:"none",width:"100%",boxSizing:"border-box" };
function iconBtn(color) { return { width:34,height:34,borderRadius:10,border:`1.5px solid ${color}44`,background:`${color}11`,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }; }
