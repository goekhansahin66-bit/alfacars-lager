/* ================================
   SUPABASE – INITIALISIERUNG (TEST)
================================ */

let supabaseClient = null;

(function initSupabase() {
  // Vercel ENV Variablen sind im Browser NICHT direkt verfügbar
  // → wir lesen sie hier bewusst NICHT über import.meta

  const url = "https://vocyuvgkbswoevikbbxa.supabase.co";
  const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvY3l1dmdrYnN3b2V2aWtiYnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTU1NzMsImV4cCI6MjA4NTg3MTU3M30.S8ROC7E3xaX2H6pv40p8rL1zDMQX89bNavz-GRfXKQI";

  if (!url || !anonKey) {
    console.warn("⚠️ Supabase Konfiguration fehlt");
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    console.error("❌ Supabase Library nicht geladen");
    return;
  }

  supabaseClient = window.supabase.createClient('https://vocyuvgkbswoevikbbxa.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvY3l1dmdrYnN3b2V2aWtiYnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTU1NzMsImV4cCI6MjA4NTg3MTU3M30.S8ROC7E3xaX2H6pv40p8rL1zDMQX89bNavz-GRfXKQI');
  console.log("✅ Supabase verbunden");
})()

/* ================================
   SUPABASE  – LOGIN (NEU)
   - Lesen für alle möglich (wenn RLS so gesetzt)
   - Schreiben (INSERT/UPDATE/DELETE) nur wenn eingeloggt
================================= */

let currentSession = null;

function isUuid(v){
  return typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

function newUuid(){
  try {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
  } catch(e){}
  // Fallback (RFC4122-ish)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c=>{
    const r = Math.random()*16|0, v = c==="x"?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

async function refreshSession(){
  if(!supabaseClient) return null;
  const { data } = await supabaseClient.auth.getSession();
  currentSession = data?.session || null;
  updateAuthUi();
  return currentSession;
}

function updateAuthUi(){
  const el = document.getElementById("authStatus");
  if(!el) return;
  if(currentSession?.user?.email){
    el.textContent = "✅ : " + currentSession.user.email;
    el.classList.add("ok");
  } else {
    el.textContent = "🔒 Nicht eingeloggt";
    el.classList.remove("ok");
  }
}

function ensureAuthBar(){
  if(document.getElementById("authBar")) return;

  const bar = document.createElement("div");
  bar.id = "authBar";
  bar.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:9999;background:#0b1220;color:#fff;padding:10px 12px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.25);font:13px system-ui;max-width:92vw";
  bar.innerHTML = `
    <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <div id="authStatus" style="opacity:.95">🔒 Nicht eingeloggt</div>
      <button id="btn" style="background:#2563eb;color:#fff;border:0;border-radius:10px;padding:6px 10px;cursor:pointer"></button>
      <button id="btnLogout" style="background:#334155;color:#fff;border:0;border-radius:10px;padding:6px 10px;cursor:pointer">Logout</button>
    </div>
  `;
  document.body.appendChild(bar);

  document.getElementById("btn").onclick = () => openModal();
  document.getElementById("btnLogout").onclick = async () => {
    if(!supabaseClient) return;
    await supabaseClient.auth.signOut();
    await refreshSession();
  };

  updateAuthUi();
}

function openModal(){
  if(document.getElementById("loginModal")) return;

  const wrap = document.createElement("div");
  wrap.id = "loginModal";
  wrap.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:10000;display:flex;align-items:center;justify-content:center;padding:14px";
  wrap.innerHTML = `
    <div style="background:#fff;border-radius:14px;max-width:420px;width:100%;padding:16px;box-shadow:0 20px 60px rgba(0,0,0,.35)">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <strong></strong>
        <button id="loginClose" style="border:0;background:transparent;font-size:20px;cursor:pointer">×</button>
      </div>
      <div style="margin-top:10px;display:grid;gap:10px">
        <input id="loginEmail" placeholder="E-Mail" type="email" style="padding:10px;border:1px solid #ddd;border-radius:10px"/>
        <input id="loginPass" placeholder="Passwort" type="password" style="padding:10px;border:1px solid #ddd;border-radius:10px"/>
        <button id="loginDo" style="background:#2563eb;color:#fff;border:0;border-radius:10px;padding:10px;cursor:pointer">Einloggen</button>
        <div style="font-size:12px;color:#334155">Nur eingeloggte Nutzer dürfen Lager bearbeiten.</div>
        <div id="loginErr" style="font-size:12px;color:#b91c1c"></div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  const close = () => wrap.remove();
  document.getElementById("loginClose").onclick = close;
  wrap.addEventListener("click",(e)=>{ if(e.target===wrap) close(); });

  document.getElementById("loginDo").onclick = async () => {
    const email = (document.getElementById("loginEmail").value||"").trim();
    const password = document.getElementById("loginPass").value||"";
    const errEl = document.getElementById("loginErr");
    errEl.textContent = "";

    if(!email || !password){
      errEl.textContent = "Bitte E-Mail und Passwort eingeben.";
      return;
    }

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if(error){
      errEl.textContent = error.message;
      return;
    }
    await refreshSession();
    close();
    // Nach : Stock neu laden, damit Handy/PC sofort die Cloud-Daten sieht
    try { await loadStockFromSupabase(); } catch(e) {}
  };
}

async function requireOrThrow(){
  await refreshSession();
  if(!currentSession){
    ensureAuthBar();
    openModal();
    throw new Error("NOT_LOGGED_IN");
  }
}

// Auth Listener
if(supabaseClient){
  supabaseClient.auth.onAuthStateChange(async () => {
    await refreshSession();
  });
}
;




/* =========================================================
   SUPABASE – ORDERS (SOURCE OF TRUTH)
   - Orders werden ausschließlich in Supabase gespeichert.
   - localStorage wird NICHT mehr für Orders genutzt.
   ========================================================= */

// ✅ Tabelle (erwartet): orders
// Spalten (mindestens): id, created_at, status, customerId, size, brand, season, qty, unit, deposit, rims, note, orderSource
// (created wird im UI als Anzeige-Feld genutzt und bei Bedarf aus created_at abgeleitet.)
// Hinweis: Wenn eure Spalten anders heißen, bitte in mapOrderForDb() anpassen.
const SUPABASE_ORDERS_TABLE = "orders";

function mapOrderForDb(o){
  // ✅ zentrale Stelle, damit später Wartung einfach bleibt
  // Wichtig: created_at wird in Supabase als Timestamp geführt.
  // - Bei neuen Orders lassen wir created_at weg (DB default: now()).
  // - Bei Updates schicken wir created_at ebenfalls NICHT mit, damit es unverändert bleibt.
  return {
    id: o.id,
    status: o.status,
    customerid: o.customerId,
    size: o.size,
    brand: o.brand,
    season: o.season,
    qty: o.qty,
    unit: o.unit,
    deposit: o.deposit,
    rims: o.rims,
    note: o.note,
    orderSource: o.orderSource
  };
}

// ✅ DB → UI Normalisierung (created Feld für Anzeige beibehalten, aber Quelle ist created_at)

/* ================================
   GLOBAL FIXES – CUSTOMER CACHE
   ================================ */

// Global customer cache used by normalizeOrderFromDb
let customersById = new Map();

function rebuildCustomersIndex(){
  customersById = new Map();
  (customers || []).forEach(c => {
    if (c && c.id) customersById.set(c.id, c);
  });
}

// Used by Supabase save + load flows
function upsertCustomerInMemory(customer){
  if (!customer || !customer.id) return;
  const existing = customers.find(c => c.id === customer.id);
  if (existing){
    Object.assign(existing, customer);
  } else {
    customers.unshift(customer);
  }
  customersById.set(customer.id, customer);
}


function normalizeOrderFromDb(row) {
  // row may come with or without joined customer object.
  const cid = row ? (row.customerid || row.customer_id || row.customerId) : null;
  const joinedCustomer = row && row.customers ? row.customers : null;
  const cachedCustomer = (cid && customersById && customersById.get) ? customersById.get(cid) : null;
  const listCustomer = cid ? (customers.find(c => c && c.id === cid) || null) : null;

  const customer = joinedCustomer || cachedCustomer || listCustomer || {};

  return {
    id: row.id,
    status: row.status || "ordered",
    created: row.created_at ? new Date(row.created_at).toLocaleString("de-DE") : "",
    createdAt: row.created_at ? new Date(row.created_at).toLocaleString("de-DE") : "",
    customerId: cid || "",
    customerName: customer.name || row.customername || row.customer_name || "Unbekannter Kunde",
    customerPhone: customer.phone || row.customerphone || row.customer_phone || "",
    licensePlate: (customer.license_plate || customer.plate) || row.license_plate || row.licensePlate || "",
    customerEmail: customer.email || row.customeremail || row.customer_email || "",
    size: row.size || "",
    brand: row.brand || "",
    season: row.season || "",
    model: row.model || "",
    qty: Number(row.qty || 0),
    unit: Number(row.unit || 0),
    deposit: Number(row.deposit || 0),
    rims: row.rims || "",
    note: row.note || "",
    orderSource: row.orderSource || row.order_source || "supabase"
  };
}



async function initOrdersFromSupabase() {
  if (!supabaseClient){
    console.warn("⚠️ Supabase nicht verbunden – Orders können nicht geladen werden.");
    orders = [];
    return;
  }

  // 1) Orders aus Supabase laden
  //    Versuche zuerst JOIN auf customers (falls FK-Relation in Supabase existiert).
  //    Wenn keine Relation existiert, fällt es automatisch auf select("*") zurück.
  let data = null;
  let error = null;

  // Try joined select (best for reliable customer names)
  const joined = await supabaseClient
    .from(SUPABASE_ORDERS_TABLE)
    .select('*, customers (id,name,phone,license_plate,email)')
    .order("created_at", { ascending: false });

  if (joined && joined.error){
    // Fallback: no relationship defined → plain select
    const plain = await supabaseClient
      .from(SUPABASE_ORDERS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    data = plain.data;
    error = plain.error;
  } else {
    data = joined.data;
    error = joined.error;
  }

  if (error){
    console.error("❌ Fehler beim Laden der Orders:", error.message);
    alert("Fehler beim Laden der Bestellungen aus Supabase.");
    orders = [];
    return;
  }

  // 2) Kunden für die geladenen Orders holen (robust, unabhängig von FK-Join)
  try {
    const ids = Array.isArray(data)
      ? [...new Set(data.map(r => r && (r.customerid || r.customer_id || r.customerId)).filter(Boolean))]
      : [];
    if (ids.length) {
      const { data: cdata, error: cerr } = await supabaseClient
        .from("customers")
        .select("id,name,phone,license_plate,email")
        .in("id", ids.filter(id => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id)));

      if (!cerr && Array.isArray(cdata)) {
        cdata.forEach(upsertCustomerInMemory);
        // optional: persist customers for offline fallback
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customers));
      }
    }
  } catch (_) {}

  orders = Array.isArray(data) ? data.map(normalizeOrderFromDb) : [];
}

async function initCustomersFromSupabase() {
  if (!supabaseClient) {
    console.warn("⚠️ Supabase nicht verbunden – Kunden können nicht geladen werden.");
    return;
  }

  const { data, error } = await supabaseClient
    .from("customers")
    .select("id,name,phone,license_plate,email,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Fehler beim Laden der Kunden:", error.message);
    return;
  }

  customers = Array.isArray(data)
    ? data.map(c => ({
        id: c.id,
        name: c.name || "",
        phone: c.phone || "",
        license_plate: c.license_plate || "",
        email: c.email || "",
        created_at: c.created_at || null
      }))
    : [];

  rebuildCustomersIndex();
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customers)); // offline fallback
}


async function saveOrderToSupabase(currentOrder){
  // ✅ EINZIGE Speicherroutine für Orders
  if (!supabaseClient){
    alert("Supabase nicht verbunden");
    return { ok:false, error:"Supabase not connected" };
  }
// 🧑 Kunde in Supabase sicherstellen
  // - Wenn currentOrder.customerId bereits eine UUID ist: nutzen wir sie.
  // - Sonst (Legacy/localStorage): wir suchen per phone/email/plate und legen sonst neu an.
  const customerPayload = {
    name: currentOrder.customerName?.trim() || null,
    phone: currentOrder.customerPhone?.trim() || null,
    license_plate: currentOrder.licensePlate?.trim() || null,
    email: currentOrder.customerEmail?.trim() || null
  };

  const looksUuid =
    typeof currentOrder.customerId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentOrder.customerId);

  let customer = null;

  if (looksUuid){
    customer = { id: currentOrder.customerId };
  } else {
    // 1) Versuche vorhandenen Kunden zu finden (verhindert Duplikate)
    const orParts = [];
    if (customerPayload.phone) orParts.push(`phone.eq.${customerPayload.phone}`);
    if (customerPayload.email) orParts.push(`email.eq.${customerPayload.email}`);
    if (customerPayload.license_plate) orParts.push(`license_plate.eq.${customerPayload.license_plate}`);

    if (orParts.length){
      const { data: found, error: findError } = await supabaseClient
        .from("customers")
        .select("id,name,phone,license_plate,email")
        .or(orParts.join(","))
        .limit(1);

      if (findError) {
        console.warn("⚠️ Kunde-Suche fehlgeschlagen (wird neu angelegt):", findError.message);
      } else if (Array.isArray(found) && found.length){
        customer = found[0];
      }
    }

    // 2) Falls nicht gefunden: neu anlegen
    if (!customer){
      const { data: inserted, error: customerError } = await supabaseClient
        .from("customers")
        .insert(customerPayload)
        .select()
        .single();

      if (customerError) {
        console.error("❌ Fehler beim Speichern des Kunden:", customerError.message);
        alert("Fehler beim Speichern des Kunden");
        return { ok: false, error: customerError.message };
      }

      customer = inserted;
    }
  }

  // ✅ Bestellung muss auf die UUID zeigen
  currentOrder.customerId = customer.id;

  
    // Customer-Cache aktualisieren (damit UI sofort Name/Telefon/Kennzeichen zeigt)
    upsertCustomerInMemory({
      id: customer.id,
      name: (customer.name || currentOrder.customerName || "").trim(),
      phone: (customer.phone || currentOrder.customerPhone || "").trim(),
      license_plate: (customer.license_plate || currentOrder.licensePlate || "").trim(),
      plate: (customer.license_plate || currentOrder.licensePlate || "").trim(),
      email: (customer.email || currentOrder.customerEmail || "").trim()
    });
const payload = mapOrderForDb(currentOrder);
  payload.customerid = customer.id;
  delete payload.customer_id;


  // Upsert: Insert bei Neu, Update bei bestehender ID
  const { data, error } = await supabaseClient
    .from(SUPABASE_ORDERS_TABLE)
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error){
    console.error("❌ Fehler beim Speichern:", error.message);
    alert("Fehler beim Speichern der Bestellung (Supabase).");
    return { ok:false, error:error.message };
  }

  // ✅ In-Memory State aktualisieren (kein Reload nötig)
  const normalized = normalizeOrderFromDb(data);

  const idx = orders.findIndex(o => o.id === normalized.id);
  if (idx >= 0) orders[idx] = normalized;
  else orders.unshift(normalized);

  return { ok:true, data: normalized };
}

async function deleteOrderFromSupabase(orderId){
  if (!supabaseClient){
    alert("Supabase nicht verbunden");
    return { ok:false };
  }
  const { error } = await supabaseClient
    .from(SUPABASE_ORDERS_TABLE)
    .delete()
    .eq("id", orderId);

  if (error){
    console.error("❌ Fehler beim Löschen:", error.message);
    alert("Fehler beim Löschen (Supabase).");
    return { ok:false, error:error.message };
  }
  return { ok:true };
}

async function updateOrderStatusInSupabase(orderId, newStatus){
  if (!supabaseClient){
    alert("Supabase nicht verbunden");
    return { ok:false };
  }
  const { data, error } = await supabaseClient
    .from(SUPABASE_ORDERS_TABLE)
    .update({ status: newStatus })
    .eq("id", orderId)
    .select()
    .single();

  if (error){
    console.error("❌ Fehler beim Status-Update:", error.message);
    alert("Fehler beim Aktualisieren des Status (Supabase).");
    return { ok:false, error:error.message };
  }

  // In-Memory update
  const normalized = normalizeOrderFromDb(data);
  const idx = orders.findIndex(o => o.id === normalized.id);
  if (idx >= 0) orders[idx] = normalized;
  return { ok:true, data: normalized };
}

/* =========================================================
   STORAGE & KONSTANTEN
   ========================================================= */
const STORAGE_KEY = "alfacars_orders_final";
const CUSTOMER_KEY = "alfacars_customers_final";
const STOCK_KEY = "alfacars_stock_final_v1";

const DEFAULT_BRANDS = [
  "Michelin","Continental","Goodyear","Pirelli","Bridgestone",
  "Hankook","Nokian","Falken","Berlin Tires","Syron","Siro"
];

// Optional: Modell-Vorschläge (lokal/offline)
const TIRE_MODELS = {
  "Berlin Tires": {
    "Sommer": ["Summer HP","Eco Drive"],
    "Winter": ["Winter Grip"],
    "Allwetter": ["All Season 2","All Weather Pro"]
  },
  "Syron": {
    "Sommer": ["Race 1 Plus","Premium Performance"],
    "Winter": ["EverSnow","Ice Guard"],
    "Allwetter": ["All Climate","4 Season"]
  },
  "Michelin": {
    "Sommer": ["Primacy","Pilot Sport","Energy Saver"],
    "Winter": ["Alpin"],
    "Allwetter": ["CrossClimate"]
  },
  "Continental": {
    "Sommer": ["PremiumContact","SportContact","EcoContact"],
    "Winter": ["WinterContact"],
    "Allwetter": ["AllSeasonContact"]
  },
  "Goodyear": {
    "Sommer": ["EfficientGrip","Eagle F1"],
    "Winter": ["UltraGrip"],
    "Allwetter": ["Vector 4Seasons"]
  },
  "Pirelli": {
    "Sommer": ["Cinturato","P Zero"],
    "Winter": ["Sottozero"],
    "Allwetter": ["Cinturato All Season"]
  },
  "Bridgestone": {
    "Sommer": ["Turanza","Potenza","Ecopia"],
    "Winter": ["Blizzak"],
    "Allwetter": ["Weather Control A005"]
  }
};

const STATUSES = ["Bestellt","Anrufen","Erledigt"];
const ARCHIVE_STATUS = "Archiv";
const TARGET_QTY = 4; // Sollbestand fürs Lager

// ⚠️ Orders werden NICHT mehr aus localStorage geladen.
//    Quelle der Wahrheit ist Supabase.
let orders = [];
let customers = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "[]");
let stock = JSON.parse(localStorage.getItem(STOCK_KEY) || "[]");

let currentView = "orders"; // orders | archive | customers | stock
let editingOrderId = null;
let preselectCustomerId = null;

let editingCustomerId = null;
let editingStockId = null;

const $ = id => document.getElementById(id);

// Mobile-safe tap helper (iOS sometimes drops click on fast taps inside scroll containers)
function bindTap(el, handler){
  if (!el) return;
  let lastTouch = 0;

  el.addEventListener("touchend", (e)=>{
    lastTouch = Date.now();
    handler(e);
  }, { passive: true });

  el.addEventListener("click", (e)=>{
    // avoid double-fire after touch
    if (Date.now() - lastTouch < 450) return;
    handler(e);
  });
}


/* =========================================================
   READ-ONLY MODUS (iPhone / optional ?ro=1)
   - iPhone sieht nur Anzeige (keine Änderungen möglich)
   - Master-PC arbeitet normal
   ========================================================= */
const READ_ONLY = (
  new URLSearchParams(location.search).get("ro") === "1"
);

function roAlert(){
  alert("📱 Anzeige-Modus: Änderungen nur am Master-PC möglich.");
}

if (READ_ONLY){
  document.documentElement.classList.add("read-only");
  const foot = document.querySelector(".foot .muted");
  if (foot) foot.textContent = "Anzeige-Modus · nur schauen · Änderungen nur am Master-PC";
}


/* =========================================================
   UTILS
   ========================================================= */
// ⚠️ DEPRECATED: Orders werden ausschließlich in Supabase gespeichert.
function saveOrders() { /* no-op */ }
function saveCustomers() { localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customers)); }
function saveStock() {
  localStorage.setItem(STOCK_KEY, JSON.stringify(stock));
  syncStockToSupabase(); // 🔄 AUTO-SYNC
}
function saveAll(){ saveOrders(); saveCustomers(); saveStock(); }

function now() { return new Date().toLocaleString("de-DE"); }
function clean(v){ return (v || "").toString().trim(); }
function phoneClean(v){ return clean(v).replace(/\s+/g,""); }
function emailClean(v){ return clean(v).toLowerCase(); }
function plateClean(v){ return clean(v).toUpperCase().replace(/[\s-]+/g,""); }

function money(n) {
  return (Number(n || 0)).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function normalizeTireSize(input) {
  if (!input) return "";
  let s = input.toUpperCase().replace(/[^0-9R]/g,"");
  if (/^\d{5}$/.test(s)) return `${s.slice(0,3)}/${s.slice(3)} R16`;
  if (/^\d{7}$/.test(s)) return `${s.slice(0,3)}/${s.slice(3,5)} R${s.slice(5)}`;
  let m = s.match(/^(\d{3})(\d{2})R(\d{2})$/);
  return m ? `${m[1]}/${m[2]} R${m[3]}` : input;
}

function qtyClass(q){
  if (q >= TARGET_QTY) return "green";
  if (q >= 2) return "yellow";
  return "red";
}

/* =========================================================
   EXCEL-EXPORT (ECHTE TABS + UMLAUTE + FORMAT)
   - Offline-safe
   - Erzeugt eine .xls Arbeitsmappe (Excel XML 2003)
   - Enthält Tabs: Bestellungen, Kunden, Lager
   ========================================================= */

function pad2(n){ return String(n).padStart(2,"0"); }
function tsYMD(){
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

function downloadBinaryFile(filename, content, mime){
  // UTF-8 BOM für Excel-Umlaute
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}

function xmlEscape(s){
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isNumberLike(v){
  if (v === null || v === undefined) return false;
  if (typeof v === "number") return Number.isFinite(v);
  const s = String(v).trim();
  if (!s) return false;
  // akzeptiere "123", "123.45", "123,45"
  return /^-?\d+([.,]\d+)?$/.test(s);
}

function toExcelNumber(v){
  const s = String(v ?? "").trim();
  if (!s) return "";
  return s.replace(",", ".");
}

function computeColWidths(rows){
  const cols = Math.max(...rows.map(r => r.length));
  const maxLen = Array(cols).fill(0);

  rows.forEach(r=>{
    for (let c=0;c<cols;c++){
      const v = (r[c]===null || r[c]===undefined) ? "" : String(r[c]);
      // Excel XML: Formeln wie ="0123" sind länger, aber wir wollen sichtbare Breite
      const visible = v.startsWith('="') && v.endsWith('"') ? v.slice(2,-1) : v;
      maxLen[c] = Math.max(maxLen[c], visible.length);
    }
  });

  // grobe, aber zuverlässige Breiten (Excel Units)
  return maxLen.map(len=>{
    const clamped = Math.min(Math.max(len, 8), 48);
    return 12 + clamped * 6.2; // 12..~310
  });
}

function cellXML(value, isHeader=false){
  const style = isHeader ? "sHeader" : "sCell";
  const v = (value===null || value===undefined) ? "" : value;

  // Excel-Formel für Text-Erzwingung (z.B. ="0123") – bleibt Text, führt 0 bleibt, Umlaute ok
  if (typeof v === "string" && v.startsWith('="') && v.endsWith('"')){
    const inner = v.slice(2,-1);
    return `<Cell ss:StyleID="${style}"><Data ss:Type="String">${xmlEscape(inner)}</Data></Cell>`;
  }

  if (!isHeader && isNumberLike(v)) {
    const num = toExcelNumber(v);
    return `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${xmlEscape(num)}</Data></Cell>`;
  }

  return `<Cell ss:StyleID="${style}"><Data ss:Type="String">${xmlEscape(String(v))}</Data></Cell>`;
}

function worksheetXML(name, rows){
  const widths = computeColWidths(rows);
  const colsXML = widths.map(w => `<Column ss:AutoFitWidth="0" ss:Width="${w.toFixed(0)}"/>`).join("");

  const body = rows.map((r, idx)=>{
    const cells = r.map(v => cellXML(v, idx===0)).join("");
    return `<Row>${cells}</Row>`;
  }).join("");

  return `
  <Worksheet ss:Name="${xmlEscape(name)}">
    <Table>
      ${colsXML}
      ${body}
    </Table>
    <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
      <FreezePanes/>
      <FrozenNoSplit/>
      <SplitHorizontal>1</SplitHorizontal>
      <TopRowBottomPane>1</TopRowBottomPane>
      <ActivePane>2</ActivePane>
      <Panes>
        <Pane>
          <Number>2</Number>
        </Pane>
      </Panes>
    </WorksheetOptions>
  </Worksheet>`;
}

function workbookXML(sheets){
  // Style B: Header fett + grau hinterlegt
  return `<?xml version="1.0"?>
  <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
    xmlns:html="http://www.w3.org/TR/REC-html40">
    <Styles>
      <Style ss:ID="sCell">
        <Alignment ss:Vertical="Center" ss:WrapText="1"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0D0D0"/>
          <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0D0D0"/>
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0D0D0"/>
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0D0D0"/>
        </Borders>
        <Font ss:FontName="Calibri" ss:Size="11"/>
      </Style>
      <Style ss:ID="sHeader">
        <Alignment ss:Vertical="Center" ss:WrapText="1"/>
        <Borders>
          <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#AFAFAF"/>
          <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#AFAFAF"/>
          <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#AFAFAF"/>
          <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#AFAFAF"/>
        </Borders>
        <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
        <Interior ss:Color="#E6E6E6" ss:Pattern="Solid"/>
      </Style>
    </Styles>
    ${sheets.join("\n")}
  </Workbook>`;
}

// Text erzwingen (IDs/Telefon/PLZ/Kennzeichen/DOT)
function xlText(v){
  const s = (v===null || v===undefined) ? "" : String(v);
  if (!s) return "";
  return `="${s.replace(/"/g,'""')}"`;
}

function findCustomerById(id){
  return customers.find(c => c.id === id) || null;
}

// ✅ NEU: Kunde für eine Order auflösen
// - Legacy: localStorage-Kunden (Number-IDs)
// - Supabase: Join-Felder (customerName/customerPhone/licensePlate/customerEmail)



// ✅ NEU: Kunde für eine Order auflösen
// - Legacy: localStorage-Kunden (Number-IDs)
// - Supabase: Join-Felder (customerName/customerPhone/licensePlate/customerEmail)



// ✅ NEU: Kunde für Order auflösen (Supabase JOIN zuerst, localStorage nur Fallback)
function resolveCustomerForOrder(o){
  const id = o?.customerId ?? o?.customerid ?? o?.customer_id ?? null;

  // 1) Legacy/localStorage oder bereits geladene Supabase-Kunden
  const local = id ? findCustomerById(id) : null;
  if (local){
    // Normalize for UI
    if (local.license_plate && !local.plate) local.plate = local.license_plate;
    if (local.plate && !local.license_plate) local.license_plate = local.plate;
    return local;
  }

  // 2) Supabase JOIN-Felder aus normalizeOrderFromDb()
  return {
    id,
    name: o?.customerName || "Unbekannter Kunde",
    phone: o?.customerPhone || "",
    email: o?.customerEmail || "",
    plate: o?.licensePlate || ""
  };
}

function exportExcelWorkbook(){
  // ===== SHEET 1: BESTELLUNGEN (inkl. Status, Filterbar) =====
  const ordersRows = [
    [
      "Bestell-ID","Erstellt am","Status",
      "Kunde-ID","Name","Telefon","E-Mail","Kennzeichen",
      "Straße","PLZ","Ort","Herkunft",
      "Reifengröße","Marke","Saison",
      "Menge","Preis pro Stück","Gesamtpreis","Anzahlung","Restbetrag",
      "Felgen","Notiz","Bestellquelle"
    ]
  ];

  // Sortiere: aktive zuerst, Archiv unten (aber bleibt in einem Tab, wie gewünscht)
  const sortedOrders = [...orders].sort((a,b)=>{
    const aa = a.status === ARCHIVE_STATUS ? 1 : 0;
    const bb = b.status === ARCHIVE_STATUS ? 1 : 0;
    if (aa !== bb) return aa - bb;
    return (String(b.created||"")).localeCompare(String(a.created||""), "de");
  });

  sortedOrders.forEach(o=>{
    const c = resolveCustomerForOrder(o) || {};
    const total = (Number(o.qty||0) * Number(o.unit||0));
    const rest = Math.max(total - Number(o.deposit||0), 0);

    ordersRows.push([
      xlText(o.id),
      o.created || "",
      o.status || "",
      xlText(o.customerId),
      c.name || "",
      xlText(c.phone || ""),
      c.email || "",
      xlText(c.plate ? plateClean(c.plate || c.license_plate) : ""),
      c.street || "",
      xlText(c.zip || ""),
      c.city || "",
      c.source || "",
      o.size || "",
      o.brand || "",
      o.season || "",
      Number(o.qty||0),
      Number(o.unit||0),
      Number(total||0),
      Number(o.deposit||0),
      Number(rest||0),
      o.rims || "",
      o.note || "",
      o.orderSource || ""
    ]);
  });

  // ===== SHEET 2: KUNDEN =====
  const customersRows = [
    ["Kunde-ID","Erstellt am","Name","Telefon","E-Mail","Kennzeichen","Straße","PLZ","Ort","Herkunft"]
  ];
  customers.forEach(c=>{
    customersRows.push([
      xlText(c.id),
      c.created || "",
      c.name || "",
      xlText(c.phone || ""),
      c.email || "",
      xlText(c.plate ? plateClean(c.plate || c.license_plate) : ""),
      c.street || "",
      xlText(c.zip || ""),
      c.city || "",
      c.source || ""
    ]);
  });

  // ===== SHEET 3: LAGER =====
  const stockRows = [
    ["Lager-ID","Erstellt am","Reifengröße","Marke","Saison","Modell","DOT","Menge","Sollbestand","Fehlmenge"]
  ];
  stock.forEach(s=>{
    const qty = Number(s.qty||0);
    stockRows.push([
      xlText(s.id),
      s.created || "",
      s.size || "",
      s.brand || "",
      s.season || "",
      s.model || "",
      xlText(s.dot || ""),
      qty,
      TARGET_QTY,
      Math.max(0, TARGET_QTY - qty)
    ]);
  });

  const sheets = [
    worksheetXML("Bestellungen", ordersRows),
    worksheetXML("Kunden", customersRows),
    worksheetXML("Lager", stockRows)
  ];

  const xml = workbookXML(sheets);
  const filename = `Alfacars_Tagesabschluss_${tsYMD()}.xls`;
  downloadBinaryFile(filename, xml, "application/vnd.ms-excel;charset=utf-8");

  // Zusätzlich: Sicherheits-Backup (JSON) – optional, aber sinnvoll
  const backup = { exportedAt: now(), orders, customers, stock };
  const backupName = `Alfacars_Backup_${tsYMD()}.json`;
  const blob = new Blob([JSON.stringify(backup,null,2)], {type:"application/json;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = backupName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}

/* =========================================================
   VIEW STEUERUNG
   ========================================================= */
function switchView(view) {
  currentView = view;

  const ordersBoard   = document.getElementById("ordersBoard");
  const archiveBoard  = document.getElementById("archiveBoard");
  const customerBoard = document.getElementById("customerBoard");
  const stockBoard    = document.getElementById("stockBoard");

  if (ordersBoard)   ordersBoard.classList.toggle("hidden", view !== "orders");
  if (archiveBoard)  archiveBoard.classList.toggle("hidden", view !== "archive");
  if (customerBoard) customerBoard.classList.toggle("hidden", view !== "customers");
  if (stockBoard)    stockBoard.classList.toggle("hidden", view !== "stock");

  document.querySelectorAll(".tab").forEach(t => {
    t.classList.toggle("active", t.dataset.tab === view);
  });

  if (view === "orders") {
    renderOrders();
  } else if (view === "archive") {
    renderArchive();
  } else if (view === "customers") {
    renderCustomers();
  } else if (view === "stock") {
    // Lager: immer versuchen, live aus Supabase zu laden (falls verfügbar),
    // danach renderStock() – ansonsten localStorage-Daten anzeigen.
    if (typeof loadStockFromSupabase === "function" && supabaseClient) {
      loadStockFromSupabase();
    } else {
      renderStock();
    }
  }
}





/* =========================================================
   MARKEN
   ========================================================= */
function renderBrands() {
  // FIX: defensive – falls einzelne Elemente im HTML fehlen, nicht crashen
  const a = $("brandList");
  if (a) a.innerHTML = DEFAULT_BRANDS.map(b => `<option value="${b}"></option>`).join("");
  const b = $("s_brandList");
  if (b) b.innerHTML = DEFAULT_BRANDS.map(b => `<option value="${b}"></option>`).join("");
}

/* =========================================================
   KUNDEN – (keine doppelten, Telefon oder E-Mail Pflicht)
   ========================================================= */
function findCustomer(phone, email, plate){
  const p = phoneClean(phone);
  const e = emailClean(email);
  const k = plateClean(plate);

  return customers.find(c => (
    (p && phoneClean(c.phone) === p) ||
    (e && emailClean(c.email) === e) ||
    (k && plateClean(c.plate || c.license_plate) === k)
  )) || null;
}

function validateCustomerMinimum(data){
  const p = phoneClean(data.phone);
  const e = emailClean(data.email);
  const k = plateClean(data.plate);

  // Minimal: mindestens eines von Telefon, E‑Mail oder Kennzeichen
  if (!p && !e && !k) {
    alert("Bitte Telefon ODER E‑Mail ODER Kennzeichen eingeben (mindestens 1 Pflicht).");
    return false;
  }
  return true;
}

// FIX: Straße/PLZ/Ort/Herkunft wirklich speichern
function upsertCustomer(data){
  if (!validateCustomerMinimum(data)) return null;

  let c = data.id ? findCustomerById(data.id) : findCustomer(data.phone, data.email, data.plate);

  if (!c){
    c = { id: Date.now(), created: now() };
    customers.unshift(c);
  }

  const newName = clean(data.name);
  const newPhone = phoneClean(data.phone);
  const newEmail = emailClean(data.email);
  const newPlate = plateClean(data.plate);
  const newStreet = clean(data.street);
  const newZip = clean(data.zip);
  const newCity = clean(data.city);
  const newSource = clean(data.source);

  if (newName) c.name = newName;
  if (newPhone) c.phone = newPhone;
  if (newEmail) c.email = newEmail;
  if (newPlate) c.plate = newPlate;

  if (newStreet) c.street = newStreet;
  if (newZip) c.zip = newZip;
  if (newCity) c.city = newCity;
  if (newSource) c.source = newSource;

  c.name = c.name || "";
  c.phone = c.phone || "";
  c.email = c.email || "";
  c.plate = c.plate || "";

  c.street = c.street || "";
  c.zip = c.zip || "";
  c.city = c.city || "";
  c.source = c.source || "";

  saveCustomers();
  return c;
}

/* =========================================================
   RENDER: BESTELLUNGEN
   ========================================================= */
function renderOrders(){
  const q = $("searchInput").value.toLowerCase().trim();

  STATUSES.forEach(s=>{
    $("col-"+s).innerHTML="";
    $("count-"+s).textContent="0";
  });

  orders.forEach(o=>{
    if (o.status === ARCHIVE_STATUS) return;

    const c = resolveCustomerForOrder(o);
    const blob = [c?.name,c?.phone,c?.email,(c?.plate||c?.license_plate),c?.street,c?.zip,c?.city,c?.source,o.size,o.brand,o.note,o.orderSource].join(" ").toLowerCase();
    if (q && !blob.includes(q)) return;

    const card = buildOrderCard(o,c,true);
    $("col-"+o.status).appendChild(card);
    $("count-"+o.status).textContent++;
  });

  // ✅ Keine localStorage-Persistenz mehr für Orders.
}


/* =========================================================
   RENDER: ARCHIV
   ========================================================= */
function renderArchive(){
  const q = $("searchInput").value.toLowerCase().trim();
  $("col-Archiv").innerHTML="";
  $("count-Archiv").textContent="0";

  orders.forEach((o,i)=>{
    if (o.status !== ARCHIVE_STATUS) return;

    const c = resolveCustomerForOrder(o);
    const blob = [c?.name,c?.phone,c?.email,(c?.plate||c?.license_plate),c?.street,c?.zip,c?.city,c?.source,o.size,o.brand,o.note,o.orderSource].join(" ").toLowerCase();
    if (q && !blob.includes(q)) return;

    const card = buildOrderCard(o,c,false);
    card.oncontextmenu = e=>{
      if (READ_ONLY) return;
      e.preventDefault();
      if(confirm("Archiv-Eintrag endgültig löschen?")){
        const id = o.id;
        orders.splice(i,1);
        renderArchive();
        // ✅ Persistenz in Supabase
        deleteOrderFromSupabase(id).then(res=>{
          if(!res.ok){
            initOrdersFromSupabase().then(()=>renderArchive());
          }
        });
      }
    };

    $("col-Archiv").appendChild(card);
    $("count-Archiv").textContent++;
  });
}

/* =========================================================
   KARTEN: BESTELLUNG
   ========================================================= */
function buildOrderCard(o,c,withStatus){
  const total = o.qty * o.unit;
  const rest = Math.max(total - o.deposit,0);

  const card = document.createElement("div");
  card.className = "card status-"+o.status.toLowerCase();
  if (!READ_ONLY) bindTap(card, (e)=>{
    // ignore taps on inner buttons
    if (e && e.target && e.target.closest && e.target.closest('button')) return;
    openEditOrder(o.id);
  });

  card.innerHTML = `
    <div class="card-top">
      <div>
        <div class="card-title">${c?.name || "Unbekannter Kunde"}</div>
        <div class="card-sub">🛞 ${o.size} · ${o.brand} · ${o.season}</div>
        ${c?.email ? `<div class="card-sub">✉️ ${c.email}</div>` : ""}
        ${c?.city ? `<div class="card-sub">📍 ${c.city}</div>` : ""}
        ${o.orderSource ? `<div class="card-sub">🧭 ${o.orderSource}</div>` : ""}
      </div>
      <span class="pill">${money(total)}</span>
    </div>

    <div class="card-grid">
      <div class="kv"><div class="k">Telefon</div><div class="v">${c?.phone || "—"}</div></div>
      ${withStatus ? `<div class="kv"><div class="k">Rest</div><div class="v">${money(rest)}</div></div>` : ""}
      <div class="kv"><div class="k">Kennzeichen</div><div class="v">${(c?.plate || c?.license_plate) || "—"}</div></div>
      <div class="kv"><div class="k">Datum</div><div class="v">${o.created}</div></div>
    </div>

    ${withStatus ? `
    <div style="display:flex;gap:6px;margin-top:10px">
      <button class="pill small grey" data-prev>←</button>
      <button class="pill small yellow" data-next>→</button>
    </div>` : ""}
  `;

  if (withStatus){
    card.querySelector("[data-next]").onclick=e=>{
      if (READ_ONLY){ e.stopPropagation(); return roAlert(); }
      e.stopPropagation();
      const prev = o.status;
      o.status = o.status==="Bestellt"?"Anrufen":o.status==="Anrufen"?"Erledigt":ARCHIVE_STATUS;
      renderOrders();
      // ✅ Status in Supabase persistieren (ohne Reload)
      updateOrderStatusInSupabase(o.id, o.status).then(res=>{
        if(!res.ok){ o.status = prev; renderOrders(); }
      });
    };
    card.querySelector("[data-prev]").onclick=e=>{
      if (READ_ONLY){ e.stopPropagation(); return roAlert(); }
      e.stopPropagation();
      const prev = o.status;
      o.status = o.status==="Anrufen"?"Bestellt":"Anrufen";
      renderOrders();
      // ✅ Status in Supabase persistieren (ohne Reload)
      updateOrderStatusInSupabase(o.id, o.status).then(res=>{
        if(!res.ok){ o.status = prev; renderOrders(); }
      });
    };
  }

  return card;
}

/* =========================================================
   RENDER: KUNDEN
   ========================================================= */
function renderCustomers(){
  const q = $("customerSearchInput").value.toLowerCase().trim();
  $("customerList").innerHTML="";

  customers
    .filter(c=>{
      const blob=[c.name,c.phone,c.email,plateClean(c.plate || c.license_plate),c.street,c.zip,c.city,c.source].join(" ").toLowerCase();
      return !q || blob.includes(q);
    })
    .forEach(c=>{
      const card=document.createElement("div");
      card.className="card";
      card.innerHTML=`
        <div class="card-top">
          <div>
            <div class="card-title">${c.name || "—"}</div>
            <div class="card-sub">
              📞 ${c.phone || "—"}
              ${c.email ? "· ✉️ "+c.email : ""}
              ${(c.plate||c.license_plate) ? "· 🚗 "+plateClean(c.plate||c.license_plate) : ""}
            </div>
            <div class="card-sub">📍 ${[c.street,c.zip,c.city].filter(Boolean).join(" ").trim() || "—"} ${c.source ? "· 🧭 "+c.source : ""}</div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
            <button class="pill small grey" data-edit>Bearbeiten</button>
            <button class="pill small yellow" data-add>+ Bestellung</button>
          </div>
        </div>`;

      card.querySelector("[data-add]").onclick=()=>{
        if (READ_ONLY) return roAlert();
        openNewOrderWithCustomer(c.id);
        switchView("orders");
      };

      card.querySelector("[data-edit]").onclick=()=>{
        if (READ_ONLY) return roAlert();
        openCustomerModal(c.id);
      };

      $("customerList").appendChild(card);
    });

  renderReachability();
}

/* =========================================================
   REICHWEITE – Auswertung (Ort + Kanal)
   ========================================================= */
function renderReachability(){
  const box = $("reachBox");
  if (!box) return;

  if (!orders.length){
    box.innerHTML = "Noch keine Bestellungen vorhanden.";
    return;
  }

  const byCity = {};
  const bySource = {};

  orders.forEach(o=>{
    if (o.status === ARCHIVE_STATUS) return;
    const c = resolveCustomerForOrder(o) || {};
    const city = clean(c.city) || "Unbekannt";
    const src = clean(o.orderSource || c.source) || "Unbekannt";

    byCity[city] = (byCity[city]||0) + 1;
    bySource[src] = (bySource[src]||0) + 1;
  });

  const top = (obj) => Object.entries(obj)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,10)
    .map(([k,v])=>`<div>• <b>${k}</b>: ${v}</div>`)
    .join("");

  box.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div>
        <div class="small-muted" style="margin-bottom:6px">Top Orte (aktiv)</div>
        ${top(byCity) || "—"}
      </div>
      <div>
        <div class="small-muted" style="margin-bottom:6px">Top Kanäle (aktiv)</div>
        ${top(bySource) || "—"}
      </div>
    </div>
  `;
}

/* =========================================================
   MODAL: BESTELLUNG
   ========================================================= */
function openNewOrder(){
  if (READ_ONLY) return roAlert();
  editingOrderId=null;
  preselectCustomerId=null;
  // FIX: defensive – wenn Modal-Elemente fehlen (HTML-Mismatch), nicht crashen
  const mt = $("modalTitle");
  const delBtn = $("btnDelete");
  const modal = $("modal");
  if (!mt || !delBtn || !modal){
    console.error("❌ Modal-Elemente fehlen im DOM (modalTitle/btnDelete/modal). Bitte index.html prüfen.");
    alert("Fehler: Bestell-Dialog konnte nicht geöffnet werden (HTML nicht aktuell).");
    return;
  }
  mt.textContent="Neue Bestellung";
  delBtn.classList.add("hidden");
  modal.classList.remove("hidden");

  $("f_size").value="";
  $("f_brand").value="";
  $("f_season").value="";
  $("f_qty").value=4;
  $("f_unit").value="";
  $("f_deposit").value="";
  $("f_rims").value="";
  $("f_note").value="";
  $("calc_total").textContent=money(0);
  $("calc_rest").textContent=money(0);

  $("f_name").value="";
  $("f_phone").value="";
  $("f_email").value="";
  $("f_plate").value="";
  $("f_street").value="";
  $("f_zip").value="";
  $("f_city").value="";
  $("f_source").value="";
  $("f_orderSource").value="";
}

function openNewOrderWithCustomer(id){
  if (READ_ONLY) return roAlert();
  const c=findCustomerById(id);
  openNewOrder();
  preselectCustomerId=id;
  $("f_name").value=c?.name || "";
  $("f_phone").value=c?.phone || "";
  $("f_email").value=c?.email || "";
  $("f_plate").value=c?.plate || "";
  $("f_street").value=c?.street || "";
  $("f_zip").value=c?.zip || "";
  $("f_city").value=c?.city || "";
  $("f_source").value=c?.source || "";
}

function openEditOrder(id){
  if (READ_ONLY) return roAlert();
  const o = orders.find(x => x.id === id);
  if (!o){
    alert("Bestellung nicht gefunden. Bitte Seite neu öffnen.");
    return;
  }
  const c = resolveCustomerForOrder(o);
  editingOrderId=id;
  preselectCustomerId = (c && typeof c.id === "number") ? c.id : null;

  $("modalTitle").textContent="Bestellung bearbeiten";
  $("btnDelete").classList.remove("hidden");

  $("f_name").value=c?.name||"";
  $("f_phone").value=c?.phone||"";
  $("f_email").value=c?.email||"";
  $("f_plate").value=c?.plate||"";
  $("f_street").value=c?.street||"";
  $("f_zip").value=c?.zip||"";
  $("f_city").value=c?.city||"";
  $("f_source").value=c?.source||"";

  $("f_size").value=o.size;
  $("f_brand").value=o.brand;
  $("f_season").value=o.season;
  $("f_qty").value=o.qty;
  $("f_unit").value=o.unit;
  $("f_deposit").value=o.deposit;
  $("f_rims").value=o.rims;
  $("f_note").value=o.note;
  $("f_orderSource").value=o.orderSource||"";

  const t = o.qty * o.unit;
  $("calc_total").textContent=money(t);
  $("calc_rest").textContent=money(Math.max(t-o.deposit,0));

  $("modal").classList.remove("hidden");
}

async function saveOrder(){
  if (READ_ONLY) return roAlert();

  const size = normalizeTireSize($("f_size").value);
  if(!size) return alert("Bitte Reifengröße eingeben");

  const cust = upsertCustomer({
    id: preselectCustomerId,
    name: $("f_name").value,
    phone: $("f_phone").value,
    email: $("f_email").value,
    plate: $("f_plate").value,
    street: $("f_street").value,
    zip: $("f_zip").value,
    city: $("f_city").value,
    source: $("f_source").value
  });
  if(!cust) return;

  const base = {
    customerId: cust.id,
    customerName: cust.name,
    customerPhone: cust.phone,
    customerEmail: cust.email,
    licensePlate: cust.plate,
    size,
    brand: $("f_brand").value,
    season: $("f_season").value,
    qty: +$("f_qty").value,
    unit: +$("f_unit").value,
    deposit: +$("f_deposit").value,
    rims: $("f_rims").value,
    note: $("f_note").value,
    orderSource: clean($("f_orderSource").value)
  };

  // ✅ currentOrder ist die einzige "Wahrheit" für den Save-Flow
  let currentOrder;
  if (editingOrderId){
    const existing = orders.find(o => o.id === editingOrderId);
    if (!existing) {
      alert("Bestellung nicht gefunden (lokaler Zustand). Bitte Seite neu öffnen.");
      return;
    }
    currentOrder = { ...existing, ...base };
  } else {
    currentOrder = {
      created: now(),
      status: "Bestellt",
      ...base
    };
  }

  // ✅ Speichern ausschließlich über Supabase
  const res = await saveOrderToSupabase(currentOrder);
  if (!res.ok) return;

  $("modal").classList.add("hidden");
  renderOrders();
  if(currentView==="customers") renderCustomers();
}

function deleteOrder(){
  if (READ_ONLY) return roAlert();
  if(!editingOrderId) return;

  // Optimistisch aus UI entfernen
  const id = editingOrderId;
  orders = orders.filter(o => o.id !== id);

  $("modal").classList.add("hidden");
  renderOrders();

  // ✅ Persistenz in Supabase (kein Reload nötig)
  deleteOrderFromSupabase(id).then(res=>{
    if(!res.ok){
      // Bei Fehler: neu aus DB laden, damit UI wieder konsistent ist
      initOrdersFromSupabase().then(()=> {
        if(currentView==="orders") renderOrders();
        if(currentView==="archive") renderArchive();
      });
    }
  });
}

/* =========================================================
   MODAL: KUNDE
   ========================================================= */
function openCustomerModal(id){
  if (READ_ONLY) return roAlert();
  editingCustomerId = id;
  const c = id ? findCustomerById(id) : null;

  $("customerModalTitle").textContent = id ? "Kunde bearbeiten" : "Neuer Kunde";
  const del = $("cbtnDelete");
  if (del) del.classList.toggle("hidden", !id);

  $("c_name").value = c?.name || "";
  $("c_phone").value = c?.phone || "";
  $("c_email").value = c?.email || "";
  $("c_plate").value = c?.plate || "";
  $("c_street").value = c?.street || "";
  $("c_zip").value = c?.zip || "";
  $("c_city").value = c?.city || "";
  $("c_source").value = c?.source || "";

  $("customerModal").classList.remove("hidden");
}

function closeCustomerModal(){
  $("customerModal").classList.add("hidden");
  editingCustomerId = null;
}

function saveCustomerManual(){
  if (READ_ONLY) return roAlert();
  const c = upsertCustomer({
    id: editingCustomerId,
    name: $("c_name").value,
    phone: $("c_phone").value,
    email: $("c_email").value,
    plate: $("c_plate").value,
    street: $("c_street").value,
    zip: $("c_zip").value,
    city: $("c_city").value,
    source: $("c_source").value
  });
  if (!c) return;

  closeCustomerModal();
  renderCustomers();
}

function deleteCustomer(){
  if (READ_ONLY) return roAlert();
  if(!editingCustomerId) return;

  const used = orders.some(o => o.customerId === editingCustomerId);
  if (used) {
    alert("Dieser Kunde hat Bestellungen und kann nicht gelöscht werden.");
    return;
  }

  if(!confirm("Kunde endgültig löschen?")) return;

  customers = customers.filter(c => c.id !== editingCustomerId);
  saveCustomers();
  closeCustomerModal();
  renderCustomers();
}


/* =========================================================
   SUPABASE – STOCK (READ ONLY / Mobile)
   - Mobile lädt Lager direkt aus Supabase (Anzeige-Modus)
   - PC nutzt aktuell weiterhin localStorage für Lager (Editing)
   ========================================================= */

async function loadStockFromSupabase() {
  if (!supabaseClient) {
    console.warn("Supabase nicht verbunden – Lager kann nicht geladen werden");
    return;
  }

  const { data, error } = await supabaseClient
    .from("stock")
    .select("*");

  if (error) {
    console.error("Fehler beim Laden des Lagers:", error.message);
    return;
  }

  stock = (data || []).map(row => ({
    id: row.id,
    created: row.created_at
      ? new Date(row.created_at).toLocaleString("de-DE")
      : "",
    size: row.size || "",
    brand: row.brand || "",
    season: row.season || "",
    model: row.model || "",
    dot: row.dot || "",
    qty: Number(row.qty || 0)
  }));

  renderStock();
}

/* =========================================================
   LAGER – Bestand
   ========================================================= */
function stockKey(item){
  const size = normalizeTireSize(item.size);
  const brand = clean(item.brand);
  const season = clean(item.season);
  const model = clean(item.model);
  const dot = clean(item.dot);
  return [size,brand,season,model,dot].join("|").toLowerCase();
}

function upsertStock(data){
  const size = normalizeTireSize(data.size);
  if(!size) return alert("Bitte Reifengröße eingeben");
  if(!clean(data.brand)) return alert("Bitte Marke eingeben");
  if(!clean(data.season)) return alert("Bitte Saison wählen");

  const item = {
    id: data.id || newUuid(),
    size,
    brand: clean(data.brand),
    season: clean(data.season),
    model: clean(data.model),
    dot: clean(data.dot),
    qty: Math.max(0, Number(data.qty||0))
  };

  if (!data.id){
    const k = stockKey(item);
    const existing = stock.find(s => stockKey(s) === k);
    if (existing){
      existing.qty = Math.max(0, Number(existing.qty||0)) + item.qty;
      saveStock();
      return existing;
    }
    stock.unshift({ ...item, created: now() });
    saveStock();
    return item;
  }

  const target = stock.find(s => s.id === data.id);
  if (target){
    Object.assign(target, item);
    saveStock();
    return target;
  }

  stock.unshift({ ...item, created: now() });
  saveStock();
  return item;
}

function renderStock(){
  const q = $("stockSearchInput").value.toLowerCase().trim();
  $("stockList").innerHTML="";

  const filtered = stock.filter(s=>{
    const blob=[s.size,s.brand,s.season,s.model,s.dot].join(" ").toLowerCase();
    return !q || blob.includes(q);
  });

  filtered.forEach(s=>{
    const card=document.createElement("div");
    card.className="card";
    if (!READ_ONLY) bindTap(card, (e)=>{
      if (e && e.target && e.target.closest && e.target.closest('button')) return;
      openEditStock(s.id);
    });

    const cls = qtyClass(Number(s.qty||0));
    const modelPart = s.model ? ` · ${s.model}` : "";
    const dotPart = s.dot ? ` · DOT ${s.dot}` : "";

    card.innerHTML = `
      <div class="stock-row">
        <div>
          <div class="card-title">🛞 ${s.size} · ${s.brand}</div>
          <div class="card-sub">${s.season}${modelPart}${dotPart}</div>
          <div class="small-muted">Tip: Klick zum Bearbeiten · Rechtsklick zum Löschen</div>
        </div>
        <div class="stock-actions">
          <span class="pill ${cls}">Menge: ${Number(s.qty||0)}</span>
          <div class="qtybox">
            <button class="pill small grey" data-minus>−</button>
            <input class="qty-input" type="number" min="0" step="1" value="${Number(s.qty||0)}" data-qty />
            <button class="pill small yellow" data-plus>+</button>
          </div>
        </div>
      </div>
    `;

    card.oncontextmenu = e=>{
      if (READ_ONLY) return;
      e.preventDefault();
      if(confirm("Lagereintrag löschen?")){
        stock = stock.filter(x => x.id !== s.id);
        saveStock();
        renderStock();
      }
    };

    const minus = card.querySelector("[data-minus]");
    const plus = card.querySelector("[data-plus]");
    const qtyInput = card.querySelector("[data-qty]");

    minus.onclick = e=>{
      if (READ_ONLY){ e.stopPropagation(); return roAlert(); }
      e.stopPropagation();
      s.qty = Math.max(0, Number(s.qty||0) - 1);
      saveStock();
      renderStock();
    };
    plus.onclick = e=>{
      if (READ_ONLY){ e.stopPropagation(); return roAlert(); }
      e.stopPropagation();
      s.qty = Math.max(0, Number(s.qty||0) + 1);
      saveStock();
      renderStock();
    };
    qtyInput.oninput = e=>{
      if (READ_ONLY){ e.stopPropagation(); return roAlert(); }
      e.stopPropagation();
      const v = Math.max(0, Number(qtyInput.value||0));
      s.qty = v;
      saveStock();
      renderStock();
    };

    $("stockList").appendChild(card);
  });

  renderStockSuggestions();
}

function renderStockSuggestions(){
  const need = stock
    .map(s => ({ s, need: Math.max(0, TARGET_QTY - Number(s.qty||0)) }))
    .filter(x => x.need > 0);

  const box = $("stockNeedBox");
  const count = $("stockNeedCount");
  count.textContent = String(need.length);

  if (!need.length){
    box.innerHTML = "Alles ausreichend vorhanden 👍";
    return;
  }

  need.sort((a,b)=>{
    const qa = Number(a.s.qty||0), qb = Number(b.s.qty||0);
    const pa = qa>=4?2:qa>=2?1:0;
    const pb = qb>=4?2:qb>=2?1:0;
    if (pa !== pb) return pa - pb;
    const ba = (a.s.brand||"").localeCompare(b.s.brand||"", "de");
    if (ba) return ba;
    return (a.s.size||"").localeCompare(b.s.size||"", "de");
  });

  box.innerHTML = need.map(x=>{
    const s=x.s;
    const model = s.model ? ` · ${s.model}` : "";
    const dot = s.dot ? ` · DOT ${s.dot}` : "";
    return `➕ <b>${x.need}</b> × ${s.size} · ${s.brand} · ${s.season}${model}${dot} <span class="small-muted">(aktuell ${Number(s.qty||0)})</span>`;
  }).join("<br>");
}

function openNewStock(){
  if (READ_ONLY) return roAlert();
  editingStockId = null;
  $("stockModalTitle").textContent="Neuer Lagereintrag";
  $("s_delete").classList.add("hidden");

  $("s_size").value="";
  $("s_brand").value="";
  $("s_season").value="";
  $("s_model").value="";
  $("s_dot").value="";
  $("s_qty").value=TARGET_QTY;

  renderModelSuggestions();

  $("stockModal").classList.remove("hidden");
}

function openEditStock(id){
  if (READ_ONLY) return roAlert();
  const s = stock.find(x=>x.id===id);
  if(!s) return;

  editingStockId = id;
  $("stockModalTitle").textContent="Lagereintrag bearbeiten";
  $("s_delete").classList.remove("hidden");

  $("s_size").value=s.size || "";
  $("s_brand").value=s.brand || "";
  $("s_season").value=s.season || "";
  $("s_model").value=s.model || "";
  $("s_dot").value=s.dot || "";
  $("s_qty").value=Number(s.qty||0);

  renderModelSuggestions();

  $("stockModal").classList.remove("hidden");
}

function closeStockModal(){
  $("stockModal").classList.add("hidden");
  editingStockId = null;
}

function saveStockItem(){
  if (READ_ONLY) return roAlert();
  const data = {
    id: editingStockId,
    size: $("s_size").value,
    brand: $("s_brand").value,
    season: $("s_season").value,
    model: $("s_model").value,
    dot: $("s_dot").value,
    qty: $("s_qty").value
  };

  const saved = upsertStock(data);
  if(!saved) return;

  closeStockModal();
  renderStock();
}

function deleteStockItem(){
  if (READ_ONLY) return roAlert();
  if(!editingStockId) return;
  if(!confirm("Lagereintrag endgültig löschen?")) return;
  stock = stock.filter(x => x.id !== editingStockId);
  saveStock();
  closeStockModal();
  renderStock();
}

function renderModelSuggestions(){
  const brand = clean($("s_brand").value);
  const season = clean($("s_season").value);

  const list = $("modelList");
  list.innerHTML="";

  const models = (TIRE_MODELS[brand] && TIRE_MODELS[brand][season]) ? TIRE_MODELS[brand][season] : [];
  list.innerHTML = models.map(m => `<option value="${m}"></option>`).join("");
}

/* =========================================================
   TAGESABSCHLUSS / BESTELLUNG (bleibt wie vorher)
   ========================================================= */
function buildNeedList(){
  return stock
    .map(s => ({ s, need: Math.max(0, TARGET_QTY - Number(s.qty||0)) }))
    .filter(x => x.need > 0)
    .sort((a,b)=>{
      const qa = Number(a.s.qty||0), qb = Number(b.s.qty||0);
      const pa = qa>=4?2:qa>=2?1:0;
      const pb = qb>=4?2:qb>=2?1:0;
      if (pa !== pb) return pa - pb;
      const ba = (a.s.brand||"").localeCompare(b.s.brand||"", "de");
      if (ba) return ba;
      return (a.s.size||"").localeCompare(b.s.size||"", "de");
    });
}

function openDayClose(){
  if (READ_ONLY) return roAlert();
  const list = buildNeedList();
  const box = $("dayCloseList");
  if (!list.length){
    box.innerHTML = "Alles ausreichend vorhanden 👍";
  } else {
    box.innerHTML = list.map(x=>{
      const s=x.s;
      const model = s.model ? ` · ${s.model}` : "";
      const dot = s.dot ? ` · DOT ${s.dot}` : "";
      return `➕ <b>${x.need}</b> × ${s.size} · ${s.brand} · ${s.season}${model}${dot} <span class="small-muted">(aktuell ${Number(s.qty||0)})</span>`;
    }).join("<br>");
  }
  $("d_supplier").value = "";
  $("d_note").value = "";
  $("dayCloseModal").classList.remove("hidden");
}

function closeDayClose(){
  $("dayCloseModal").classList.add("hidden");
}

// Bestellliste als CSV (optional beibehalten, unabhängig vom Excel-Workbook)
function toCSV(rows){
  return rows.map(r => r.map(v => {
    const s = (v===null || v===undefined) ? "" : String(v);
    const esc = s.replace(/"/g,'""');
    return /[;"\n\r]/.test(esc) ? `"${esc}"` : esc;
  }).join(";")).join("\n");
}
function downloadFile(filename, content, mime="text/csv;charset=utf-8"){
  const blob = new Blob([content], {type:mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}
function tsFile(prefix, ext){
  const d = new Date();
  const stamp = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}_${pad2(d.getHours())}-${pad2(d.getMinutes())}`;
  return `${prefix}_${stamp}.${ext}`;
}

function exportDayCloseOrder(){
  const list = buildNeedList();
  const supplier = clean($("d_supplier").value);
  const note = clean($("d_note").value);

  const rows = [
    ["createdAt", now()],
    ["supplier", supplier],
    ["note", note],
    [],
    ["size","brand","season","model","dot","currentQty","needToOrder","targetQty"]
  ];

  list.forEach(x=>{
    const s=x.s;
    rows.push([s.size,s.brand,s.season,s.model||"",s.dot||"",Number(s.qty||0),x.need,TARGET_QTY]);
  });

  if (!list.length){
    rows.push(["","(nichts zu bestellen)"]);
  }

  downloadFile(tsFile("bestellliste","csv"), toCSV(rows));
}

/* =========================================================
   EVENTS
   ========================================================= */

function overrideReadOnlyUI(){
  // Buttons, die Änderungen machen, auf Anzeige-Modus blockieren
  const ids = ["btnNew","btnSave","btnDelete","btnNewCustomer","cbtnSave","cbtnDelete","btnNewStock","s_save","s_delete","btnDayClose","d_exportOrder","d_exportAll"];
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.onclick = roAlert;
  });
}
// direkt nach dem Laden ausführen (Script ist am Ende von body)
if (READ_ONLY) overrideReadOnlyUI();

(()=>{ const t=document.querySelector('[data-tab="orders"]'); if(t) t.onclick=()=>switchView("orders"); else console.warn("⚠️ Tab fehlt: orders"); })();
(()=>{ const t=document.querySelector('[data-tab="archive"]'); if(t) t.onclick=()=>switchView("archive"); else console.warn("⚠️ Tab fehlt: archive"); })();
(()=>{ const t=document.querySelector('[data-tab="customers"]'); if(t) t.onclick=()=>switchView("customers"); else console.warn("⚠️ Tab fehlt: customers"); })();
(()=>{ const t=document.querySelector('[data-tab="stock"]'); if(t) t.onclick=()=>switchView("stock"); else console.warn("⚠️ Tab fehlt: stock"); })();

(()=>{ const el=$("btnNew"); if(el) el.onclick=openNewOrder; else console.warn("⚠️ Element fehlt: btnNew"); })();

// ✅ Export-Button erzeugt jetzt EINE Excel-Datei mit Tabs
(()=>{ const el=$("btnExportAll"); if(el) el.onclick=exportExcelWorkbook; else console.warn("⚠️ Element fehlt: btnExportAll"); })();

(()=>{ const el=$("btnSave"); if(el) el.onclick=saveOrder; else console.warn("⚠️ Element fehlt: btnSave"); })(); // ruft intern saveOrderToSupabase(currentOrder) auf
(()=>{ const el=$("btnDelete"); if(el) el.onclick=deleteOrder; else console.warn("⚠️ Element fehlt: btnDelete"); })();
(()=>{ const el=$("btnCancel"); if(el) el.onclick=()=>$("modal").classList.add("hidden"); else console.warn("⚠️ Element fehlt: btnCancel"); })();
(()=>{ const el=$("btnClose"); if(el) el.onclick=()=>$("modal").classList.add("hidden"); else console.warn("⚠️ Element fehlt: btnClose"); })();

(()=>{ const el=$("btnNewCustomer"); if(el) el.onclick=()=>openCustomerModal(null); else console.warn("⚠️ Element fehlt: btnNewCustomer"); })();
(()=>{ const el=$("cbtnSave"); if(el) el.onclick=saveCustomerManual; else console.warn("⚠️ Element fehlt: cbtnSave"); })();
(()=>{ const el=$("cbtnCancel"); if(el) el.onclick=closeCustomerModal; else console.warn("⚠️ Element fehlt: cbtnCancel"); })();
(()=>{ const el=$("cbtnClose"); if(el) el.onclick=closeCustomerModal; else console.warn("⚠️ Element fehlt: cbtnClose"); })();
(()=>{ const el=$("cbtnDelete"); if(el) el.onclick=deleteCustomer; else console.warn("⚠️ Element fehlt: cbtnDelete"); })();

(()=>{ const el=$("btnNewStock"); if(el) el.onclick=openNewStock; else console.warn("⚠️ Element fehlt: btnNewStock"); })();
(()=>{ const el=$("btnDayClose"); if(el) el.onclick=openDayClose; else console.warn("⚠️ Element fehlt: btnDayClose"); })();
(()=>{ const el=$("s_save"); if(el) el.onclick=saveStockItem; else console.warn("⚠️ Element fehlt: s_save"); })();
(()=>{ const el=$("s_cancel"); if(el) el.onclick=closeStockModal; else console.warn("⚠️ Element fehlt: s_cancel"); })();
(()=>{ const el=$("s_close"); if(el) el.onclick=closeStockModal; else console.warn("⚠️ Element fehlt: s_close"); })();
(()=>{ const el=$("s_delete"); if(el) el.onclick=deleteStockItem; else console.warn("⚠️ Element fehlt: s_delete"); })();

(()=>{ const el=$("d_close"); if(el) el.onclick=closeDayClose; else console.warn("⚠️ Element fehlt: d_close"); })();
(()=>{ const el=$("d_cancel"); if(el) el.onclick=closeDayClose; else console.warn("⚠️ Element fehlt: d_cancel"); })();
(()=>{ const el=$("d_exportOrder"); if(el) el.onclick=exportDayCloseOrder; else console.warn("⚠️ Element fehlt: d_exportOrder"); })();

// ✅ “Komplettes Backup exportieren” erzeugt ebenfalls die Excel-Arbeitsmappe + JSON
(()=>{ const el=$("d_exportAll"); if(el) el.onclick=exportExcelWorkbook; else console.warn("⚠️ Element fehlt: d_exportAll"); })();

(()=>{ const el=$("clearSearch"); if(!el){ console.warn("⚠️ Element fehlt: clearSearch"); return; }
  el.onclick=()=>{
  $("searchInput").value="";
  if(currentView==="orders") renderOrders();
  else if(currentView==="archive") renderArchive();
  };
})();
(()=>{ 
  const el = $("searchInput");
  if (!el) { console.warn("⚠️ Element fehlt: searchInput"); return; }
  el.oninput = () => {
    if (currentView === "orders") renderOrders();
    else if (currentView === "archive") renderArchive();
    // bewusst KEIN else → Lager & Kunden NICHT anfassen
  };
})();

(()=>{ const el = $("customerSearchInput"); if(el) el.oninput = renderCustomers; else console.warn("⚠️ Element fehlt: customerSearchInput"); })();

(()=>{ 
  const el = $("stockSearchInput"); 
  if (!el) { console.warn("⚠️ Element fehlt: stockSearchInput"); return; }
  el.oninput = () => {
    if (READ_ONLY) return;
    renderStock();
  };
})();
["f_qty","f_unit","f_deposit"].forEach(id=>{
  const el = $(id);
  if(!el){ console.warn("⚠️ Element fehlt:", id); return; }
  el.addEventListener("input",()=>{
    const t=$("f_qty").value*$("f_unit").value;
    $("calc_total").textContent=money(t);
    $("calc_rest").textContent=money(Math.max(t-$("f_deposit").value,0));
  });
});

(()=>{ const el=$("f_size"); if(!el){ console.warn("⚠️ Element fehlt: f_size"); return; }
  el.addEventListener("input",()=>{
    el.value = normalizeTireSize(el.value);
  });
})();

(()=>{ const el=$("s_size"); if(!el){ console.warn("⚠️ Element fehlt: s_size"); return; }
  el.addEventListener("input",()=>{
    el.value = normalizeTireSize(el.value);
  });
})();
(()=>{ const el=$("s_brand"); if(el) el.addEventListener("input",renderModelSuggestions); else console.warn("⚠️ Element fehlt: s_brand"); })();
(()=>{ const el=$("s_season"); if(el) el.addEventListener("change",renderModelSuggestions); else console.warn("⚠️ Element fehlt: s_season"); })();

/* =========================================================
   INIT
   ========================================================= */
ensureAuthBar();
refreshSession();
renderBrands();

async function initApp() {
  await initCustomersFromSupabase();
  await initOrdersFromSupabase();
  // Lager einmal initial aus Supabase laden (falls verfügbar)
  if (typeof loadStockFromSupabase === "function" && supabaseClient) {
    await loadStockFromSupabase();
  }
  switchView("orders");
}

initApp();

async function syncStockToSupabase() {
  if (!supabaseClient) return;

  // Schreiben nur mit  (RLS: authenticated)
  try { await requireOrThrow(); } catch(e) { return; }

  // Alte lokale IDs (Timestamp) auf UUID migrieren, bevor wir schreiben
  stock.forEach(s=>{
    if(!isUuid(s.id)) s.id = newUuid();
  });

  const rows = stock.map(s => ({
    id: s.id,
    size: s.size,
    brand: s.brand,
    season: s.season,
    model: s.model || null,
    dot: s.dot || null,
    qty: Number(s.qty || 0)
  }));

  const { error } = await supabaseClient
    .from("stock")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("❌ Fehler beim Synchronisieren des Lagers:", error.message);
  }
}


