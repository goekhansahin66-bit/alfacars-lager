'use client'
import { useState, useEffect, useMemo, useRef } from "react"
import { supabase } from "./supabase"

const fmt = c => ((c||0)/100).toLocaleString("de-DE",{style:"currency",currency:"EUR"})
const today = () => new Date().toISOString().slice(0,10)

const I = ({n,s=18}) => {
  const p = {width:s,height:s,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round",strokeLinejoin:"round"}
  const d = {
    home:"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0v-4a1 1 0 011-1h2a1 1 0 011 1v4m-4 0h4",
    box:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    cal:"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
    cash:"M1 4h22v16H1zM12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0",
    users:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    chart:"M18 20V10M12 20V4M6 20v-6",truck:"M1 3h15v13H1zM16 8h4l3 3v5h-7V8z",
    plus:"M12 5v14M5 12h14",x:"M18 6L6 18M6 6l12 12",check:"M20 6L9 17l-5-5",
    search:"M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z",
    alert:"M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
    brain:"M12 2a5 5 0 014.5 2.8A4 4 0 0120 9a4.5 4.5 0 01-1 8.5A5 5 0 0112 22a5 5 0 01-7-4.5A4.5 4.5 0 014 9a4 4 0 013.5-4.2A5 5 0 0112 2zM12 2v20",
    phone:"M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
    logout:"M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  }
  return <svg {...p}><path d={d[n]||""}/></svg>
}

const CSS = `
:root{--bg:#06060B;--bg2:#0D0D14;--bg3:#15151F;--bg4:#1E1E2C;--bd:#252538;--bd2:#353550;--t1:#F0F0F8;--t2:#A0A0B8;--t3:#606080;--ac:#FF6B2C;--ac2:#FF8F5E;--acbg:rgba(255,107,44,0.06);--acbd:rgba(255,107,44,0.2);--gn:#22C55E;--gnbg:rgba(34,197,94,0.06);--rd:#EF4444;--rdbg:rgba(239,68,68,0.06);--yl:#EAB308;--ylbg:rgba(234,179,8,0.06);--bl:#3B82F6;--blbg:rgba(59,130,246,0.06);--r:14px;--rs:10px;--f:'Outfit',sans-serif;--m:'JetBrains Mono',monospace}
*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%;background:var(--bg);color:var(--t1);font-family:var(--f);-webkit-font-smoothing:antialiased;overflow:hidden}
.app{display:flex;height:100dvh}.side{width:72px;background:var(--bg);border-right:1px solid var(--bd);display:flex;flex-direction:column;align-items:center;padding:16px 0;gap:4px;flex-shrink:0;z-index:10}
.side-logo{width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#FF6B2C,#FF3D00);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:white;margin-bottom:16px;box-shadow:0 4px 20px rgba(255,107,44,0.3)}
.side-btn{width:52px;height:52px;border-radius:var(--rs);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:var(--t3);border:none;background:none;font-family:var(--f);font-size:9px;font-weight:500;transition:all .15s;position:relative}
.side-btn:hover{color:var(--t2);background:var(--bg3)}.side-btn.on{color:var(--ac);background:var(--acbg)}
.side-btn.on::before{content:'';position:absolute;left:-1px;top:12px;bottom:12px;width:3px;background:var(--ac);border-radius:0 3px 3px 0}
.side-badge{position:absolute;top:6px;right:6px;background:var(--rd);color:white;font-size:9px;font-weight:700;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center}
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}.top{height:56px;border-bottom:1px solid var(--bd);display:flex;align-items:center;padding:0 24px;gap:16px;flex-shrink:0;background:var(--bg2)}
.top-title{font-size:17px;font-weight:700}.top-right{margin-left:auto;display:flex;gap:8px;align-items:center}
.view{flex:1;overflow-y:auto;padding:20px;-webkit-overflow-scrolling:touch}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px}
.kpi{background:var(--bg2);border:1px solid var(--bd);border-radius:var(--r);padding:16px;position:relative;overflow:hidden}
.kpi::after{content:'';position:absolute;top:0;left:0;right:0;height:2px}.kpi.o::after{background:var(--ac)}.kpi.g::after{background:var(--gn)}.kpi.r::after{background:var(--rd)}.kpi.b::after{background:var(--bl)}
.kpi-l{font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:1.2px;font-weight:600}.kpi-v{font-size:24px;font-weight:800;margin-top:4px;font-family:var(--m)}.kpi-s{font-size:11px;color:var(--t2);margin-top:2px}
.card{background:var(--bg2);border:1px solid var(--bd);border-radius:var(--r);padding:18px;margin-bottom:16px}
.card-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.card-t{font-size:12px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.8px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--rs);font-size:13px;font-weight:600;cursor:pointer;border:1px solid var(--bd);background:var(--bg3);color:var(--t1);transition:all .12s;font-family:var(--f);white-space:nowrap}
.btn:hover{border-color:var(--bd2)}.btn:active{transform:scale(.96)}.btn-p{background:var(--ac);border-color:var(--ac);color:white}.btn-p:hover{background:var(--ac2)}
.btn-s{padding:5px 10px;font-size:11px}.btn-g{border-color:var(--gn);color:var(--gn)}.btn-r{border-color:var(--rd);color:var(--rd)}
.tag{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700}
.tag-o{background:var(--acbg);color:var(--ac)}.tag-g{background:var(--gnbg);color:var(--gn)}.tag-r{background:var(--rdbg);color:var(--rd)}.tag-y{background:var(--ylbg);color:var(--yl)}.tag-b{background:var(--blbg);color:var(--bl)}
input,select,textarea{padding:10px 12px;background:var(--bg);border:1px solid var(--bd);border-radius:var(--rs);color:var(--t1);font-size:14px;font-family:var(--f);width:100%}input:focus,select:focus{outline:none;border-color:var(--ac)}
.tw{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;padding:8px 10px;font-weight:700;color:var(--t3);border-bottom:1px solid var(--bd);font-size:10px;text-transform:uppercase}td{padding:10px;border-bottom:1px solid var(--bd)}
.tl-item{padding:16px;border-radius:var(--rs);border:1px solid var(--bd);background:var(--bg);margin-bottom:10px;border-left:3px solid var(--gn)}.tl-item.pending{border-left-color:var(--yl)}
.alpha{position:fixed;right:0;top:0;bottom:0;width:380px;background:var(--bg2);border-left:1px solid var(--bd);display:flex;flex-direction:column;z-index:100;transform:translateX(100%);transition:transform .3s}.alpha.open{transform:translateX(0)}
.alpha-head{padding:14px 18px;border-bottom:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.alpha-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.alpha-msg{padding:12px 14px;border-radius:12px;font-size:13px;line-height:1.55;max-width:92%;white-space:pre-wrap}
.alpha-msg.u{background:var(--acbg);border:1px solid var(--acbd);align-self:flex-end}.alpha-msg.a{background:var(--bg3);align-self:flex-start}
.alpha-bar{padding:10px 14px;border-top:1px solid var(--bd);display:flex;gap:8px;flex-shrink:0}.alpha-bar input{flex:1}
.alpha-qk{padding:8px 12px;display:flex;gap:5px;overflow-x:auto;border-top:1px solid var(--bd);flex-shrink:0}.alpha-qk button{font-size:10px;padding:4px 10px;white-space:nowrap;flex-shrink:0}
.login-wrap{height:100dvh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:20px}
.login-card{background:var(--bg2);border:1px solid var(--bd);border-radius:16px;padding:40px;max-width:400px;width:100%}
.mob-bar{position:fixed;bottom:0;left:0;right:0;height:64px;background:var(--bg2);border-top:1px solid var(--bd);display:none;align-items:center;justify-content:space-around;z-index:50}
.mob-btn{display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:none;color:var(--t3);cursor:pointer;padding:6px 10px;font-size:9px;font-family:var(--f)}.mob-btn.on{color:var(--ac)}
@media(max-width:768px){.side{display:none}.mob-bar{display:flex}.view{padding:14px}.alpha{width:100%}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp .35s ease}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 1.2s ease infinite}
`

export default function Home() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState("dash")
  const [alphaOpen, setAlphaOpen] = useState(false)
  const [data, setData] = useState({ marken:[], artikel:[], mitarbeiter:[], termine:[], auftraege:[], verkaeufe:[], kunden:[], reifenhotel:[], lieferanten:[], marktdaten:[] })

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => { setSession(session); setLoading(false) })
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  // Load data
  useEffect(() => {
    if (!session) return
    const load = async () => {
      const [mk,ar,mi,te,au,ve,ku,rh,li,md] = await Promise.all([
        supabase.from("marken").select("*").order("name"),
        supabase.from("artikel").select("*").order("normgroesse"),
        supabase.from("mitarbeiter").select("*").order("name"),
        supabase.from("termine").select("*").order("datum",{ascending:false}),
        supabase.from("auftraege").select("*").order("created_at",{ascending:false}),
        supabase.from("verkaeufe").select("*").order("created_at",{ascending:false}),
        supabase.from("kunden").select("*").order("name"),
        supabase.from("reifenhotel").select("*").order("created_at",{ascending:false}),
        supabase.from("lieferanten").select("*").order("name"),
        supabase.from("marktdaten").select("*").order("normgroesse"),
      ])
      setData({
        marken:mk.data||[], artikel:ar.data||[], mitarbeiter:mi.data||[], termine:te.data||[],
        auftraege:au.data||[], verkaeufe:ve.data||[], kunden:ku.data||[], reifenhotel:rh.data||[],
        lieferanten:li.data||[], marktdaten:md.data||[]
      })
    }
    load()
  }, [session])

  const reload = async (table) => {
    const {data:d} = await supabase.from(table).select("*").order("created_at",{ascending:false})
    setData(prev => ({...prev, [table]: d||[]}))
  }

  // Stock computed
  const stock = useMemo(() => data.artikel.map(a => {
    const brand = data.marken.find(m=>m.id===a.marke_id)
    return {...a, brand_name:brand?.name||"?", qty:a.bestand_cache||0, low:(a.bestand_cache||0)<(a.min_bestand||4)}
  }), [data.artikel, data.marken])

  const warns = stock.filter(s=>s.low)
  const todayT = data.termine.filter(t=>t.datum===today())

  if (loading) return <><style>{CSS}</style><div className="login-wrap"><div className="pulse" style={{color:"var(--ac)",fontSize:18}}>Laden...</div></div></>

  if (!session) return <LoginPage />

  const nav = [
    {k:"dash",i:"home",l:"Home"},
    {k:"auftraege",i:"truck",l:"Aufträge",b:data.auftraege.filter(a=>a.status!=="montiert"&&a.status!=="storniert").length||null},
    {k:"lager",i:"box",l:"Lager",b:warns.length||null},
    {k:"termine",i:"cal",l:"Termine",b:todayT.length||null},
    {k:"kasse",i:"cash",l:"Kasse"},
    {k:"kunden",i:"users",l:"Kunden"},
    {k:"hotel",i:"box",l:"Hotel"},
    {k:"analyse",i:"chart",l:"Analyse"},
  ]

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="side">
          <div className="side-logo">AC</div>
          {nav.map(n=>(
            <button key={n.k} className={`side-btn ${page===n.k?"on":""}`} onClick={()=>setPage(n.k)}>
              <I n={n.i} s={20}/>{n.l}
              {n.b>0&&<span className="side-badge">{n.b}</span>}
            </button>
          ))}
          <div style={{flex:1}}/>
          <button className={`side-btn ${alphaOpen?"on":""}`} onClick={()=>setAlphaOpen(!alphaOpen)}><I n="brain" s={20}/>Alpha</button>
          <button className="side-btn" onClick={()=>supabase.auth.signOut()}><I n="logout" s={18}/><span style={{fontSize:8}}>Logout</span></button>
        </div>
        <main className="main">
          <div className="top">
            <span className="top-title">{nav.find(n=>n.k===page)?.l||"ALFACARS"}</span>
            <div className="top-right">
              <span style={{fontSize:12,color:"var(--t3)"}}>{session.user?.email}</span>
              <button className={`btn btn-s ${alphaOpen?"btn-p":""}`} onClick={()=>setAlphaOpen(!alphaOpen)}><I n="brain" s={14}/></button>
            </div>
          </div>
          <div className="view">
            {page==="dash"&&<DashPage stock={stock} warns={warns} termine={todayT} data={data}/>}
            {page==="lager"&&<LagerPage stock={stock} marken={data.marken} reload={()=>reload("artikel")} verkaeufe={data.verkaeufe}/>}
            {page==="termine"&&<TerminePage termine={data.termine} mitarbeiter={data.mitarbeiter} reload={()=>reload("termine")}/>}
            {page==="auftraege"&&<AuftraegePage auftraege={data.auftraege} lieferanten={data.lieferanten} kunden={data.kunden} reload={()=>reload("auftraege")} reloadKunden={()=>reload("kunden")}/>}
            {page==="kasse"&&<KassePage verkaeufe={data.verkaeufe} mitarbeiter={data.mitarbeiter} reload={()=>reload("verkaeufe")}/>}
            {page==="kunden"&&<KundenPage kunden={data.kunden} reload={()=>reload("kunden")}/>}
            {page==="hotel"&&<HotelPage reifenhotel={data.reifenhotel} reload={()=>reload("reifenhotel")}/>}
            {page==="analyse"&&<AnalysePage data={data} stock={stock}/>}
          </div>
        </main>
        <div className="mob-bar">
          {nav.slice(0,4).map(n=>(<button key={n.k} className={`mob-btn ${page===n.k?"on":""}`} onClick={()=>setPage(n.k)}><I n={n.i} s={20}/>{n.l}</button>))}
          <button className={`mob-btn ${alphaOpen?"on":""}`} onClick={()=>setAlphaOpen(!alphaOpen)}><I n="brain" s={20}/>Alpha</button>
        </div>
        <AlphaPanel open={alphaOpen} close={()=>setAlphaOpen(false)} stock={stock} termine={todayT} data={data} warns={warns}/>
      </div>
    </>
  )
}

// ─── LOGIN ───────────────────────────────────────────────────
function LoginPage() {
  const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [name,setName]=useState("")
  const [mode,setMode]=useState("login"); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false)

  const go = async () => {
    setErr(""); setBusy(true)
    if (mode==="signup") {
      const {error} = await supabase.auth.signUp({email,password:pass,options:{data:{name}}})
      if (error) setErr(error.message)
    } else {
      const {error} = await supabase.auth.signInWithPassword({email,password:pass})
      if (error) setErr(error.message)
    }
    setBusy(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-card fade-up">
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,borderRadius:16,background:"linear-gradient(135deg,#FF6B2C,#FF3D00)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:"white",boxShadow:"0 8px 32px rgba(255,107,44,0.3)"}}>AC</div>
          <div style={{fontSize:24,fontWeight:900,marginTop:12}}>ALFACARS</div>
          <div style={{color:"var(--t2)",fontSize:13}}>Reifen & Felgen ERP</div>
        </div>
        {mode==="signup"&&<div style={{marginBottom:14}}><div style={{fontSize:11,color:"var(--t3)",marginBottom:4}}>Name</div><input value={name} onChange={e=>setName(e.target.value)} placeholder="Dein Name"/></div>}
        <div style={{marginBottom:14}}><div style={{fontSize:11,color:"var(--t3)",marginBottom:4}}>E-Mail</div><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@alfacars.de"/></div>
        <div style={{marginBottom:20}}><div style={{fontSize:11,color:"var(--t3)",marginBottom:4}}>Passwort</div><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&go()}/></div>
        {err&&<div style={{color:"var(--rd)",fontSize:13,marginBottom:14,textAlign:"center"}}>{err}</div>}
        <button className="btn btn-p" style={{width:"100%",padding:14,fontSize:16,justifyContent:"center"}} onClick={go} disabled={busy}>{busy?"Laden...":mode==="login"?"Einloggen":"Registrieren"}</button>
        <div style={{textAlign:"center",marginTop:16}}><button onClick={()=>{setMode(mode==="login"?"signup":"login");setErr("")}} style={{background:"none",border:"none",color:"var(--ac)",cursor:"pointer",fontSize:13,fontFamily:"var(--f)"}}>{mode==="login"?"Kein Konto? Registrieren":"Schon ein Konto? Einloggen"}</button></div>
      </div>
    </div>
  )
}

// ─── DASHBOARD ───────────────────────────────────────────────
function DashPage({stock,warns,termine,data}) {
  const monthRev = data.verkaeufe.filter(v=>v.datum>=today().slice(0,7)+"-01").reduce((s,v)=>s+(v.betrag_cents||0),0)
  return (
    <div className="fade-up">
      <div className="kpis">
        <div className="kpi o"><div className="kpi-l">Umsatz Monat</div><div className="kpi-v">{fmt(monthRev)}</div></div>
        <div className="kpi b"><div className="kpi-l">Termine heute</div><div className="kpi-v">{termine.length}</div></div>
        <div className="kpi r"><div className="kpi-l">Lagerwarnungen</div><div className="kpi-v">{warns.length}</div></div>
        <div className="kpi g"><div className="kpi-l">Aufträge offen</div><div className="kpi-v">{data.auftraege.filter(a=>a.status!=="montiert").length}</div></div>
      </div>
      {termine.length>0&&<div className="card"><div className="card-h"><span className="card-t">Termine heute</span></div>
        {termine.map(t=><div key={t.id} className={`tl-item ${t.status==="pending"?"pending":""}`}><div style={{fontFamily:"var(--m)",fontSize:13,color:"var(--t3)"}}>{t.uhrzeit?.slice(0,5)}</div><div style={{fontWeight:700,marginTop:4}}>{t.kunde_name}</div><div style={{fontSize:13,color:"var(--t2)"}}>{t.service}</div></div>)}
      </div>}
      {warns.length>0&&<div className="card"><div className="card-h"><span className="card-t" style={{color:"var(--rd)"}}>Lagerwarnungen</span></div>
        {warns.slice(0,5).map(w=><div key={w.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--bd)"}}><span style={{fontFamily:"var(--m)",fontWeight:700}}>{w.normgroesse} <span style={{fontWeight:400,color:"var(--t2)"}}>{w.brand_name}</span></span><span style={{fontFamily:"var(--m)",fontWeight:800,color:"var(--rd)"}}>{w.qty}</span></div>)}
      </div>}
    </div>
  )
}

// ─── LAGER (komplett neu: Smart Input, Tabs, Karten/Tabelle) ─
function LagerPage({stock,marken,reload,verkaeufe}) {
  const [q,setQ]=useState(""); const [showAdd,setShowAdd]=useState(false); const [addMode,setAddMode]=useState("smart")
  const [view,setView]=useState("table"); const [tab,setTab]=useState("all"); const [seasonFilter,setSeasonFilter]=useState("all")
  const [smartInput,setSmartInput]=useState(""); const [smartQty,setSmartQty]=useState(4)
  const [dupFound,setDupFound]=useState(null) // duplicate article found
  const [form,setForm]=useState({typ:"TIRE",marke_id:"",modell:"",saison:"Sommer",breite:205,querschnitt:55,zoll:16,standort:"Regal A1",min_bestand:4,ek:"",vk:"",initQty:4})
  const [stockQty,setStockQty]=useState({})
  const SEASONS=["Sommer","Winter","Ganzjahr"]; const LOCS=["Regal A1","Regal A2","Regal A3","Regal B1","Regal B2","Regal B3","Lager 1","Lager 2","Lager Frankfurt"]
  const COMMON_SIZES=["175/65R14","185/65R15","195/65R15","205/55R16","215/55R16","215/60R16","225/45R17","225/50R17","235/40R18","245/40R18","255/35R19"]

  // Smart size parser - works on search AND add
  const parseSize = (text) => {
    if(!text) return null
    const t = text.replace(/[,\s\-\/\+]+/g,"").replace(/r/gi,"")
    const m = t.match(/(\d{3})(\d{2})(\d{2})/)
    if(m && +m[1]>=100 && +m[1]<=400 && +m[2]>=20 && +m[2]<=90 && +m[3]>=10 && +m[3]<=24) return {w:+m[1],a:+m[2],r:+m[3],norm:`${m[1]}/${m[2]}R${m[3]}`}
    return null
  }

  // Intelligent search - auto-format sizes
  const searchNormalized = useMemo(()=>{
    if(!q) return ""
    const parsed = parseSize(q)
    return parsed ? parsed.norm : q.toLowerCase()
  },[q])

  const parseSmartInput = (text) => {
    const t = text.toLowerCase()
    const parsed = parseSize(text)
    const season = /winter/i.test(t)?"Winter":/sommer/i.test(t)?"Sommer":/ganzjahr|allwetter/i.test(t)?"Ganzjahr":null
    const brand = marken.find(m=>t.includes(m.name.toLowerCase()))
    return { size:parsed, season, brand }
  }

  // Check for duplicate before adding
  const checkAndAdd = async () => {
    const parsed = parseSmartInput(smartInput)
    if(!parsed.size) return
    const existing = stock.find(s => s.normgroesse===parsed.size.norm && (!parsed.brand || s.brand_name===parsed.brand?.name))
    if(existing) {
      setDupFound(existing); return // Show duplicate dialog
    }
    await doAdd(parsed)
  }

  const doAdd = async (parsed) => {
    const ng = parsed.size.norm
    const res = await supabase.from("artikel").insert({
      typ:"TIRE", marke_id:parsed.brand?.id||null, modell:smartInput.replace(/\d+/g,"").replace(/[\/r]/gi,"").trim()||"Standard",
      saison:parsed.season||"Sommer", breite:parsed.size.w, querschnitt:parsed.size.a, zoll:parsed.size.r,
      normgroesse:ng, standort:"Regal A1", min_bestand:4
    }).select()
    // Auto book initial stock if qty > 0
    if(res.data?.[0]?.id && smartQty > 0) {
      await supabase.from("lagerbewegungen").insert({artikel_id:res.data[0].id,typ:"IN",menge:smartQty,grund:"Erstbestand"})
    }
    reload(); setSmartInput(""); setSmartQty(4); setShowAdd(false); setDupFound(null)
  }

  const addToDuplicate = async () => {
    if(!dupFound) return
    await supabase.from("lagerbewegungen").insert({artikel_id:dupFound.id,typ:"IN",menge:smartQty,grund:"Nachlieferung"})
    reload(); setDupFound(null); setSmartInput(""); setSmartQty(4); setShowAdd(false)
  }

  const addFromForm = async () => {
    if(!form.modell||!form.marke_id) return
    const ng = form.typ==="TIRE"?`${form.breite}/${form.querschnitt}R${form.zoll}`:`${form.breite}x${form.zoll}`
    const res = await supabase.from("artikel").insert({typ:form.typ,marke_id:form.marke_id,modell:form.modell,saison:form.typ==="RIM"?"-":form.saison,breite:+form.breite,querschnitt:+form.querschnitt,zoll:+form.zoll,normgroesse:ng,standort:form.standort,min_bestand:+form.min_bestand,ek_cents:(+form.ek||0)*100,vk_cents:(+form.vk||0)*100}).select()
    if(res.data?.[0]?.id && (+form.initQty||0)>0) {
      await supabase.from("lagerbewegungen").insert({artikel_id:res.data[0].id,typ:"IN",menge:+form.initQty,grund:"Erstbestand"})
    }
    reload(); setShowAdd(false)
  }

  const addStock = async (id,qty) => {
    if(!qty||qty===0) return
    await supabase.from("lagerbewegungen").insert({artikel_id:id,typ:qty>0?"IN":"OUT",menge:Math.abs(qty),grund:"Manuell"})
    reload()
  }

  const delItem = async (id) => { await supabase.from("artikel").delete().eq("id",id); reload() }

  // Intelligent filtering
  const filtered = stock.filter(s => {
    if(tab==="warn" && !s.low) return false
    if(tab==="tires" && s.typ!=="TIRE") return false
    if(tab==="rims" && s.typ!=="RIM") return false
    if(seasonFilter!=="all" && s.saison!==seasonFilter) return false
    if(searchNormalized) { return s.brand_name?.toLowerCase().includes(searchNormalized)||s.modell?.toLowerCase().includes(searchNormalized)||s.normgroesse?.toLowerCase().includes(searchNormalized)||s.standort?.toLowerCase().includes(searchNormalized)||s.normgroesse===searchNormalized }
    return true
  })

  const warns = stock.filter(s=>s.low)
  const parsedSearch = parseSize(q)

  return (
    <div className="fade-up">
      <div className="kpis">
        <div className="kpi o"><div className="kpi-l">Gesamt</div><div className="kpi-v">{stock.reduce((s,i)=>s+i.qty,0)}</div><div className="kpi-s">{stock.length} Artikel</div></div>
        <div className="kpi b"><div className="kpi-l">Reifen</div><div className="kpi-v">{stock.filter(s=>s.typ==="TIRE").length}</div></div>
        <div className="kpi y"><div className="kpi-l">Felgen</div><div className="kpi-v">{stock.filter(s=>s.typ==="RIM").length}</div></div>
        <div className="kpi r"><div className="kpi-l">Warnungen</div><div className="kpi-v">{warns.length}</div></div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <button className="btn btn-p" onClick={()=>setShowAdd(!showAdd)}><I n="plus" s={14}/> Artikel</button>
        <div style={{flex:1,minWidth:180,display:"flex",alignItems:"center",gap:8,background:"var(--bg)",border:"1px solid var(--bd)",borderRadius:"var(--rs)",padding:"0 12px"}}>
          <I n="search" s={14}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Größe, Marke, Modell... (z.B. 2055516)" style={{border:"none",background:"none",padding:"10px 0"}}/>
          {q&&<button onClick={()=>setQ("")} style={{background:"none",border:"none",color:"var(--t3)",cursor:"pointer",fontSize:16}}>×</button>}
        </div>
        <button className={`btn btn-s ${view==="table"?"btn-p":""}`} onClick={()=>setView("table")}>☰</button>
        <button className={`btn btn-s ${view==="cards"?"btn-p":""}`} onClick={()=>setView("cards")}>▦</button>
      </div>

      {/* Smart search result */}
      {q && parsedSearch && <div style={{padding:8,background:"var(--acbg)",border:"1px solid var(--acbd)",borderRadius:"var(--rs)",marginBottom:12,fontSize:13}}>
        🔍 Suche: <span style={{fontFamily:"var(--m)",fontWeight:700,color:"var(--ac)"}}>{parsedSearch.norm}</span> — {filtered.length} Treffer
      </div>}

      {/* Add Article */}
      {showAdd&&<div className="card fade-up" style={{borderColor:"var(--ac)"}}>
        <div className="card-h"><span className="card-t">Neuer Artikel</span><button className="btn btn-s" onClick={()=>{setShowAdd(false);setDupFound(null)}}><I n="x" s={12}/></button></div>
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          <button className={`btn btn-s ${addMode==="smart"?"btn-p":""}`} onClick={()=>setAddMode("smart")}>⚡ Schnell</button>
          <button className={`btn btn-s ${addMode==="form"?"btn-p":""}`} onClick={()=>setAddMode("form")}>📋 Formular</button>
        </div>

        {addMode==="smart"&&<>
          <div style={{marginBottom:10}}><input value={smartInput} onChange={e=>{setSmartInput(e.target.value);setDupFound(null)}} placeholder="z.B. 2055516 Michelin Winter oder 225/45R17 Continental" style={{fontSize:16,padding:14}} onKeyDown={e=>e.key==="Enter"&&checkAndAdd()}/></div>
          <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>{COMMON_SIZES.map(s=><button key={s} className="btn btn-s" onClick={()=>{setSmartInput(s);setDupFound(null)}} style={{fontFamily:"var(--m)",fontSize:11}}>{s}</button>)}</div>
          {smartInput&&<div style={{padding:10,background:"var(--bg)",borderRadius:"var(--rs)",marginBottom:10,fontSize:13}}>
            {(()=>{const p=parseSmartInput(smartInput); return <>
              Erkannt: {p.size?<span className="tag tag-o" style={{marginRight:6}}>{p.size.norm}</span>:<span style={{color:"var(--rd)"}}>Keine Größe </span>}
              {p.brand&&<span className="tag tag-b" style={{marginRight:6}}>{p.brand.name}</span>}
              {p.season&&<span className="tag tag-g">{p.season}</span>}
            </>})()}
          </div>}
          <div style={{display:"flex",gap:10,marginBottom:12,alignItems:"center"}}>
            <div style={{flex:1}}><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Menge einbuchen</div><input type="number" value={smartQty} onChange={e=>setSmartQty(+e.target.value)} style={{textAlign:"center",fontSize:16}}/></div>
          </div>

          {/* Duplicate found */}
          {dupFound&&<div style={{padding:12,background:"var(--ylbg)",border:"1px solid rgba(234,179,8,0.3)",borderRadius:"var(--rs)",marginBottom:12}}>
            <div style={{fontWeight:700,color:"var(--yl)",marginBottom:6}}>⚠ Artikel existiert bereits!</div>
            <div style={{fontSize:13}}><span style={{fontFamily:"var(--m)",fontWeight:700}}>{dupFound.normgroesse}</span> {dupFound.brand_name} {dupFound.modell} — Bestand: <strong>{dupFound.qty}</strong></div>
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button className="btn btn-s btn-g" onClick={addToDuplicate}>+{smartQty} Stück dazu buchen</button>
              <button className="btn btn-s" onClick={()=>{setDupFound(null);doAdd(parseSmartInput(smartInput))}}>Trotzdem neu anlegen</button>
            </div>
          </div>}

          {!dupFound&&<button className="btn btn-p" style={{width:"100%"}} onClick={checkAndAdd}>✓ Anlegen {smartQty>0?`+ ${smartQty} Stück einbuchen`:""}</button>}
        </>}

        {addMode==="form"&&<>
          <div style={{display:"flex",gap:6,marginBottom:14}}><button className={`btn ${form.typ==="TIRE"?"btn-p":""}`} onClick={()=>setForm(f=>({...f,typ:"TIRE"}))}>🛞 Reifen</button><button className={`btn ${form.typ==="RIM"?"btn-p":""}`} onClick={()=>setForm(f=>({...f,typ:"RIM"}))}>🔩 Felge</button></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Marke</div><select value={form.marke_id} onChange={e=>setForm(f=>({...f,marke_id:e.target.value}))}><option value="">Wählen...</option>{marken.filter(m=>m.typ===form.typ).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
            <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Modell</div><input value={form.modell} onChange={e=>setForm(f=>({...f,modell:e.target.value}))} placeholder="Primacy 4"/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:12}}>
            <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Breite</div><input type="number" value={form.breite} onChange={e=>setForm(f=>({...f,breite:e.target.value}))}/></div>
            {form.typ==="TIRE"&&<div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Querschnitt</div><input type="number" value={form.querschnitt} onChange={e=>setForm(f=>({...f,querschnitt:e.target.value}))}/></div>}
            <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Zoll</div><input type="number" value={form.zoll} onChange={e=>setForm(f=>({...f,zoll:e.target.value}))}/></div>
            <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Anfangsbestand</div><input type="number" value={form.initQty} onChange={e=>setForm(f=>({...f,initQty:e.target.value}))} placeholder="4"/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:12}}>
            {form.typ==="TIRE"&&<div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Saison</div><select value={form.saison} onChange={e=>setForm(f=>({...f,saison:e.target.value}))}>{SEASONS.map(s=><option key={s}>{s}</option>)}</select></div>}
            <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Standort</div><select value={form.standort} onChange={e=>setForm(f=>({...f,standort:e.target.value}))}>{LOCS.map(l=><option key={l}>{l}</option>)}</select></div>
            <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>EK €</div><input type="number" value={form.ek} onChange={e=>setForm(f=>({...f,ek:e.target.value}))}/></div>
            <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>VK €</div><input type="number" value={form.vk} onChange={e=>setForm(f=>({...f,vk:e.target.value}))}/></div>
          </div>
          <button className="btn btn-p" style={{width:"100%"}} onClick={addFromForm}>✓ Anlegen{+form.initQty>0?` + ${form.initQty} einbuchen`:""}</button>
        </>}
      </div>}

      {/* Tabs + Season */}
      <div style={{display:"flex",gap:2,marginBottom:8,borderBottom:"1px solid var(--bd)",overflowX:"auto"}}>
        {[["all",`Alle (${stock.length})`],["tires","Reifen"],["rims","Felgen"],["warn",`⚠ (${warns.length})`]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"8px 14px",fontSize:12,fontWeight:600,color:tab===k?"var(--ac)":"var(--t3)",borderBottom:tab===k?"2px solid var(--ac)":"2px solid transparent",background:"none",border:"none",borderBottomStyle:"solid",fontFamily:"var(--f)",cursor:"pointer",whiteSpace:"nowrap"}}>{l}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:4,marginBottom:16}}>
        {[["all","Alle"],["Sommer","☀️"],["Winter","❄️"],["Ganzjahr","🔄"]].map(([k,l])=>(
          <button key={k} className={`btn btn-s ${seasonFilter===k?"btn-p":""}`} onClick={()=>setSeasonFilter(k)}>{l}</button>
        ))}
      </div>

      {warns.length>0&&tab!=="warn"&&<div style={{padding:10,background:"var(--rdbg)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"var(--rs)",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:13}}>
        <span style={{color:"var(--rd)"}}>⚠ {warns.length} Artikel nachbestellen!</span>
        <button className="btn btn-s btn-r" onClick={()=>setTab("warn")}>Zeigen</button>
      </div>}

      {/* TABLE VIEW */}
      {view==="table"&&<div className="card" style={{padding:0}}><div className="tw" style={{padding:"0 18px"}}><table>
        <thead><tr><th>Artikel</th><th>Marke</th><th>Saison</th><th>Bestand</th><th>EK/VK</th><th>Ort</th><th>Aktionen</th></tr></thead>
        <tbody>{filtered.map(s=><tr key={s.id} style={{background:s.low?"var(--rdbg)":"transparent"}}>
          <td><span style={{fontFamily:"var(--m)",fontWeight:700,fontSize:14}}>{s.normgroesse}</span><br/><span style={{fontSize:11,color:"var(--t2)"}}>{s.modell}</span></td>
          <td>{s.brand_name}</td>
          <td><span className={`tag ${s.saison==="Winter"?"tag-b":s.saison==="Sommer"?"tag-o":"tag-y"}`}>{s.saison==="Winter"?"❄️":s.saison==="Sommer"?"☀️":"🔄"} {s.saison}</span></td>
          <td><span style={{fontFamily:"var(--m)",fontWeight:800,fontSize:16,color:s.qty<=0?"var(--rd)":s.low?"var(--yl)":"var(--gn)"}}>{s.qty}</span>
            <div style={{width:50,height:5,background:"var(--bg3)",borderRadius:3,marginTop:3}}><div style={{height:"100%",width:`${Math.min(100,(s.qty/Math.max(s.min_bestand||4,1))*100)}%`,background:s.qty<=0?"var(--rd)":s.low?"var(--yl)":"var(--gn)",borderRadius:3}}/></div>
          </td>
          <td style={{fontSize:11,fontFamily:"var(--m)",color:"var(--t2)"}}>{s.ek_cents?fmt(s.ek_cents):"-"} / {s.vk_cents?fmt(s.vk_cents):"-"}</td>
          <td style={{fontSize:12,color:"var(--t2)"}}>{s.standort}</td>
          <td><div style={{display:"flex",gap:3,alignItems:"center"}}>
            <input type="number" placeholder="Menge" value={stockQty[s.id]||""} onChange={e=>setStockQty(q=>({...q,[s.id]:e.target.value}))} style={{width:60,padding:"4px 6px",fontSize:12,textAlign:"center"}}/>
            <button className="btn btn-s btn-g" onClick={()=>{addStock(s.id,+(stockQty[s.id]||4));setStockQty(q=>({...q,[s.id]:""}))}}>+Rein</button>
            <button className="btn btn-s btn-r" onClick={()=>{addStock(s.id,-(+(stockQty[s.id]||1)));setStockQty(q=>({...q,[s.id]:""}))}}>−Raus</button>
            <button className="btn btn-s" onClick={()=>delItem(s.id)} style={{color:"var(--rd)",fontSize:14,padding:"3px 6px"}}>×</button>
          </div></td>
        </tr>)}
        {filtered.length===0&&<tr><td colSpan={7} style={{textAlign:"center",padding:40,color:"var(--t3)"}}>Keine Artikel gefunden</td></tr>}
        </tbody></table></div></div>}

      {/* CARD VIEW */}
      {view==="cards"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
        {filtered.map(s=>(
          <div key={s.id} className="card" style={{padding:14,borderLeft:`3px solid ${s.qty<=0?"var(--rd)":s.low?"var(--yl)":"var(--gn)"}`,margin:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
              <div>
                <div style={{fontFamily:"var(--m)",fontWeight:800,fontSize:18,color:"var(--ac)"}}>{s.normgroesse}</div>
                <div style={{fontWeight:600,marginTop:2}}>{s.brand_name} {s.modell}</div>
                <div style={{display:"flex",gap:6,marginTop:6}}>
                  <span className={`tag ${s.saison==="Winter"?"tag-b":s.saison==="Sommer"?"tag-o":"tag-y"}`}>{s.saison}</span>
                  <span className="tag" style={{background:"var(--bg3)",color:"var(--t2)"}}>{s.standort}</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"var(--m)",fontWeight:900,fontSize:24,color:s.qty<=0?"var(--rd)":s.low?"var(--yl)":"var(--gn)"}}>{s.qty}</div>
                <div style={{fontSize:10,color:"var(--t3)"}}>Min: {s.min_bestand||4}</div>
              </div>
            </div>
            {(s.ek_cents||s.vk_cents)&&<div style={{display:"flex",gap:12,marginTop:8,fontSize:12,color:"var(--t2)"}}>
              {s.ek_cents>0&&<span>EK: {fmt(s.ek_cents)}</span>}
              {s.vk_cents>0&&<span>VK: {fmt(s.vk_cents)}</span>}
              {s.ek_cents>0&&s.vk_cents>0&&<span style={{color:"var(--gn)"}}>Marge: {Math.round(((s.vk_cents-s.ek_cents)/s.vk_cents)*100)}%</span>}
            </div>}
            <div style={{display:"flex",gap:4,marginTop:10,alignItems:"center"}}>
              <input type="number" placeholder="Menge" value={stockQty[s.id]||""} onChange={e=>setStockQty(q=>({...q,[s.id]:e.target.value}))} style={{width:65,padding:"6px 8px",fontSize:13,textAlign:"center"}}/>
              <button className="btn btn-s btn-g" onClick={()=>{addStock(s.id,+(stockQty[s.id]||4));setStockQty(q=>({...q,[s.id]:""}))}}>+Rein</button>
              <button className="btn btn-s btn-r" onClick={()=>{addStock(s.id,-(+(stockQty[s.id]||1)));setStockQty(q=>({...q,[s.id]:""}))}}>−Raus</button>
            </div>
            {s.low&&<div style={{marginTop:8,padding:8,background:"var(--rdbg)",borderRadius:"var(--rs)",fontSize:12,color:"var(--rd)"}}>⚠ Nachbestellen! Bestand unter Minimum.</div>}
          </div>
        ))}
        {filtered.length===0&&<div className="card" style={{textAlign:"center",padding:40,color:"var(--t3)",gridColumn:"1/-1"}}>Keine Artikel gefunden</div>}
      </div>}
    </div>
  )
}

// ─── TERMINE ─────────────────────────────────────────────────
function TerminePage({termine,mitarbeiter,reload}) {
  const [showAdd,setShowAdd]=useState(false)
  const [form,setForm]=useState({kunde_name:"",kennzeichen:"",datum:today(),uhrzeit:"09:00",service:"Reifenwechsel 4x",notizen:""})
  const SERVICES=["Reifenwechsel 4x","Achsvermessung","Kompletträder","Felgen Montage","Reifencheck","Einlagerung","RDKS Service"]
  const TIMES=["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"]
  const todayT=termine.filter(t=>t.datum===today()).sort((a,b)=>(a.uhrzeit||"").localeCompare(b.uhrzeit||""))

  const add = async () => {
    if(!form.kunde_name) return
    await supabase.from("termine").insert({...form,status:"pending"})
    reload(); setShowAdd(false); setForm({kunde_name:"",kennzeichen:"",datum:today(),uhrzeit:"09:00",service:"Reifenwechsel 4x",notizen:""})
  }
  const toggle = async (id,cur) => { await supabase.from("termine").update({status:cur==="confirmed"?"pending":"confirmed"}).eq("id",id); reload() }

  return (
    <div className="fade-up">
      <button className="btn btn-p" onClick={()=>setShowAdd(!showAdd)} style={{marginBottom:16}}><I n="plus" s={14}/> Termin</button>
      {showAdd&&<div className="card fade-up" style={{borderColor:"var(--ac)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Kunde</div><input value={form.kunde_name} onChange={e=>setForm(f=>({...f,kunde_name:e.target.value}))}/></div>
          <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Kennzeichen</div><input value={form.kennzeichen} onChange={e=>setForm(f=>({...f,kennzeichen:e.target.value}))}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
          <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Datum</div><input type="date" value={form.datum} onChange={e=>setForm(f=>({...f,datum:e.target.value}))}/></div>
          <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Uhrzeit</div><select value={form.uhrzeit} onChange={e=>setForm(f=>({...f,uhrzeit:e.target.value}))}>{TIMES.map(t=><option key={t}>{t}</option>)}</select></div>
          <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Service</div><select value={form.service} onChange={e=>setForm(f=>({...f,service:e.target.value}))}>{SERVICES.map(s=><option key={s}>{s}</option>)}</select></div>
        </div>
        <button className="btn btn-p" style={{width:"100%"}} onClick={add}>✓ Speichern</button>
      </div>}
      {todayT.map(t=><div key={t.id} className={`tl-item ${t.status==="pending"?"pending":""}`}><div style={{fontFamily:"var(--m)",fontSize:13,color:"var(--t3)"}}>{t.uhrzeit?.slice(0,5)}</div><div style={{fontWeight:700,marginTop:4}}>{t.kunde_name}</div><div style={{fontSize:13,color:"var(--t2)"}}>{t.service}</div><div style={{display:"flex",gap:6,marginTop:10}}>{t.kennzeichen&&<span className="tag tag-b">{t.kennzeichen}</span>}<span className={`tag ${t.status==="confirmed"?"tag-g":"tag-y"}`}>{t.status==="confirmed"?"✓":"○"}</span></div><button className="btn btn-s" style={{marginTop:8}} onClick={()=>toggle(t.id,t.status)}>{t.status==="confirmed"?"↩":"✓ Bestätigen"}</button></div>)}
      {todayT.length===0&&<div className="card" style={{textAlign:"center",padding:40,color:"var(--t3)"}}>Keine Termine heute</div>}
    </div>
  )
}

// ─── AUFTRÄGE (optimiert: Telefon, Preis, Anzahlung, Marge) ──
function AuftraegePage({auftraege,lieferanten,kunden,reload,reloadKunden}) {
  const [showAdd,setShowAdd]=useState(false)
  const [filter,setFilter]=useState("all")
  const [editId,setEditId]=useState(null)
  const [form,setForm]=useState({kunde_name:"",kennzeichen:"",telefon:"",fahrzeug:"",artikel_text:"",menge:4,ek_cents:"",vk_cents:"",anzahlung:"",lieferant:"",notizen:""})
  const [custSuggestions,setCustSuggestions]=useState([])
  const [custNew,setCustNew]=useState(false)
  const STEPS=[{k:"neu",l:"Neu",c:"var(--bl)",icon:"📋"},{k:"bestellt",l:"Bestellt",c:"var(--yl)",icon:"📦"},{k:"anrufen",l:"Ware da",c:"var(--ac)",icon:"📞"},{k:"termin",l:"Termin",c:"var(--bl)",icon:"📅"},{k:"montiert",l:"Fertig",c:"var(--gn)",icon:"✅"}]
  const si=k=>STEPS.findIndex(s=>s.k===k)

  // Customer lookup when typing name
  const handleNameChange = (val) => {
    setForm(f=>({...f,kunde_name:val}))
    if(val.length>=2 && kunden) {
      const matches = kunden.filter(k=>k.name?.toLowerCase().includes(val.toLowerCase()))
      setCustSuggestions(matches.slice(0,5))
      setCustNew(matches.length===0)
    } else { setCustSuggestions([]); setCustNew(false) }
  }

  const selectCustomer = (c) => {
    setForm(f=>({...f,kunde_name:c.name,kennzeichen:c.kennzeichen||"",telefon:c.telefon||"",fahrzeug:c.fahrzeug||""}))
    setCustSuggestions([]); setCustNew(false)
  }

  const add = async () => {
    if(!form.kunde_name||!form.artikel_text) return
    // Auto-create customer if not exists
    if(custNew && form.kunde_name) {
      await supabase.from("kunden").insert({name:form.kunde_name,telefon:form.telefon,kennzeichen:form.kennzeichen,fahrzeug:form.fahrzeug})
      if(reloadKunden) reloadKunden()
    }
    await supabase.from("auftraege").insert({kunde_name:form.kunde_name,kennzeichen:form.kennzeichen,telefon:form.telefon,fahrzeug:form.fahrzeug,artikel_text:form.artikel_text,menge:+form.menge||4,ek_cents:(+form.ek_cents||0)*100,vk_cents:(+form.vk_cents||0)*100,anzahlung_cents:(+form.anzahlung||0)*100,lieferant:form.lieferant,notizen:form.notizen,status:"neu"})
    reload(); setShowAdd(false); resetForm()
  }

  const saveEdit = async () => {
    if(!editId) return
    await supabase.from("auftraege").update({kunde_name:form.kunde_name,kennzeichen:form.kennzeichen,telefon:form.telefon,fahrzeug:form.fahrzeug,artikel_text:form.artikel_text,menge:+form.menge||4,ek_cents:(+form.ek_cents||0)*100,vk_cents:(+form.vk_cents||0)*100,anzahlung_cents:(+form.anzahlung||0)*100,lieferant:form.lieferant,notizen:form.notizen}).eq("id",editId)
    reload(); setEditId(null); resetForm()
  }

  const startEdit = (o) => {
    setForm({kunde_name:o.kunde_name||"",kennzeichen:o.kennzeichen||"",telefon:o.telefon||"",fahrzeug:o.fahrzeug||"",artikel_text:o.artikel_text||"",menge:o.menge||4,ek_cents:o.ek_cents?(o.ek_cents/100)+"":"",vk_cents:o.vk_cents?(o.vk_cents/100)+"":"",anzahlung:o.anzahlung_cents?(o.anzahlung_cents/100)+"":"",lieferant:o.lieferant||"",notizen:o.notizen||""})
    setEditId(o.id); setShowAdd(true)
  }

  const resetForm = () => setForm({kunde_name:"",kennzeichen:"",telefon:"",fahrzeug:"",artikel_text:"",menge:4,ek_cents:"",vk_cents:"",anzahlung:"",lieferant:"",notizen:""})
  }
  const advance = async (id,cur) => {
    const i=si(cur); if(i>=STEPS.length-1) return; const next=STEPS[i+1].k
    const up={status:next}
    if(next==="bestellt") up.bestellt_am=new Date().toISOString()
    if(next==="anrufen") up.eingetroffen_am=new Date().toISOString()
    if(next==="termin") up.angerufen_am=new Date().toISOString()
    if(next==="montiert") up.erledigt_am=new Date().toISOString()
    await supabase.from("auftraege").update(up).eq("id",id); reload()
  }

  const visible = auftraege.filter(a=> filter==="all" ? a.status!=="storniert" : a.status===filter).sort((a,b)=>si(a.status)-si(b.status))
  const totalOpen = auftraege.filter(a=>a.status!=="montiert"&&a.status!=="storniert")
  const totalVK = totalOpen.reduce((s,o)=>s+(o.vk_cents||0)*(o.menge||1),0)

  return (
    <div className="fade-up">
      {/* Pipeline */}
      <div style={{display:"flex",gap:4,marginBottom:16,overflowX:"auto"}}>
        {STEPS.map((s,i)=>{const c=auftraege.filter(a=>a.status===s.k).length; return <div key={s.k} onClick={()=>setFilter(filter===s.k?"all":s.k)} style={{flex:1,minWidth:60,textAlign:"center",padding:"10px 4px",borderRadius:"var(--rs)",background:filter===s.k?"var(--acbg)":"var(--bg2)",border:`1px solid ${filter===s.k?"var(--ac)":"var(--bd)"}`,cursor:"pointer"}}>
          <div style={{fontSize:16}}>{s.icon}</div>
          <div style={{fontSize:9,fontWeight:700,color:s.c}}>{s.l}</div>
          <div style={{fontFamily:"var(--m)",fontSize:16,fontWeight:800}}>{c}</div>
        </div>})}
      </div>

      <div className="kpis">
        <div className="kpi o"><div className="kpi-l">Offen</div><div className="kpi-v">{totalOpen.length}</div></div>
        <div className="kpi g"><div className="kpi-l">Erwarteter Umsatz</div><div className="kpi-v">{fmt(totalVK)}</div></div>
        <div className="kpi b"><div className="kpi-l">Erledigt</div><div className="kpi-v">{auftraege.filter(a=>a.status==="montiert").length}</div></div>
      </div>

      <button className="btn btn-p" onClick={()=>{setShowAdd(!showAdd);setEditId(null);resetForm()}} style={{marginBottom:16}}><I n="plus" s={14}/> Neuer Auftrag</button>

      {showAdd&&<div className="card fade-up" style={{borderColor:editId?"var(--bl)":"var(--ac)"}}>
        <div className="card-h"><span className="card-t">{editId?"Auftrag bearbeiten":"Neuer Auftrag"}</span><button className="btn btn-s" onClick={()=>{setShowAdd(false);setEditId(null)}}><I n="x" s={12}/></button></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div style={{position:"relative"}}>
            <div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Kunde * {custNew&&<span style={{color:"var(--yl)"}}>— Neuer Kunde!</span>}</div>
            <input value={form.kunde_name} onChange={e=>handleNameChange(e.target.value)} placeholder="Name eingeben..."/>
            {custSuggestions.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"var(--bg2)",border:"1px solid var(--bd)",borderRadius:"var(--rs)",zIndex:10,maxHeight:150,overflowY:"auto"}}>
              {custSuggestions.map(c=><div key={c.id} onClick={()=>selectCustomer(c)} style={{padding:"8px 12px",cursor:"pointer",fontSize:13,borderBottom:"1px solid var(--bd)"}}><strong>{c.name}</strong> <span style={{color:"var(--t2)"}}>{c.kennzeichen} · {c.telefon}</span></div>)}
            </div>}
          </div>
          <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Telefon *</div><input value={form.telefon} onChange={e=>setForm(f=>({...f,telefon:e.target.value}))} placeholder="+49 170..." type="tel"/></div>
          <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Kennzeichen</div><input value={form.kennzeichen} onChange={e=>setForm(f=>({...f,kennzeichen:e.target.value}))} placeholder="B-XX 1234"/></div>
          <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Fahrzeug</div><input value={form.fahrzeug} onChange={e=>setForm(f=>({...f,fahrzeug:e.target.value}))} placeholder="VW Golf..."/></div>
        </div>
        <div style={{marginBottom:12}}><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Artikel *</div><input value={form.artikel_text} onChange={e=>setForm(f=>({...f,artikel_text:e.target.value}))} placeholder="4x 205/55R16 Michelin Primacy 4" style={{fontSize:15}}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:12}}>
          <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Menge</div><input type="number" value={form.menge} onChange={e=>setForm(f=>({...f,menge:e.target.value}))} placeholder="4"/></div>
          <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>EK/Stk €</div><input type="number" value={form.ek_cents} onChange={e=>setForm(f=>({...f,ek_cents:e.target.value}))} placeholder="55"/></div>
          <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>VK/Stk €</div><input type="number" value={form.vk_cents} onChange={e=>setForm(f=>({...f,vk_cents:e.target.value}))} placeholder="85"/></div>
          <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Lieferant</div><select value={form.lieferant} onChange={e=>setForm(f=>({...f,lieferant:e.target.value}))}><option value="">Wählen...</option>{lieferanten.map(l=><option key={l.id} value={l.name}>{l.name}</option>)}</select></div>
        </div>
        {form.ek_cents&&form.vk_cents&&<div style={{padding:12,background:"var(--bg)",borderRadius:"var(--rs)",marginBottom:12}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,fontSize:13}}>
            <div><div style={{fontSize:10,color:"var(--t3)"}}>EK gesamt</div><div style={{fontFamily:"var(--m)",fontWeight:700}}>{fmt((+form.ek_cents||0)*(+form.menge||1)*100)}</div></div>
            <div><div style={{fontSize:10,color:"var(--t3)"}}>VK gesamt</div><div style={{fontFamily:"var(--m)",fontWeight:700,color:"var(--ac)"}}>{fmt((+form.vk_cents||0)*(+form.menge||1)*100)}</div></div>
            <div><div style={{fontSize:10,color:"var(--t3)"}}>Marge</div><div style={{fontFamily:"var(--m)",fontWeight:700,color:"var(--gn)"}}>{fmt(((+form.vk_cents||0)-(+form.ek_cents||0))*(+form.menge||1)*100)}</div></div>
          </div>
          {+form.anzahlung>0&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid var(--bd)",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:13}}>
            <div><div style={{fontSize:10,color:"var(--t3)"}}>Anzahlung</div><div style={{fontFamily:"var(--m)",fontWeight:700,color:"var(--gn)"}}>{fmt((+form.anzahlung||0)*100)}</div></div>
            <div><div style={{fontSize:10,color:"var(--t3)"}}>Restbetrag</div><div style={{fontFamily:"var(--m)",fontWeight:700,color:"var(--yl)"}}>{fmt(((+form.vk_cents||0)*(+form.menge||1)-(+form.anzahlung||0))*100)}</div></div>
          </div>}
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Anzahlung €</div><input type="number" value={form.anzahlung} onChange={e=>setForm(f=>({...f,anzahlung:e.target.value}))} placeholder="0"/></div>
          <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Notiz</div><input value={form.notizen} onChange={e=>setForm(f=>({...f,notizen:e.target.value}))} placeholder="Eilig, Anzahlung bar..."/></div>
        </div>
        <button className="btn btn-p" style={{width:"100%",padding:14}} onClick={editId?saveEdit:add}>✓ {editId?"Änderungen speichern":"Auftrag anlegen"}{custNew?" + Kunde anlegen":""}</button>
      </div>}

      {/* Order Cards */}
      {visible.map(o=>{
        const step=STEPS[si(o.status)]; const next=STEPS[si(o.status)+1]
        const ek=(o.ek_cents||0)*(o.menge||1); const vk=(o.vk_cents||0)*(o.menge||1); const marge=vk-ek
        const anzahlung=o.anzahlung_cents||0; const rest=vk-anzahlung
        return <div key={o.id} className="card" style={{borderLeft:`3px solid ${step?.c||"var(--bd)"}`,padding:0,overflow:"hidden"}}>
          <div style={{height:3,background:"var(--bg)"}}><div style={{height:"100%",width:`${(si(o.status)/(STEPS.length-1))*100}%`,background:`linear-gradient(90deg,var(--bl),var(--gn))`}}/></div>
          <div style={{padding:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span className="tag" style={{background:`${step?.c}15`,color:step?.c}}>{step?.icon} {step?.l}</span>
                  {o.status==="anrufen"&&<span style={{fontSize:11,fontWeight:700,color:"var(--ac)"}}>ANRUFEN!</span>}
                </div>
                <div style={{fontWeight:700,fontSize:17,marginTop:8}}>{o.kunde_name}</div>
                <div style={{fontSize:13,color:"var(--t2)",marginTop:2}}>{o.fahrzeug} · <span style={{fontFamily:"var(--m)"}}>{o.kennzeichen}</span></div>
                {o.telefon&&<div style={{fontSize:13,marginTop:2}}>📱 <a href={`tel:${o.telefon}`} style={{color:"var(--ac)",textDecoration:"none"}}>{o.telefon}</a></div>}
              </div>
            </div>

            <div style={{background:"var(--bg)",borderRadius:"var(--rs)",padding:12,marginTop:12}}>
              <div style={{fontFamily:"var(--m)",fontSize:14,fontWeight:700,color:"var(--ac)"}}>{o.artikel_text}</div>
              <div style={{display:"flex",gap:12,marginTop:6,fontSize:12,color:"var(--t2)",flexWrap:"wrap"}}>
                {o.lieferant&&<span>📦 {o.lieferant}</span>}
                {o.menge&&<span>{o.menge} Stück</span>}
              </div>
              {o.notizen&&<div style={{fontSize:12,color:"var(--t3)",marginTop:4}}>{o.notizen}</div>}
            </div>

            {/* Preisübersicht */}
            {vk>0&&<div style={{display:"grid",gridTemplateColumns:anzahlung>0?"1fr 1fr 1fr 1fr 1fr":"1fr 1fr 1fr",gap:8,marginTop:12,padding:12,background:"var(--bg)",borderRadius:"var(--rs)"}}>
              <div><div style={{fontSize:9,color:"var(--t3)"}}>EK/Stk</div><div style={{fontFamily:"var(--m)",fontSize:13}}>{fmt(o.ek_cents||0)}</div></div>
              <div><div style={{fontSize:9,color:"var(--t3)"}}>VK/Stk</div><div style={{fontFamily:"var(--m)",fontSize:13}}>{fmt(o.vk_cents||0)}</div></div>
              <div><div style={{fontSize:9,color:"var(--t3)"}}>VK Gesamt</div><div style={{fontFamily:"var(--m)",fontSize:15,fontWeight:800,color:"var(--ac)"}}>{fmt(vk)}</div></div>
              {anzahlung>0&&<div><div style={{fontSize:9,color:"var(--t3)"}}>Anzahlung</div><div style={{fontFamily:"var(--m)",fontSize:13,color:"var(--gn)"}}>{fmt(anzahlung)}</div></div>}
              {anzahlung>0&&<div><div style={{fontSize:9,color:"var(--t3)"}}>Restbetrag</div><div style={{fontFamily:"var(--m)",fontSize:15,fontWeight:800,color:"var(--yl)"}}>{fmt(rest)}</div></div>}
            </div>}
            {marge>0&&<div style={{display:"flex",justifyContent:"space-between",marginTop:8,padding:"8px 12px",background:"var(--gnbg)",borderRadius:"var(--rs)"}}>
              <span style={{fontSize:12,color:"var(--gn)"}}>Marge</span>
              <span style={{fontFamily:"var(--m)",fontWeight:800,color:"var(--gn)"}}>{fmt(marge)} ({vk>0?Math.round((marge/vk)*100):0}%)</span>
            </div>}

            <div style={{display:"flex",gap:6,marginTop:12,flexWrap:"wrap"}}>
              {next&&<button className="btn btn-p btn-s" onClick={()=>advance(o.id,o.status)}>{step?.icon} → {next.icon} {next.l==="Bestellt"?"Jetzt bestellen":next.l==="Ware da"?"Eingetroffen":next.l==="Termin"?"Angerufen → Termin":"Montiert ✓"}</button>}
              {o.telefon&&<a href={`tel:${o.telefon}`} className="btn btn-s btn-g"><I n="phone" s={13}/> Anrufen</a>}
              {o.telefon&&<a href={`https://wa.me/${o.telefon.replace(/\D/g,"")}?text=${encodeURIComponent(`Hallo ${o.kunde_name.split(" ")[0]}! ${o.status==="anrufen"?"Ihre Bestellung bei ALFACARS ist eingetroffen! Wann passt Ihnen ein Termin?":o.status==="termin"?"Erinnerung: Ihr Termin bei ALFACARS steht an!":"Ihre Bestellung ist in Bearbeitung."}`)}`} className="btn btn-s" target="_blank" rel="noreferrer">WhatsApp</a>}
              <button className="btn btn-s" onClick={()=>startEdit(o)}>✏️ Bearbeiten</button>
              {o.status==="montiert"&&<span className="tag tag-g" style={{padding:"6px 12px"}}>✅ Erledigt</span>}
            </div>
          </div>
        </div>
      })}
      {visible.length===0&&<div className="card" style={{textAlign:"center",padding:40,color:"var(--t3)"}}>Keine Aufträge{filter!=="all"?` mit Status "${STEPS.find(s=>s.k===filter)?.l}"`:""}</div>}
    </div>
  )
}

// ─── KASSE (optimiert: Monat, Mitarbeiter, Bar/Karte) ────────
function KassePage({verkaeufe,mitarbeiter,reload}) {
  const [form,setForm]=useState({art:"TIRE",menge:4,betrag:"",beschreibung:"",zahlungsart:"bar",mitarbeiter_id:""})
  const [tab,setTab]=useState("pos")
  const [viewMonth,setViewMonth]=useState(new Date().getMonth())
  const todayV=verkaeufe.filter(v=>v.datum===today()); const todayRev=todayV.reduce((s,v)=>s+(v.betrag_cents||0),0)
  const monthNames=["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"]
  const monthV=verkaeufe.filter(v=>{const d=new Date(v.datum);return d.getMonth()===viewMonth}); const monthRev=monthV.reduce((s,v)=>s+(v.betrag_cents||0),0)
  const monthBar=monthV.filter(v=>v.zahlungsart==="bar").reduce((s,v)=>s+(v.betrag_cents||0),0)
  const monthKarte=monthV.filter(v=>v.zahlungsart==="karte").reduce((s,v)=>s+(v.betrag_cents||0),0)
  const monthRechnung=monthV.filter(v=>v.zahlungsart==="rechnung").reduce((s,v)=>s+(v.betrag_cents||0),0)
  const monthByEmp={}; monthV.forEach(v=>{const m=mitarbeiter.find(x=>x.id===v.mitarbeiter_id); if(m) monthByEmp[m.name]=(monthByEmp[m.name]||0)+(v.betrag_cents||0)})
  const maxEmp=Math.max(...Object.values(monthByEmp),1)

  const add = async () => {
    const c=parseInt(form.betrag)*100; if(!c||!form.beschreibung) return
    await supabase.from("verkaeufe").insert({art:form.art,menge:+form.menge,betrag_cents:c,beschreibung:form.beschreibung,zahlungsart:form.zahlungsart,mitarbeiter_id:form.mitarbeiter_id||null,datum:today()})
    reload(); setForm(f=>({...f,betrag:"",beschreibung:""}))
  }

  return (
    <div className="fade-up">
      <div style={{display:"flex",gap:2,marginBottom:16,borderBottom:"1px solid var(--bd)"}}>
        {[["pos","Kasse"],["today","Heute"],["month","Monatsbericht"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"10px 14px",fontSize:12,fontWeight:600,color:tab===k?"var(--ac)":"var(--t3)",borderBottom:tab===k?"2px solid var(--ac)":"2px solid transparent",background:"none",border:"none",borderBottomStyle:"solid",fontFamily:"var(--f)",cursor:"pointer"}}>{l}</button>
        ))}
      </div>

      {tab==="pos"&&<>
        <div className="kpis">
          <div className="kpi o"><div className="kpi-l">Heute</div><div className="kpi-v">{fmt(todayRev)}</div><div className="kpi-s">{todayV.length} Buchungen</div></div>
          <div className="kpi g"><div className="kpi-l">Bar</div><div className="kpi-v">{fmt(todayV.filter(v=>v.zahlungsart==="bar").reduce((s,v)=>s+(v.betrag_cents||0),0))}</div></div>
          <div className="kpi b"><div className="kpi-l">Karte</div><div className="kpi-v">{fmt(todayV.filter(v=>v.zahlungsart==="karte").reduce((s,v)=>s+(v.betrag_cents||0),0))}</div></div>
        </div>
        <div className="card" style={{borderColor:"var(--acbd)"}}>
          <div className="card-h"><span className="card-t">Neuer Verkauf</span></div>
          <div style={{display:"flex",gap:6,marginBottom:14}}>{[["TIRE","🛞 Reifen"],["ALIGNMENT","📐 AV"],["OTHER","🔧 Sonst"]].map(([k,l])=><button key={k} className={`btn ${form.art===k?"btn-p":""}`} onClick={()=>setForm(f=>({...f,art:k}))}>{l}</button>)}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
            <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Betrag €</div><input type="number" value={form.betrag} onChange={e=>setForm(f=>({...f,betrag:e.target.value}))} style={{fontSize:18,fontFamily:"var(--m)"}}/></div>
            <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Mitarbeiter</div><select value={form.mitarbeiter_id} onChange={e=>setForm(f=>({...f,mitarbeiter_id:e.target.value}))}><option value="">–</option>{mitarbeiter.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
            <div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Zahlung</div><select value={form.zahlungsart} onChange={e=>setForm(f=>({...f,zahlungsart:e.target.value}))}><option value="bar">💵 Bar</option><option value="karte">💳 Karte</option><option value="rechnung">📄 Rechnung</option></select></div>
          </div>
          <div style={{marginBottom:12}}><input value={form.beschreibung} onChange={e=>setForm(f=>({...f,beschreibung:e.target.value}))} placeholder="4x 205/55R16 Michelin..." style={{fontSize:15}}/></div>
          <button className="btn btn-p" style={{width:"100%",padding:14,fontSize:16}} onClick={add}>✓ Buchen{form.betrag?` (${form.betrag}€)`:""}</button>
        </div>
      </>}

      {tab==="today"&&<>
        <div className="kpis">
          <div className="kpi o"><div className="kpi-l">Gesamt heute</div><div className="kpi-v">{fmt(todayRev)}</div></div>
          <div className="kpi g"><div className="kpi-l">💵 Bar</div><div className="kpi-v">{fmt(todayV.filter(v=>v.zahlungsart==="bar").reduce((s,v)=>s+(v.betrag_cents||0),0))}</div></div>
          <div className="kpi b"><div className="kpi-l">💳 Karte</div><div className="kpi-v">{fmt(todayV.filter(v=>v.zahlungsart==="karte").reduce((s,v)=>s+(v.betrag_cents||0),0))}</div></div>
        </div>
        {todayV.length>0?<div className="card"><div className="tw"><table><thead><tr><th>Wer</th><th>Art</th><th>Betrag</th><th>Zahlung</th><th>Beschreibung</th></tr></thead>
          <tbody>{todayV.map(v=>{const m=mitarbeiter.find(x=>x.id===v.mitarbeiter_id);return <tr key={v.id}><td style={{fontWeight:600}}>{m?.name||"-"}</td><td><span className={`tag ${v.art==="TIRE"?"tag-o":"tag-b"}`}>{v.art==="TIRE"?"Reifen":v.art==="ALIGNMENT"?"AV":"Sonst"}</span></td><td style={{fontFamily:"var(--m)",color:"var(--gn)",fontWeight:700}}>{fmt(v.betrag_cents)}</td><td>{v.zahlungsart==="bar"?"💵":v.zahlungsart==="karte"?"💳":"📄"}</td><td style={{fontSize:12,color:"var(--t2)"}}>{v.beschreibung}</td></tr>})}</tbody>
        </table></div></div>:<div className="card" style={{textAlign:"center",padding:40,color:"var(--t3)"}}>Noch keine Buchungen heute</div>}
      </>}

      {tab==="month"&&<>
        <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center"}}>
          <button className="btn btn-s" onClick={()=>setViewMonth(m=>Math.max(0,m-1))}>←</button>
          <span style={{fontWeight:700,fontSize:16,flex:1,textAlign:"center"}}>{monthNames[viewMonth]} {new Date().getFullYear()}</span>
          <button className="btn btn-s" onClick={()=>setViewMonth(m=>Math.min(11,m+1))}>→</button>
        </div>
        <div className="kpis">
          <div className="kpi o"><div className="kpi-l">Gesamt</div><div className="kpi-v">{fmt(monthRev)}</div><div className="kpi-s">{monthV.length} Buchungen</div></div>
          <div className="kpi g"><div className="kpi-l">💵 Bar</div><div className="kpi-v">{fmt(monthBar)}</div></div>
          <div className="kpi b"><div className="kpi-l">💳 Karte</div><div className="kpi-v">{fmt(monthKarte)}</div></div>
          <div className="kpi y"><div className="kpi-l">📄 Rechnung</div><div className="kpi-v">{fmt(monthRechnung)}</div></div>
        </div>
        {Object.keys(monthByEmp).length>0&&<div className="card">
          <div className="card-h"><span className="card-t">Pro Mitarbeiter</span></div>
          {Object.entries(monthByEmp).sort((a,b)=>b[1]-a[1]).map(([name,rev],i)=>(
            <div key={name} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontWeight:700}}>{i===0?"🥇":i===1?"🥈":"🥉"} {name}</span>
                <span style={{fontFamily:"var(--m)",fontWeight:700}}>{fmt(rev)}</span>
              </div>
              <div style={{height:10,background:"var(--bg)",borderRadius:5}}><div style={{height:"100%",width:`${(rev/maxEmp)*100}%`,background:i===0?"var(--ac)":"var(--bl)",borderRadius:5}}/></div>
            </div>
          ))}
        </div>}
        {monthV.length>0&&<div className="card"><div className="card-h"><span className="card-t">Alle Buchungen</span></div><div className="tw"><table><thead><tr><th>Datum</th><th>Wer</th><th>Art</th><th>Betrag</th><th>Zahlung</th><th>Beschreibung</th></tr></thead>
          <tbody>{monthV.sort((a,b)=>b.datum?.localeCompare(a.datum)).map(v=>{const m=mitarbeiter.find(x=>x.id===v.mitarbeiter_id);return <tr key={v.id}><td>{v.datum}</td><td>{m?.name||"-"}</td><td><span className={`tag ${v.art==="TIRE"?"tag-o":"tag-b"}`}>{v.art}</span></td><td style={{fontFamily:"var(--m)",color:"var(--gn)"}}>{fmt(v.betrag_cents)}</td><td>{v.zahlungsart==="bar"?"💵":v.zahlungsart==="karte"?"💳":"📄"}</td><td style={{fontSize:12,color:"var(--t2)"}}>{v.beschreibung}</td></tr>})}</tbody>
        </table></div></div>}
      </>}
    </div>
  )
}

// ─── KUNDEN ──────────────────────────────────────────────────
function KundenPage({kunden,reload}) {
  const [q,setQ]=useState(""); const [showAdd,setShowAdd]=useState(false)
  const [form,setForm]=useState({name:"",telefon:"",kennzeichen:"",fahrzeug:"",notizen:""})
  const add = async () => { if(!form.name) return; await supabase.from("kunden").insert(form); reload(); setShowAdd(false); setForm({name:"",telefon:"",kennzeichen:"",fahrzeug:"",notizen:""}) }
  const filtered=kunden.filter(c=>{if(!q) return true; const ql=q.toLowerCase(); return c.name?.toLowerCase().includes(ql)||c.kennzeichen?.toLowerCase().includes(ql)})

  return (
    <div className="fade-up">
      <div style={{display:"flex",gap:8,marginBottom:16}}><button className="btn btn-p" onClick={()=>setShowAdd(!showAdd)}><I n="plus" s={14}/> Kunde</button><div style={{flex:1,display:"flex",alignItems:"center",gap:8,background:"var(--bg)",border:"1px solid var(--bd)",borderRadius:"var(--rs)",padding:"0 12px"}}><I n="search" s={14}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Suchen..." style={{border:"none",background:"none",padding:"10px 0"}}/></div></div>
      {showAdd&&<div className="card fade-up" style={{borderColor:"var(--ac)"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Name</div><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div><div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Telefon</div><input value={form.telefon} onChange={e=>setForm(f=>({...f,telefon:e.target.value}))}/></div><div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Kennzeichen</div><input value={form.kennzeichen} onChange={e=>setForm(f=>({...f,kennzeichen:e.target.value}))}/></div><div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Fahrzeug</div><input value={form.fahrzeug} onChange={e=>setForm(f=>({...f,fahrzeug:e.target.value}))}/></div></div><button className="btn btn-p" style={{width:"100%"}} onClick={add}>✓ Anlegen</button></div>}
      {filtered.map(c=><div key={c.id} className="card" style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:44,height:44,borderRadius:12,background:"var(--acbg)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:18,color:"var(--ac)"}}>{c.name?.[0]}</div><div style={{flex:1}}><div style={{fontWeight:700}}>{c.name}</div><div style={{fontSize:12,color:"var(--t2)"}}>{c.kennzeichen} · {c.fahrzeug} · {c.telefon}</div></div>{c.telefon&&<a href={`tel:${c.telefon}`} className="btn btn-s"><I n="phone" s={13}/></a>}</div>)}
    </div>
  )
}

// ─── HOTEL ───────────────────────────────────────────────────
function HotelPage({reifenhotel,reload}) {
  const [showAdd,setShowAdd]=useState(false)
  const [form,setForm]=useState({kunde_name:"",kennzeichen:"",fahrzeug:"",reifen_text:"",dot:"",profiltiefe:"",saison:"Winter",box:"",notizen:""})
  const add = async () => { if(!form.kunde_name||!form.reifen_text||!form.box) return; await supabase.from("reifenhotel").insert({...form,lager_standort:"Frankfurt",status:"eingelagert"}); reload(); setShowAdd(false) }

  return (
    <div className="fade-up">
      <div className="kpis"><div className="kpi o"><div className="kpi-l">Eingelagert</div><div className="kpi-v">{reifenhotel.filter(r=>r.status==="eingelagert").length}</div></div><div className="kpi b"><div className="kpi-l">Winter</div><div className="kpi-v">{reifenhotel.filter(r=>r.saison==="Winter").length}</div></div><div className="kpi y"><div className="kpi-l">Sommer</div><div className="kpi-v">{reifenhotel.filter(r=>r.saison==="Sommer").length}</div></div></div>
      <button className="btn btn-p" onClick={()=>setShowAdd(!showAdd)} style={{marginBottom:16}}><I n="plus" s={14}/> Einlagern</button>
      {showAdd&&<div className="card fade-up" style={{borderColor:"var(--ac)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}><div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Kunde</div><input value={form.kunde_name} onChange={e=>setForm(f=>({...f,kunde_name:e.target.value}))}/></div><div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Kennzeichen</div><input value={form.kennzeichen} onChange={e=>setForm(f=>({...f,kennzeichen:e.target.value}))}/></div><div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Fahrzeug</div><input value={form.fahrzeug} onChange={e=>setForm(f=>({...f,fahrzeug:e.target.value}))}/></div><div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Box</div><input value={form.box} onChange={e=>setForm(f=>({...f,box:e.target.value}))} placeholder="Box 14"/></div></div>
        <div style={{marginBottom:12}}><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Reifen</div><input value={form.reifen_text} onChange={e=>setForm(f=>({...f,reifen_text:e.target.value}))} placeholder="4x 205/55R16 Continental" style={{fontSize:15}}/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}><div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>DOT</div><input value={form.dot} onChange={e=>setForm(f=>({...f,dot:e.target.value}))}/></div><div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Profil</div><input value={form.profiltiefe} onChange={e=>setForm(f=>({...f,profiltiefe:e.target.value}))}/></div><div><div style={{fontSize:10,color:"var(--t3)",marginBottom:4}}>Saison</div><select value={form.saison} onChange={e=>setForm(f=>({...f,saison:e.target.value}))}><option>Winter</option><option>Sommer</option></select></div></div>
        <button className="btn btn-p" style={{width:"100%"}} onClick={add}>✓ Einlagern</button>
      </div>}
      {reifenhotel.filter(r=>r.status==="eingelagert").map(s=><div key={s.id} className="card" style={{borderLeft:`3px solid ${s.saison==="Winter"?"var(--bl)":"var(--yl)"}`}}><div style={{display:"flex",justifyContent:"space-between"}}><div><div style={{fontWeight:700}}>{s.kunde_name}</div><div style={{fontSize:12,color:"var(--t2)"}}>{s.fahrzeug} · {s.kennzeichen}</div><div style={{fontFamily:"var(--m)",color:"var(--ac)",marginTop:6}}>{s.reifen_text}</div><div style={{fontSize:12,color:"var(--t3)",marginTop:4}}>DOT:{s.dot} Profil:{s.profiltiefe}</div></div><div style={{textAlign:"right"}}><div style={{fontFamily:"var(--m)",fontWeight:800,color:"var(--bl)"}}>{s.box}</div><span className={`tag ${s.saison==="Winter"?"tag-b":"tag-y"}`}>{s.saison}</span></div></div></div>)}
    </div>
  )
}

// ─── ANALYSE ─────────────────────────────────────────────────
function AnalysePage({data,stock}) {
  const monthV=data.verkaeufe.filter(v=>v.datum>=today().slice(0,7)+"-01"); const monthRev=monthV.reduce((s,v)=>s+(v.betrag_cents||0),0)
  const byArt={}; monthV.forEach(v=>{byArt[v.art]=(byArt[v.art]||0)+(v.betrag_cents||0)}); const maxA=Math.max(...Object.values(byArt),1)
  return (
    <div className="fade-up">
      <div className="kpis"><div className="kpi o"><div className="kpi-l">Monat</div><div className="kpi-v">{fmt(monthRev)}</div><div className="kpi-s">{monthV.length} Verkäufe</div></div><div className="kpi g"><div className="kpi-l">Aufträge erledigt</div><div className="kpi-v">{data.auftraege.filter(a=>a.status==="montiert").length}</div></div><div className="kpi b"><div className="kpi-l">Lager</div><div className="kpi-v">{stock.length} Artikel</div></div></div>
      <div className="card"><div className="card-h"><span className="card-t">Umsatz nach Kategorie</span></div>
        {Object.entries(byArt).sort((a,b)=>b[1]-a[1]).map(([art,rev])=><div key={art} style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontWeight:600}}>{art==="TIRE"?"Reifen":art==="ALIGNMENT"?"Vermessung":"Sonstiges"}</span><span style={{fontFamily:"var(--m)",fontWeight:700}}>{fmt(rev)}</span></div><div style={{height:10,background:"var(--bg)",borderRadius:5}}><div style={{height:"100%",width:`${(rev/maxA)*100}%`,background:"var(--ac)",borderRadius:5}}/></div></div>)}
      </div>
      {data.marktdaten.length>0&&<div className="card"><div className="card-h"><span className="card-t">Marktdaten</span></div><div className="tw"><table><thead><tr><th>Größe</th><th>Nachfrage</th><th>Trend</th><th>EK</th><th>VK</th></tr></thead>
        <tbody>{data.marktdaten.map(m=><tr key={m.id}><td style={{fontFamily:"var(--m)",fontWeight:700}}>{m.normgroesse}</td><td><span className="tag tag-g">{m.nachfrage}</span></td><td>{m.trend==="up"?"📈":"➡️"}</td><td style={{fontFamily:"var(--m)"}}>{fmt(m.ek_durchschnitt_cents)}</td><td style={{fontFamily:"var(--m)"}}>{fmt(m.vk_durchschnitt_cents)}</td></tr>)}</tbody>
      </table></div></div>}
    </div>
  )
}

// ─── ALPHA ───────────────────────────────────────────────────
function AlphaPanel({open,close,stock,termine,data,warns}) {
  const [msgs,setMsgs]=useState([]); const [inp,setInp]=useState(""); const [busy,setBusy]=useState(false); const end=useRef(null); const hist=useRef([])

  useEffect(()=>{if(open&&msgs.length===0){const h=new Date().getHours();const g=h<12?"Moin":h<18?"Hey":"N'Abend";const rev=data.verkaeufe.filter(v=>v.datum>=today().slice(0,7)+"-01").reduce((s,v)=>s+(v.betrag_cents||0),0);const tc=data.auftraege.filter(a=>a.status==="anrufen");let m=`${g} Chef!\n\n${termine.length} Termine heute`;if(tc.length)m+=`, ${tc.length}x Ware da – anrufen!`;m+=`\nMonat: ${fmt(rev)}`;if(warns.length)m+=` · ${warns.length} Warnungen`;m+=`\n\nFrag mich was du willst!`;setMsgs([{r:"a",t:m}])}},[open])
  useEffect(()=>{end.current?.scrollIntoView({behavior:"smooth"})},[msgs])

  const send = async (text) => {
    const m=text||inp.trim(); if(!m) return; setInp(""); setMsgs(p=>[...p,{r:"u",t:m}]); setBusy(true)
    hist.current.push({role:"user",content:m}); if(hist.current.length>10) hist.current=hist.current.slice(-10)
    const rev=data.verkaeufe.filter(v=>v.datum>=today().slice(0,7)+"-01").reduce((s,v)=>s+(v.betrag_cents||0),0)
    const ctx=`ALFACARS Berlin · ${today()}\nTermine: ${termine.map(t=>`${t.uhrzeit?.slice(0,5)} ${t.kunde_name}`).join("; ")||"keine"}\nAufträge offen: ${data.auftraege.filter(a=>a.status!=="montiert").map(a=>`${a.kunde_name}:${a.status} ${a.artikel_text}`).join("; ")||"keine"}\nUmsatz: ${fmt(rev)} · Warnungen: ${warns.map(w=>`${w.brand_name} ${w.normgroesse}:${w.qty}`).join("; ")||"keine"}\nKunden: ${data.kunden.map(k=>`${k.name}(${k.kennzeichen})`).join("; ")||"keine"}`
    try {
      const res=await fetch("/api/alpha",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:hist.current,context:ctx})})
      const d=await res.json(); const reply=d.reply
      if(reply){hist.current.push({role:"assistant",content:reply});setMsgs(p=>[...p,{r:"a",t:reply,cl:true}])}
      else setMsgs(p=>[...p,{r:"a",t:"Sag nochmal?"}])
    }catch{setMsgs(p=>[...p,{r:"a",t:"Keine Verbindung."}])}
    setBusy(false)
  }

  return (
    <div className={`alpha ${open?"open":""}`}>
      <div className="alpha-head"><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,var(--ac),#FF3D00)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"white"}}>α</div><div><div style={{fontWeight:700}}>Alpha</div><div style={{fontSize:10,color:"var(--gn)"}}>● Live</div></div></div><button className="btn btn-s" onClick={close}><I n="x" s={14}/></button></div>
      <div className="alpha-msgs">{msgs.map((m,i)=><div key={i} className={`alpha-msg ${m.r==="u"?"u":"a"}`} style={m.cl?{borderLeft:"3px solid var(--gn)"}:{}}>{m.r==="a"&&<div style={{fontSize:9,fontWeight:700,color:m.cl?"var(--gn)":"var(--ac)",marginBottom:3}}>{m.cl?"ALPHA·CLAUDE":"ALPHA"}</div>}{m.t}</div>)}{busy&&<div className="alpha-msg a"><span className="pulse">🧠...</span></div>}<div ref={end}/></div>
      <div className="alpha-qk">{["Was geht?","Wen anrufen?","Was knapp?","Umsatz?"].map((q,i)=><button key={i} className="btn btn-s" onClick={()=>send(q)}>{q}</button>)}</div>
      <div className="alpha-bar"><input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Frag Alpha..." style={{fontSize:15}}/><button className="btn btn-s btn-p" onClick={()=>send()}>→</button></div>
    </div>
  )
}
