"use strict";

/* ================================
   SUPABASE CONFIG
================================= */
const SUPABASE_URL = "https://vocyuvgkbswoevikbbxa.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvY3l1dmdrYnN3b2V2aWtiYnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTU1NzMsImV4cCI6MjA4NTg3MTU3M30.S8ROC7E3xaX2H6pv40p8rL1zDMQX89bNavz-GRfXKQI";

const TBL_ORDERS = "orders";
const TBL_CUSTOMERS = "customers";
const TBL_STOCK = "stock";

/* ================================
   CONSTANTS
================================= */
const DEFAULT_BRANDS = [
  "Michelin","Continental","Goodyear","Pirelli","Bridgestone","Hankook","Nokian","Falken",
  "Berlin Tires","Syron","Siro","Dunlop","Yokohama","Kumho","BFGoodrich","Firestone",
  "Uniroyal","Vredestein","Nexen","Toyo","Cooper","Sava","Laufenn","Barum","Matador",
  "Semperit","General Tire","GT Radial","Apollo","Giti","Fulda"
];

const TIRE_MODELS = {
  "Berlin Tires": {
    "Sommer": ["Summer HP 1","Summer HP 2","Summer HP ECO","Summer UHP 1","Summer UHP 2","Royalmax 2","Marathon 1"],
    "Winter": ["Alpine Grip","Alpine Grip C"],
    "Allwetter": ["All Season 1","All Season 2","All Season Cargo","All Season VAN"]
  },
  "Syron": {
    "Sommer": ["Race 1 Plus","Premium Performance"],
    "Winter": ["EverSnow","Ice Guard"],
    "Allwetter": ["All Climate","4 Season"]
  },
  "Michelin": { "Sommer":["Primacy","Pilot Sport","Energy Saver"], "Winter":["Alpin"], "Allwetter":["CrossClimate"] },
  "Continental": { "Sommer":["PremiumContact","SportContact","EcoContact"], "Winter":["WinterContact"], "Allwetter":["AllSeasonContact"] },
  "Goodyear": { "Sommer":["EfficientGrip","Eagle F1"], "Winter":["UltraGrip"], "Allwetter":["Vector 4Seasons"] },
  "Pirelli": { "Sommer":["Cinturato","P Zero"], "Winter":["Sottozero"], "Allwetter":["Cinturato All Season"] },
  "Bridgestone": { "Sommer":["Turanza","Potenza","Ecopia"], "Winter":["Blizzak"], "Allwetter":["Weather Control A005"] }
};

const STATUSES = ["Bestellt","Anrufen","Erledigt"];
const ARCHIVE_STATUS = "Archiv";
const TARGET_QTY = 4;

// Bestellliste Marken (Anzeige)
const ORDER_BRANDS = new Set(["SYRON","BERLIN TIRES"]);

/* ================================
   STATE
================================= */
const $ = (id) => document.getElementById(id);
const READ_ONLY = (new URLSearchParams(location.search).get("ro") === "1");

let supabaseClient = null;

let orders = [];
let customers = [];
let stock = [];

let currentView = "orders";
let editingOrderId = null;
let editingCustomerId = null;
let editingStockId = null;

/* ================================
   HELPERS
================================= */
function setFoot(msg){
  const el = $("footStatus");
  if (el) el.textContent = msg || "Bereit";
}

function money(n){
  return (Number(n || 0)).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function clean(v){ return (v ?? "").toString().trim(); }
function phoneClean(v){ return clean(v).replace(/\s+/g,""); }
function emailClean(v){ return clean(v).toLowerCase(); }
function plateClean(v){ return clean(v).toUpperCase().replace(/[\s-]+/g,""); }

function normalizeTireSize(input){
  if (!input) return "";
  let s = String(input).toUpperCase().replace(/[^0-9R/ ]/g,"");
  s = s.replace(/\s+/g," ").trim();
  let m = s.match(/(\d{3})\s*\/\s*(\d{2})\s*R\s*(\d{2})/);
  if (m) return `${m[1]}/${m[2]} R${m[3]}`;
  m = s.match(/(\d{3})\s*\/\s*(\d{2})\s*R?(\d{2})/);
  if (m) return `${m[1]}/${m[2]} R${m[3]}`;
  return String(input).trim();
}

function normalizeText(s){
  return (s||"")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g," ")
    .replace(/\s+/g," ")
    .trim();
}

function stockNeed(qty){
  const q = Number(qty || 0);
  return Math.max(0, TARGET_QTY - q);
}

function qtyClass(q){
  q = Number(q||0);
  if (q >= TARGET_QTY) return "green";
  if (q >= 2) return "yellow";
  return "red";
}

function roAlert(){
  alert("📱 Anzeige-Modus: Änderungen nur am Master-PC möglich.");
}

/* iOS-safe tap helper */
function bindTap(el, handler){
  if (!el) return;
  let lastTouch = 0;
  el.addEventListener("touchend", (e)=>{ lastTouch = Date.now(); handler(e); }, { passive:true });
  el.addEventListener("click", (e)=>{ if (Date.now() - lastTouch < 450) return; handler(e); });
}

function newUuid(){
  try { return crypto.randomUUID(); } catch(_) {}
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c=>{
    const r = Math.random()*16|0, v = c==="x"?r:(r&0x3|0x8);
    return v.toString(16);
  });
}

/* ================================
   INIT
================================= */
function initSupabase(){
  if (!window.supabase || !window.supabase.createClient){
    alert("Supabase Library fehlt.");
    return;
  }
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log("✅ Supabase verbunden");
}

function renderBrands(){
  const list = $("brandList");
  if (!list) return;
  list.innerHTML = DEFAULT_BRANDS.map(b => `<option value="${b}"></option>`).join("");
}

function getModelsFor(brand, season){
  brand = clean(brand);
  season = clean(season);
  if (!brand || !season) return [];
  const byBrand = TIRE_MODELS[brand];
  if (!byBrand) return [];
  const arr = byBrand[season];
  return Array.isArray(arr) ? arr.filter(Boolean) : [];
}

function renderModelSuggestions(brandId, seasonId){
  const brand = $(brandId)?.value || "";
  const season = $(seasonId)?.value || "";
  const models = getModelsFor(brand, season);

  const list = $("modelList");
  if (!list) return;

  const seen = new Set();
  const uniq = [];
  models.forEach(m=>{
    const k = String(m||"").trim();
    if(!k) return;
    const kk = k.toLowerCase();
    if(seen.has(kk)) return;
    seen.add(kk);
    uniq.push(k);
  });

  list.innerHTML = uniq.map(m => `<option value="${m}"></option>`).join("");
}

/* ================================
   SUPABASE LOAD
================================= */
async function loadCustomers(){
  const { data, error } = await supabaseClient
    .from(TBL_CUSTOMERS)
    .select("id,name,phone,license_plate,email,street,zip,city,source,created_at")
    .order("created_at", { ascending:false });

  if (error) throw error;

  customers = (data || []).map(c => ({
    id: c.id,
    name: c.name || "",
    phone: c.phone || "",
    email: c.email || "",
    license_plate: c.license_plate || "",
    street: c.street || "",
    zip: c.zip || "",
    city: c.city || "",
    source: c.source || "",
    created_at: c.created_at || null
  }));
}

async function loadOrders(){
  const joined = await supabaseClient
    .from(TBL_ORDERS)
    .select("*, customers (id,name,phone,license_plate,email,street,zip,city,source)")
    .order("created_at", { ascending:false });

  if (joined.error){
    const plain = await supabaseClient
      .from(TBL_ORDERS)
      .select("*")
      .order("created_at", { ascending:false });

    if (plain.error) throw plain.error;
    orders = normalizeOrders(plain.data || []);
    return;
  }

  orders = normalizeOrders(joined.data || []);
}

function normalizeOrders(rows){
  return (rows || []).map(r=>{
    const c = r.customers || {};
    const cid = r.customerid || r.customer_id || r.customerId || null;

    return {
      id: r.id,
      created_at: r.created_at || null,
      status: r.status || "Bestellt",
      customerId: cid,
      customerName: c.name || r.customername || r.customer_name || "",
      customerPhone: c.phone || r.customerphone || r.customer_phone || "",
      customerEmail: c.email || r.customeremail || r.customer_email || "",
      licensePlate: c.license_plate || r.license_plate || r.licensePlate || "",
      street: c.street || "",
      zip: c.zip || "",
      city: c.city || "",
      source: c.source || "",
      size: r.size || "",
      brand: r.brand || "",
      season: r.season || "",
      model: r.model || "",
      qty: Number(r.qty || 0),
      unit: Number(r.unit || 0),
      deposit: Number(r.deposit || 0),
      rims: r.rims || "",
      note: r.note || "",
      orderSource: r.orderSource || r.order_source || ""
    };
  });
}

async function loadStock(){
  const { data, error } = await supabaseClient
    .from(TBL_STOCK)
    .select("id,created_at,size,brand,season,model,dot,qty")
    .order("created_at", { ascending:false });

  if (error) throw error;

  stock = (data || []).map(s => ({
    id: s.id,
    created_at: s.created_at || null,
    size: s.size || "",
    brand: s.brand || "",
    season: s.season || "",
    model: s.model || "",
    dot: s.dot || "",
    qty: Number(s.qty || 0)
  }));
}

/* ================================
   CUSTOMERS CRUD (INSERT vs UPDATE)
================================= */
function validateCustomerMinimum(data){
  const p = phoneClean(data.phone);
  const e = emailClean(data.email);
  const k = plateClean(data.plate);
  if (!p && !e && !k){
    alert("Bitte Telefon ODER E-Mail ODER Kennzeichen eingeben (mindestens 1 Pflicht).");
    return false;
  }
  return true;
}

async function saveCustomerSupabase(data){
  if (!validateCustomerMinimum(data)) return null;

  const payload = {
    name: clean(data.name) || null,
    phone: phoneClean(data.phone) || null,
    email: emailClean(data.email) || null,
    license_plate: plateClean(data.plate) || null,
    street: clean(data.street) || null,
    zip: clean(data.zip) || null,
    city: clean(data.city) || null,
    source: clean(data.source) || null
  };

  // UPDATE
  if (data.id){
    const { data: updated, error } = await supabaseClient
      .from(TBL_CUSTOMERS)
      .update(payload)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  }

  // INSERT
  const { data: inserted, error } = await supabaseClient
    .from(TBL_CUSTOMERS)
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return inserted;
}

async function deleteCustomerSupabase(id){
  const used = orders.some(o => o.customerId === id);
  if (used){
    alert("Dieser Kunde hat Bestellungen und kann nicht gelöscht werden.");
    return;
  }
  const { error } = await supabaseClient.from(TBL_CUSTOMERS).delete().eq("id", id);
  if (error) throw error;
  customers = customers.filter(c => c.id !== id);
}

/* ================================
   ORDERS CRUD
================================= */
async function upsertOrderSupabase(order){
  const row = {
    id: order.id || newUuid(),
    status: order.status || "Bestellt",
    customerid: order.customerId,
    size: order.size,
    brand: order.brand || "",
    season: order.season || "",
    model: order.model || "",
    qty: Number(order.qty || 0),
    unit: Number(order.unit || 0),
    deposit: Number(order.deposit || 0),
    rims: order.rims || "",
    note: order.note || "",
    orderSource: order.orderSource || ""
  };

  const { error } = await supabaseClient
    .from(TBL_ORDERS)
    .upsert(row, { onConflict: "id" });

  if (error) throw error;

  await loadOrders();
}

async function deleteOrderSupabase(id){
  const { error } = await supabaseClient.from(TBL_ORDERS).delete().eq("id", id);
  if (error) throw error;
  orders = orders.filter(o => o.id !== id);
}

/* ================================
   STOCK CRUD
================================= */
async function upsertStockSupabase(item){
  const row = {
    id: item.id || newUuid(),
    size: normalizeTireSize(item.size),
    brand: clean(item.brand),
    season: clean(item.season),
    model: clean(item.model),
    dot: clean(item.dot),
    qty: Math.max(0, Number(item.qty || 0))
  };

  if (!row.size) return alert("Bitte Reifengröße eingeben");
  if (!row.brand) return alert("Bitte Marke eingeben");
  if (!row.season) return alert("Bitte Saison wählen");

  const { error } = await supabaseClient
    .from(TBL_STOCK)
    .upsert(row, { onConflict: "id" });

  if (error) throw error;
  await loadStock();
}

async function deleteStockSupabase(id){
  const { error } = await supabaseClient.from(TBL_STOCK).delete().eq("id", id);
  if (error) throw error;
  stock = stock.filter(s => s.id !== id);
}

async function updateStockQtySupabase(id, newQty){
  const { error } = await supabaseClient
    .from(TBL_STOCK)
    .update({ qty: Math.max(0, Number(newQty||0)) })
    .eq("id", id);

  if (error) throw error;

  const idx = stock.findIndex(s => s.id === id);
  if (idx >= 0) stock[idx].qty = Math.max(0, Number(newQty||0));
}

/* ================================
   VIEW SWITCH
================================= */
function switchView(view){
  currentView = view;

  const map = {
    orders: $("ordersBoard"),
    archive: $("archiveBoard"),
    customers: $("customerBoard"),
    stock: $("stockBoard"),
    bestellen: $("bestellenBoard"),
    staff: $("staffBoard"),
  };

  Object.entries(map).forEach(([k, el])=>{
    if (!el) return;
    el.classList.toggle("hidden", k !== view);
  });

  document.querySelectorAll(".tab").forEach(t=>{
    t.classList.toggle("active", t.dataset.tab === view);
  });

  renderCurrent();
}

function renderCurrent(){
  if (currentView === "orders") renderOrders();
  if (currentView === "archive") renderArchive();
  if (currentView === "customers") renderCustomers();
  if (currentView === "stock") renderStock();
  if (currentView === "bestellen") renderBestellen();
}

/* ================================
   RENDER: ORDERS / ARCHIVE
================================= */
function orderMatchesQuery(o, q){
  if (!q) return true;
  const blob = [
    o.customerName, o.customerPhone, o.licensePlate, o.customerEmail,
    o.size, o.brand, o.season, o.model, o.note, o.orderSource
  ].join(" ").toLowerCase();
  return blob.includes(q);
}

function buildOrderCard(o){
  const total = Number(o.qty||0) * Number(o.unit||0);
  const rest = Math.max(total - Number(o.deposit||0), 0);

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-top">
      <div>
        <div class="card-title">${clean(o.customerName) || "Unbekannter Kunde"}</div>
        <div class="card-sub">${clean(o.customerPhone) || ""} ${o.licensePlate ? "· " + clean(o.licensePlate) : ""}</div>
      </div>
      <div class="pill small ${o.status==="Erledigt"?"green":o.status==="Anrufen"?"yellow":"grey"}">${o.status}</div>
    </div>

    <div class="card-grid">
      <div class="kv"><div class="k">Größe</div><div class="v">${clean(o.size) || "—"}</div></div>
      <div class="kv"><div class="k">Marke</div><div class="v">${clean(o.brand) || "—"}</div></div>
      <div class="kv"><div class="k">Saison</div><div class="v">${clean(o.season) || "—"}</div></div>
      <div class="kv"><div class="k">Menge</div><div class="v">${Number(o.qty||0)}</div></div>
      <div class="kv"><div class="k">Gesamt</div><div class="v">${money(total)}</div></div>
      <div class="kv"><div class="k">Rest</div><div class="v">${money(rest)}</div></div>
    </div>

    ${o.note ? `<div class="note">${String(o.note)}</div>` : ""}

    <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
      <button class="btn soft" data-act="edit">Bearbeiten</button>
      <button class="btn soft" data-act="status">Status ändern</button>
    </div>
  `;

  card.querySelector('[data-act="edit"]').onclick = ()=> openEditOrder(o.id);
  card.querySelector('[data-act="status"]').onclick = ()=> openStatusPicker(o.id);

  return card;
}

function renderOrders(){
  const q = clean($("searchInput")?.value).toLowerCase().trim();

  STATUSES.forEach(s=>{
    const col = $("col-"+s);
    const count = $("count-"+s);
    if (col) col.innerHTML = "";
    if (count) count.textContent = "0";
  });

  const active = orders.filter(o => o.status !== ARCHIVE_STATUS);

  active.forEach(o=>{
    if (!orderMatchesQuery(o, q)) return;
    const col = $("col-"+o.status);
    if (!col) return;
    col.appendChild(buildOrderCard(o));

    const count = $("count-"+o.status);
    if (count) count.textContent = String(Number(count.textContent||"0") + 1);
  });
}

function renderArchive(){
  const q = clean($("searchInput")?.value).toLowerCase().trim();
  const col = $("col-Archiv");
  const count = $("count-Archiv");
  if (col) col.innerHTML = "";

  const archived = orders.filter(o => o.status === ARCHIVE_STATUS);

  let n = 0;
  archived.forEach(o=>{
    if (!orderMatchesQuery(o, q)) return;
    col.appendChild(buildOrderCard(o));
    n++;
  });

  if (count) count.textContent = String(n);
}

/* ================================
   ORDER MODAL
================================= */
function openNewOrder(){
  if (READ_ONLY) return roAlert();
  editingOrderId = null;

  $("modalTitle").textContent = "Neue Bestellung";
  $("btnDelete").classList.add("hidden");

  $("f_name").value = "";
  $("f_phone").value = "";
  $("f_email").value = "";
  $("f_plate").value = "";
  $("f_street").value = "";
  $("f_zip").value = "";
  $("f_city").value = "";
  $("f_source").value = "";

  $("f_size").value = "";
  $("f_brand").value = "";
  $("f_season").value = "";
  $("f_model").value = "";
  $("f_qty").value = 4;
  $("f_unit").value = "";
  $("f_deposit").value = "";
  $("f_rims").value = "";
  $("f_note").value = "";
  $("f_status").value = "Bestellt";
  $("f_orderSource").value = "";

  $("calc_total").textContent = money(0);
  $("calc_rest").textContent = money(0);

  renderModelSuggestions("f_brand","f_season");
  $("modal").classList.remove("hidden");
}

function openEditOrder(id){
  if (READ_ONLY) return roAlert();
  const o = orders.find(x => x.id === id);
  if (!o) return alert("Bestellung nicht gefunden.");

  editingOrderId = id;
  $("modalTitle").textContent = "Bestellung bearbeiten";
  $("btnDelete").classList.remove("hidden");

  $("f_name").value = o.customerName || "";
  $("f_phone").value = o.customerPhone || "";
  $("f_email").value = o.customerEmail || "";
  $("f_plate").value = o.licensePlate || "";
  $("f_street").value = o.street || "";
  $("f_zip").value = o.zip || "";
  $("f_city").value = o.city || "";
  $("f_source").value = o.source || "";

  $("f_size").value = o.size || "";
  $("f_brand").value = o.brand || "";
  $("f_season").value = o.season || "";
  $("f_model").value = o.model || "";
  $("f_qty").value = Number(o.qty || 0);
  $("f_unit").value = Number(o.unit || 0);
  $("f_deposit").value = Number(o.deposit || 0);
  $("f_rims").value = o.rims || "";
  $("f_note").value = o.note || "";
  $("f_status").value = o.status || "Bestellt";
  $("f_orderSource").value = o.orderSource || "";

  const total = Number(o.qty||0) * Number(o.unit||0);
  $("calc_total").textContent = money(total);
  $("calc_rest").textContent = money(Math.max(total - Number(o.deposit||0), 0));

  renderModelSuggestions("f_brand","f_season");
  $("modal").classList.remove("hidden");
}

function closeOrderModal(){
  $("modal").classList.add("hidden");
  editingOrderId = null;
}

function recalcOrder(){
  const qty = Number($("f_qty").value || 0);
  const unit = Number($("f_unit").value || 0);
  const dep = Number($("f_deposit").value || 0);
  const total = qty * unit;
  $("calc_total").textContent = money(total);
  $("calc_rest").textContent = money(Math.max(total - dep, 0));
}

async function saveOrder(){
  if (READ_ONLY) return roAlert();
  try{
    setFoot("Speichere…");

    const size = normalizeTireSize($("f_size").value);
    if (!size) return alert("Bitte Reifengröße eingeben");

    // Kunde speichern (INSERT oder UPDATE)
    const cust = await saveCustomerSupabase({
      id: null, // bewusst: bei Bestellung immer "neu/finden" über Daten -> Insert ist ok
      name: $("f_name").value,
      phone: $("f_phone").value,
      email: $("f_email").value,
      plate: $("f_plate").value,
      street: $("f_street").value,
      zip: $("f_zip").value,
      city: $("f_city").value,
      source: $("f_source").value
    });
    if (!cust?.id) return;

    const order = {
      id: editingOrderId || null,
      customerId: cust.id,
      status: $("f_status").value || "Bestellt",
      size,
      brand: $("f_brand").value || "",
      season: $("f_season").value || "",
      model: $("f_model").value || "",
      qty: Number($("f_qty").value || 0),
      unit: Number($("f_unit").value || 0),
      deposit: Number($("f_deposit").value || 0),
      rims: $("f_rims").value || "",
      note: $("f_note").value || "",
      orderSource: $("f_orderSource").value || ""
    };

    await upsertOrderSupabase(order);
    closeOrderModal();
    renderCurrent();
    setFoot("Gespeichert ✅");
  } catch(e){
    console.error(e);
    alert("Fehler beim Speichern (Supabase): " + (e?.message || e));
    setFoot("Fehler");
  }
}

async function deleteOrder(){
  if (READ_ONLY) return roAlert();
  if (!editingOrderId) return;

  if (!confirm("Bestellung endgültig löschen?")) return;

  try{
    setFoot("Lösche…");
    await deleteOrderSupabase(editingOrderId);
    closeOrderModal();
    renderCurrent();
    setFoot("Gelöscht ✅");
  } catch(e){
    console.error(e);
    alert("Fehler beim Löschen (Supabase): " + (e?.message || e));
    setFoot("Fehler");
  }
}

function openStatusPicker(orderId){
  const o = orders.find(x=>x.id===orderId);
  if (!o) return;

  const next = prompt("Neuer Status:\nBestellt / Anrufen / Erledigt / Archiv", o.status || "Bestellt");
  if (!next) return;

  const ok = [...STATUSES, ARCHIVE_STATUS].includes(next);
  if (!ok) return alert("Ungültiger Status.");

  (async ()=>{
    try{
      setFoot("Aktualisiere…");
      const { error } = await supabaseClient.from(TBL_ORDERS).update({ status: next }).eq("id", orderId);
      if (error) throw error;
      await loadOrders();
      renderCurrent();
      setFoot("Status aktualisiert ✅");
    } catch(e){
      console.error(e);
      alert("Fehler beim Status-Update: " + (e?.message || e));
      setFoot("Fehler");
    }
  })();
}

/* ================================
   CUSTOMERS RENDER
================================= */
function customerMatchesQuery(c, q){
  if (!q) return true;
  const blob = [c.name,c.phone,c.email,c.license_plate,c.city,c.source].join(" ").toLowerCase();
  return blob.includes(q);
}

function buildCustomerCard(c){
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-top">
      <div>
        <div class="card-title">${clean(c.name) || "—"}</div>
        <div class="card-sub">${clean(c.phone) || ""} ${c.license_plate ? "· " + clean(c.license_plate) : ""}</div>
      </div>
      <div class="pill small grey">Kunde</div>
    </div>

    <div class="card-grid">
      <div class="kv"><div class="k">E-Mail</div><div class="v">${clean(c.email) || "—"}</div></div>
      <div class="kv"><div class="k">Ort</div><div class="v">${clean(c.city) || "—"}</div></div>
      <div class="kv"><div class="k">Straße</div><div class="v">${clean(c.street) || "—"}</div></div>
      <div class="kv"><div class="k">PLZ</div><div class="v">${clean(c.zip) || "—"}</div></div>
    </div>

    <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
      <button class="btn soft" data-act="newOrder">+ Bestellung</button>
      <button class="btn soft" data-act="edit">Bearbeiten</button>
    </div>
  `;

  card.querySelector('[data-act="newOrder"]').onclick = ()=>{
    if (READ_ONLY) return roAlert();
    openNewOrder();
    $("f_name").value = c.name || "";
    $("f_phone").value = c.phone || "";
    $("f_email").value = c.email || "";
    $("f_plate").value = c.license_plate || "";
    $("f_street").value = c.street || "";
    $("f_zip").value = c.zip || "";
    $("f_city").value = c.city || "";
    $("f_source").value = c.source || "";
    switchView("orders");
  };

  card.querySelector('[data-act="edit"]').onclick = ()=> openCustomerModal(c.id);
  return card;
}

function renderReachability(){
  const box = $("reachBox");
  if (!box) return;

  const active = orders.filter(o => o.status !== ARCHIVE_STATUS);
  if (!active.length){
    box.innerHTML = "Noch keine aktiven Bestellungen.";
    return;
  }

  const byCity = {};
  const bySource = {};

  active.forEach(o=>{
    const city = clean(o.city) || "Unbekannt";
    const src = clean(o.orderSource || o.source) || "Unbekannt";
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

function renderCustomers(){
  const q = clean($("customerSearchInput")?.value).toLowerCase().trim();
  const list = $("customerList");
  if (!list) return;
  list.innerHTML = "";

  customers
    .filter(c => customerMatchesQuery(c, q))
    .forEach(c => list.appendChild(buildCustomerCard(c)));

  renderReachability();
}

/* ================================
   CUSTOMER MODAL
================================= */
function openCustomerModal(id){
  if (READ_ONLY) return roAlert();

  editingCustomerId = id || null;
  const c = id ? customers.find(x=>x.id===id) : null;

  $("customerModalTitle").textContent = id ? "Kunde bearbeiten" : "Neuer Kunde";
  $("cbtnDelete").classList.toggle("hidden", !id);

  $("c_name").value = c?.name || "";
  $("c_phone").value = c?.phone || "";
  $("c_email").value = c?.email || "";
  $("c_plate").value = c?.license_plate || "";
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

async function saveCustomer(){
  if (READ_ONLY) return roAlert();
  try{
    setFoot("Speichere Kunde…");

    const saved = await saveCustomerSupabase({
      id: editingCustomerId || null,
      name: $("c_name").value,
      phone: $("c_phone").value,
      email: $("c_email").value,
      plate: $("c_plate").value,
      street: $("c_street").value,
      zip: $("c_zip").value,
      city: $("c_city").value,
      source: $("c_source").value
    });

    if (!saved?.id) return;

    closeCustomerModal();
    await loadCustomers();
    renderCustomers();
    setFoot("Kunde gespeichert ✅");
  } catch(e){
    console.error(e);
    alert("Fehler beim Kunden-Speichern: " + (e?.message || e));
    setFoot("Fehler");
  }
}

async function deleteCustomer(){
  if (READ_ONLY) return roAlert();
  if (!editingCustomerId) return;
  if (!confirm("Kunde endgültig löschen?")) return;

  try{
    setFoot("Lösche Kunde…");
    await deleteCustomerSupabase(editingCustomerId);
    closeCustomerModal();
    renderCustomers();
    setFoot("Kunde gelöscht ✅");
  } catch(e){
    console.error(e);
    alert("Fehler beim Kunden-Löschen: " + (e?.message || e));
    setFoot("Fehler");
  }
}

/* ================================
   STOCK RENDER
================================= */
function stockMatchesQuery(s, q){
  if (!q) return true;
  const blob = [s.size,s.brand,s.season,s.model,s.dot,String(s.qty||0)].join(" ").toLowerCase();
  return blob.includes(q);
}

function buildStockCard(s){
  const need = stockNeed(s.qty);
  const cls = qtyClass(s.qty);

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="stock-row">
      <div style="flex:1">
        <div class="card-title">${clean(s.size) || "—"} · ${clean(s.brand) || "—"}</div>
        <div class="card-sub">${clean(s.season) || "—"} ${s.model ? "· " + clean(s.model) : ""} ${s.dot ? "· DOT " + clean(s.dot) : ""}</div>

        <div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap;">
          <span class="pill ${cls}">Bestand: <b>${Number(s.qty||0)}</b></span>
          <span class="pill grey">Soll: <b>${TARGET_QTY}</b></span>
          ${need ? `<span class="pill red">Fehlt: <b>${need}</b></span>` : `<span class="pill green">OK</span>`}
        </div>
      </div>

      <div class="stock-actions">
        <div class="qtybox">
          <button class="btn soft" data-act="minus">−</button>
          <input class="qty-input" data-act="qty" value="${Number(s.qty||0)}" />
          <button class="btn soft" data-act="plus">+</button>
        </div>
        <button class="btn soft" data-act="edit">Bearbeiten</button>
      </div>
    </div>
  `;

  const qtyInput = card.querySelector('[data-act="qty"]');

  card.querySelector('[data-act="minus"]').onclick = async ()=>{
    if (READ_ONLY) return roAlert();
    try{
      const v = Math.max(0, Number(qtyInput.value||0) - 1);
      qtyInput.value = String(v);
      await updateStockQtySupabase(s.id, v);
      renderStock();
      if (currentView==="bestellen") renderBestellen();
    } catch(e){
      console.error(e);
      alert("Fehler beim Lager-Update: " + (e?.message || e));
    }
  };

  card.querySelector('[data-act="plus"]').onclick = async ()=>{
    if (READ_ONLY) return roAlert();
    try{
      const v = Math.max(0, Number(qtyInput.value||0) + 1);
      qtyInput.value = String(v);
      await updateStockQtySupabase(s.id, v);
      renderStock();
      if (currentView==="bestellen") renderBestellen();
    } catch(e){
      console.error(e);
      alert("Fehler beim Lager-Update: " + (e?.message || e));
    }
  };

  qtyInput.addEventListener("change", async ()=>{
    if (READ_ONLY) return roAlert();
    try{
      const v = Math.max(0, Number(qtyInput.value||0));
      qtyInput.value = String(v);
      await updateStockQtySupabase(s.id, v);
      renderStock();
      if (currentView==="bestellen") renderBestellen();
    } catch(e){
      console.error(e);
      alert("Fehler beim Lager-Update: " + (e?.message || e));
    }
  });

  card.querySelector('[data-act="edit"]').onclick = ()=> openStockModal(s.id);

  return card;
}

function computeBestellItems(){
  const items = stock
    .map(s=>{
      const brandKey = normalizeText(s.brand);
      if (!ORDER_BRANDS.has(brandKey)) return null;
      const missing = stockNeed(s.qty);
      if (!missing) return null;

      return {
        stockId: s.id,
        size: s.size,
        brand: s.brand,
        season: s.season,
        model: s.model,
        qty: Number(s.qty||0),
        missing
      };
    })
    .filter(Boolean);

  items.sort((a,b)=>{
    const aa = `${a.brand}|${a.size}|${a.season}`.toLowerCase();
    const bb = `${b.brand}|${b.size}|${b.season}`.toLowerCase();
    return aa.localeCompare(bb, "de");
  });

  return items;
}

function renderStock(){
  const q = clean($("stockSearchInput")?.value).toLowerCase().trim();
  const list = $("stockList");
  if (!list) return;
  list.innerHTML = "";

  let missingCount = 0;

  stock
    .filter(s => stockMatchesQuery(s, q))
    .forEach(s=>{
      missingCount += stockNeed(s.qty);
      list.appendChild(buildStockCard(s));
    });

  $("stockNeedCount").textContent = String(missingCount);

  // Hinweisbox für Syron/Berlin Tires
  const needItems = computeBestellItems();
  const needBox = $("stockNeedBox");
  if (needBox){
    if (!needItems.length){
      needBox.classList.add("hidden");
      needBox.innerHTML = "";
    } else {
      needBox.classList.remove("hidden");
      needBox.innerHTML = `
        <div style="font-weight:900; margin-bottom:6px;">📦 Bestellen nötig (Syron / Berlin Tires)</div>
        ${needItems.slice(0,10).map(x => `• <b>${x.brand}</b> ${x.size} ${x.season} – fehlt <b>${x.missing}</b>`).join("<br>")}
        ${needItems.length > 10 ? `<div style="margin-top:6px;" class="small-muted">+ ${needItems.length-10} weitere …</div>` : ""}
      `;
    }
  }
}

/* ================================
   STOCK MODAL
================================= */
function openStockModal(id){
  if (READ_ONLY) return roAlert();

  editingStockId = id || null;
  const s = id ? stock.find(x=>x.id===id) : null;

  $("stockModalTitle").textContent = id ? "Lagereintrag bearbeiten" : "Neuer Lagereintrag";
  $("s_delete").classList.toggle("hidden", !id);

  $("s_size").value = s?.size || "";
  $("s_brand").value = s?.brand || "";
  $("s_season").value = s?.season || "";
  $("s_model").value = s?.model || "";
  $("s_dot").value = s?.dot || "";
  $("s_qty").value = Number(s?.qty || 0);

  renderModelSuggestions("s_brand","s_season");
  $("stockModal").classList.remove("hidden");
}

function closeStockModal(){
  $("stockModal").classList.add("hidden");
  editingStockId = null;
}

async function saveStock(){
  if (READ_ONLY) return roAlert();
  try{
    setFoot("Speichere Lager…");

    await upsertStockSupabase({
      id: editingStockId || null,
      size: $("s_size").value,
      brand: $("s_brand").value,
      season: $("s_season").value,
      model: $("s_model").value,
      dot: $("s_dot").value,
      qty: $("s_qty").value
    });

    closeStockModal();
    renderStock();
    if (currentView==="bestellen") renderBestellen();
    setFoot("Lager gespeichert ✅");
  } catch(e){
    console.error(e);
    alert("Fehler beim Lager-Speichern: " + (e?.message || e));
    setFoot("Fehler");
  }
}

async function deleteStock(){
  if (READ_ONLY) return roAlert();
  if (!editingStockId) return;
  if (!confirm("Lagereintrag endgültig löschen?")) return;

  try{
    setFoot("Lösche Lager…");
    await deleteStockSupabase(editingStockId);
    closeStockModal();
    renderStock();
    if (currentView==="bestellen") renderBestellen();
    setFoot("Lager gelöscht ✅");
  } catch(e){
    console.error(e);
    alert("Fehler beim Lager-Löschen: " + (e?.message || e));
    setFoot("Fehler");
  }
}

/* ================================
   BESTELLEN TAB (NUR ANZEIGE)
   - Kein Button
   - Zeigt klar: Bestand / Soll / Fehlt
================================= */
function renderBestellen(){
  const list = $("bestellenList");
  const count = $("bestellenCount");
  const summary = $("bestellenSummary");
  if (!list || !count) return;

  const items = computeBestellItems();
  count.textContent = String(items.length);
  list.innerHTML = "";

  const totalMissing = items.reduce((a,x)=>a + Number(x.missing||0), 0);
  if (summary){
    summary.textContent = items.length
      ? `Positionen: ${items.length} · Gesamt fehlend: ${totalMissing}`
      : "";
  }

  if (!items.length){
    list.innerHTML = `<div class="note list">✅ Kein Minderbestand bei Syron/Berlin Tires. (Soll ${TARGET_QTY})</div>`;
    return;
  }

  items.forEach(item=>{
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-top">
        <div>
          <div class="card-title">${clean(item.brand)} · ${clean(item.size)} · ${clean(item.season)}</div>
          <div class="card-sub">${item.model ? clean(item.model) + " · " : ""}Bestand ${item.qty} · Soll ${TARGET_QTY}</div>
        </div>
        <div class="pill red">Fehlt: <b>${item.missing}</b></div>
      </div>

      <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
        <span class="pill grey">Marke: <b>${clean(item.brand)}</b></span>
        <span class="pill grey">Größe: <b>${clean(item.size)}</b></span>
        <span class="pill grey">Saison: <b>${clean(item.season)}</b></span>
        ${item.model ? `<span class="pill grey">Modell: <b>${clean(item.model)}</b></span>` : ""}
      </div>

      <div class="note list" style="margin-top:10px;">
        ✅ Du siehst hier direkt, wie viele du bestellen musst: <b>${item.missing}</b>
      </div>
    `;
    list.appendChild(card);
  });
}

/* ================================
   EXPORT (CSV)
================================= */
function csvEscape(v){
  const s = String(v ?? "");
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g,'""')}"`;
  return s;
}
function downloadFile(name, content, mime){
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1500);
}
function exportAll(){
  const stamp = new Date().toISOString().slice(0,10);

  const ordersCsv = [
    ["id","created_at","status","customerId","customerName","phone","plate","email","size","brand","season","model","qty","unit","deposit","rims","note","orderSource"].join(";"),
    ...orders.map(o=>[
      o.id,o.created_at,o.status,o.customerId,o.customerName,o.customerPhone,o.licensePlate,o.customerEmail,
      o.size,o.brand,o.season,o.model,o.qty,o.unit,o.deposit,o.rims,o.note,o.orderSource
    ].map(csvEscape).join(";"))
  ].join("\n");

  const customersCsv = [
    ["id","created_at","name","phone","plate","email","street","zip","city","source"].join(";"),
    ...customers.map(c=>[
      c.id,c.created_at,c.name,c.phone,c.license_plate,c.email,c.street,c.zip,c.city,c.source
    ].map(csvEscape).join(";"))
  ].join("\n");

  const stockCsv = [
    ["id","created_at","size","brand","season","model","dot","qty"].join(";"),
    ...stock.map(s=>[
      s.id,s.created_at,s.size,s.brand,s.season,s.model,s.dot,s.qty
    ].map(csvEscape).join(";"))
  ].join("\n");

  downloadFile(`Alfacars_Orders_${stamp}.csv`, ordersCsv, "text/csv;charset=utf-8");
  downloadFile(`Alfacars_Customers_${stamp}.csv`, customersCsv, "text/csv;charset=utf-8");
  downloadFile(`Alfacars_Stock_${stamp}.csv`, stockCsv, "text/csv;charset=utf-8");
}

/* ================================
   BOOTSTRAP / EVENTS
================================= */
async function bootstrap(){
  try{
    if (READ_ONLY) document.documentElement.classList.add("read-only");

    initSupabase();
    renderBrands();

    // Tabs
    document.querySelectorAll(".tab").forEach(t=>{
      t.onclick = ()=> switchView(t.dataset.tab);
    });

    bindTap($("btnNew"), ()=> openNewOrder());
    bindTap($("btnExportAll"), ()=> exportAll());

    bindTap($("clearSearch"), ()=>{
      $("searchInput").value = "";
      renderCurrent();
    });

    $("searchInput").addEventListener("input", ()=> renderCurrent());
    $("customerSearchInput").addEventListener("input", ()=> renderCustomers());
    $("stockSearchInput").addEventListener("input", ()=> renderStock());

    // Order modal
    bindTap($("btnClose"), closeOrderModal);
    bindTap($("btnCancel"), closeOrderModal);
    bindTap($("btnSave"), saveOrder);
    bindTap($("btnDelete"), deleteOrder);

    ["f_qty","f_unit","f_deposit"].forEach(id=>{
      $(id).addEventListener("input", recalcOrder);
    });
    $("f_brand").addEventListener("input", ()=> renderModelSuggestions("f_brand","f_season"));
    $("f_season").addEventListener("change", ()=> renderModelSuggestions("f_brand","f_season"));

    // Customer modal
    bindTap($("btnNewCustomer"), ()=> openCustomerModal(null));
    bindTap($("cbtnClose"), closeCustomerModal);
    bindTap($("cbtnCancel"), closeCustomerModal);
    bindTap($("cbtnSave"), saveCustomer);
    bindTap($("cbtnDelete"), deleteCustomer);

    // Stock modal
    bindTap($("btnNewStock"), ()=> openStockModal(null));
    bindTap($("sbtnClose"), closeStockModal);
    bindTap($("s_cancel"), closeStockModal);
    bindTap($("s_save"), saveStock);
    bindTap($("s_delete"), deleteStock);

    $("s_brand").addEventListener("input", ()=> renderModelSuggestions("s_brand","s_season"));
    $("s_season").addEventListener("change", ()=> renderModelSuggestions("s_brand","s_season"));

    // Initial load
    setFoot("Lade Daten…");
    await loadCustomers();
    await loadOrders();
    await loadStock();

    renderCurrent();
    setFoot("Bereit ✅");
  } catch(e){
    console.error(e);
    alert("Startfehler: " + (e?.message || e));
    setFoot("Fehler");
  }
}

bootstrap();
