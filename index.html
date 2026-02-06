/* ================================
   SUPABASE – INITIALISIERUNG (TEST)
================================ */

let supabaseClient = null;
let supabaseOrdersChannel = null;

const SUPABASE_URL = "https://vocyuvgkbswoevikbbxa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_vnWOxf18o0lCy9d1HfJGHw_xMxBa8m_";

function updateConnectionStatus(text){
  if (typeof READ_ONLY !== "undefined" && READ_ONLY) return;
  const foot = document.querySelector(".foot .muted");
  if (foot) foot.textContent = text;
}

function loadScript(src){
  return new Promise((resolve, reject)=>{
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Script load failed: ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureSupabaseLibrary(){
  if (window.supabase && window.supabase.createClient) return true;

  const sources = [
    "https://unpkg.com/@supabase/supabase-js@2",
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
  ];

  for (const src of sources){
    try{
      await loadScript(src);
      if (window.supabase && window.supabase.createClient) return true;
    }catch(err){
      console.warn("⚠️ Supabase Script konnte nicht geladen werden:", src);
    }
  }

  return false;
}

async function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("⚠️ Supabase Konfiguration fehlt");
    updateConnectionStatus("Offline · Supabase-Konfiguration fehlt");
    return;
  }

  const ok = await ensureSupabaseLibrary();
  if (!ok) {
    console.error("❌ Supabase Library nicht geladen");
    updateConnectionStatus("Offline · Supabase Library fehlt");
    return;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  updateConnectionStatus("Online · Supabase verbunden");
  console.log("✅ Supabase verbunden");
}




/* =========================================================
   SUPABASE – ORDERS (SOURCE OF TRUTH)
   - Orders werden ausschließlich in Supabase gespeichert.
   - localStorage wird NICHT mehr für Orders genutzt.
   ========================================================= */

// ✅ Tabelle (erwartet): orders
// Spalten (mindestens): id, created, status, customerId, size, brand, season, qty, unit, deposit, rims, note, orderSource
// Hinweis: Wenn eure Spalten anders heißen, bitte in mapOrderForDb() anpassen.
const SUPABASE_ORDERS_TABLE = "orders";

function mapOrderForDb(o){
  // ✅ zentrale Stelle, damit später Wartung einfach bleibt
  return {
    id: o.id,
    created: o.created,
    status: o.status,
    customerId: o.customerId,
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

async function initOrdersFromSupabase(){
  if (!supabaseClient){
    console.warn("⚠️ Supabase nicht verbunden – Orders können nicht geladen werden.");
    orders = [];
    updateConnectionStatus("Offline · Supabase nicht verbunden");
    return;
  }

  // 1) Orders aus Supabase laden
  const { data, error } = await supabaseClient
    .from(SUPABASE_ORDERS_TABLE)
    .select("*")
    .order("created", { ascending: false });

  if (error){
    console.error("❌ Fehler beim Laden der Orders:", error.message);
    alert("Fehler beim Laden der Bestellungen aus Supabase.");
    orders = [];
    updateConnectionStatus("Offline · Fehler beim Laden");
    return;
  }

  orders = Array.isArray(data) ? data : [];
  updateConnectionStatus("Online · Bestellungen synchron");

  // 2) Einmalige Migration: Altbestand aus localStorage -> Supabase (nur wenn Supabase leer)
  //    Danach wird localStorage-Key für Orders gelöscht.
  try{
    const legacyRaw = localStorage.getItem(STORAGE_KEY);
    const legacyOrders = legacyRaw ? JSON.parse(legacyRaw) : [];
    if ((!orders || orders.length === 0) && Array.isArray(legacyOrders) && legacyOrders.length > 0){
      console.log("↪️ Migration: lokale Orders -> Supabase", legacyOrders.length);

      const payload = legacyOrders.map(lo => mapOrderForDb({
        id: lo.id || Date.now(),
        created: lo.created || now(),
        status: lo.status || "Bestellt",
        customerId: lo.customerId,
        size: lo.size,
        brand: lo.brand,
        season: lo.season,
        qty: Number(lo.qty||0),
        unit: Number(lo.unit||0),
        deposit: Number(lo.deposit||0),
        rims: lo.rims || "",
        note: lo.note || "",
        orderSource: lo.orderSource || ""
      }));

      const { error: migErr } = await supabaseClient
        .from(SUPABASE_ORDERS_TABLE)
        .insert(payload);

      if (migErr){
        console.error("❌ Migration fehlgeschlagen:", migErr.message);
        // Nicht löschen, damit nichts verloren geht
      } else {
        localStorage.removeItem(STORAGE_KEY);
        // neu laden, damit wir den DB-Stand sauber im Speicher haben
        const { data: data2 } = await supabaseClient
          .from(SUPABASE_ORDERS_TABLE)
          .select("*")
          .order("created", { ascending: false });
        orders = Array.isArray(data2) ? data2 : orders;
        console.log("✅ Migration abgeschlossen");
      }
    }
  }catch(e){
    console.warn("⚠️ Migration übersprungen (Parsing/Runtime):", e);
  }
}

function applyOrderChange(payload){
  if (!payload || !payload.new) return;
  const data = payload.new;
  const idx = orders.findIndex(o => o.id === data.id);
  if (idx >= 0) orders[idx] = data;
  else orders.unshift(data);
}

function applyOrderDelete(payload){
  if (!payload || !payload.old) return;
  const data = payload.old;
  orders = orders.filter(o => o.id !== data.id);
}

function renderCurrentView(){
  if (currentView === "orders") renderOrders();
  else if (currentView === "archive") renderArchive();
}

function initOrdersRealtime(){
  if (!supabaseClient) return;
  if (supabaseOrdersChannel){
    supabaseClient.removeChannel(supabaseOrdersChannel);
  }

  supabaseOrdersChannel = supabaseClient
    .channel("orders-realtime")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: SUPABASE_ORDERS_TABLE }, payload => {
      applyOrderChange(payload);
      renderCurrentView();
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: SUPABASE_ORDERS_TABLE }, payload => {
      applyOrderChange(payload);
      renderCurrentView();
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: SUPABASE_ORDERS_TABLE }, payload => {
      applyOrderDelete(payload);
      renderCurrentView();
    })
    .subscribe(status => {
      if (status === "SUBSCRIBED"){
        updateConnectionStatus("Online · Realtime aktiv");
      } else if (status === "CHANNEL_ERROR"){
        updateConnectionStatus("Offline · Realtime Fehler");
      }
    });
}

async function saveOrderToSupabase(currentOrder){
  // ✅ EINZIGE Speicherroutine für Orders
  if (!supabaseClient){
    alert("Supabase nicht verbunden");
    return { ok:false, error:"Supabase not connected" };
  }

  const payload = mapOrderForDb(currentOrder);

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
  const idx = orders.findIndex(o => o.id === data.id);
  if (idx >= 0) orders[idx] = data;
  else orders.unshift(data);

  return { ok:true, data };
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
  const idx = orders.findIndex(o => o.id === data.id);
  if (idx >= 0) orders[idx] = data;
  return { ok:true, data };
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


/* =========================================================
   READ-ONLY MODUS (iPhone / optional ?ro=1)
   - iPhone sieht nur Anzeige (keine Änderungen möglich)
   - Master-PC arbeitet normal
   ========================================================= */
const READ_ONLY = (
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (new URLSearchParams(location.search).get("ro") === "1")
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
function saveStock() { localStorage.setItem(STOCK_KEY, JSON.stringify(stock)); }
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
    const c = findCustomerById(o.customerId) || {};
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
      c.plate || "",
      c.street || "",
      xlText(c.zip || ""),
      c.city || "",
      c.source || "",
      o.size || "",
      o.brand || "",
      o.season || "",
      Number(o.qty||0),
      Number(o.unit||0),
      total,
      Number(o.deposit||0),
      rest,
      o.rims || "",
      o.note || "",
      o.orderSource || ""
    ]);
  });

  // ===== SHEET 2: KUNDEN =====
  const customersRows = [
    ["Kunde-ID","Name","Telefon","E-Mail","Kennzeichen","Straße","PLZ","Ort","Herkunft","Erstellt am"]
  ];
  customers.forEach(c=>{
    customersRows.push([
      xlText(c.id),
      c.name || "",
      xlText(c.phone || ""),
      c.email || "",
      c.plate || "",
      c.street || "",
      xlText(c.zip || ""),
      c.city || "",
      c.source || "",
      c.created || ""
    ]);
  });

  // ===== SHEET 3: LAGER =====
  const stockRows = [
    ["Item-ID","Größe","Marke","Saison","Modell","DOT","Menge","Status","Erstellt am"]
  ];
  stock.forEach(s=>{
    stockRows.push([
      xlText(s.id),
      s.size || "",
      s.brand || "",
      s.season || "",
      s.model || "",
      xlText(s.dot || ""),
      Number(s.qty||0),
      qtyClass(Number(s.qty||0)),
      s.created || ""
    ]);
  });

  const sheets = [
    worksheetXML("Bestellungen", ordersRows),
    worksheetXML("Kunden", customersRows),
    worksheetXML("Lager", stockRows)
  ];

  const xml = workbookXML(sheets);
  const filename = `alfacars_backup_${tsYMD()}.xls`;
  downloadBinaryFile(filename, xml, "application/vnd.ms-excel;charset=utf-8");
}

function renderOrders(){
  const q = $("searchInput").value.toLowerCase().trim();
  const active = orders.filter(o => o.status !== ARCHIVE_STATUS);
  STATUSES.forEach(st=>{
    const col = $("col-"+st);
    const cnt = $("count-"+st);
    col.innerHTML="";

    const filtered = active.filter(o=>{
      if(o.status !== st) return false;
      const c = customers.find(c=>c.id===o.customerId) || {};
      const blob = [
        o.id,o.size,o.brand,o.season,o.rims,o.note,o.orderSource,
        c.name,c.phone,c.email,c.plate,c.city
      ].join(" ").toLowerCase();
      return !q || blob.includes(q);
    });

    cnt.textContent = filtered.length;

    filtered.forEach(o=>{
      const c = customers.find(c=>c.id===o.customerId) || {};
      const card = document.createElement("div");
      card.className = "card status-"+st.toLowerCase();
      if (!READ_ONLY) card.onclick = ()=>openEditOrder(o.id);

      card.innerHTML = `
        <div class="card-top">
          <div>
            <div class="card-title">${c.name || "Unbekannt"} · ${o.size}</div>
            <div class="card-sub">${o.brand || "?"} · ${o.season || "?"} · ${o.qty} Stk</div>
          </div>
          <span class="pill ${st==="Bestellt"?"grey":st==="Anrufen"?"yellow":"green"}">${st}</span>
        </div>

        <div class="card-grid">
          <div class="kv"><div class="k">Telefon</div><div class="v">${c.phone || "—"}</div></div>
          <div class="kv"><div class="k">E-Mail</div><div class="v">${c.email || "—"}</div></div>
          <div class="kv"><div class="k">Kennzeichen</div><div class="v">${c.plate || "—"}</div></div>
          <div class="kv"><div class="k">Quelle</div><div class="v">${o.orderSource || c.source || "—"}</div></div>
          <div class="kv"><div class="k">Preis</div><div class="v">${money(o.qty*o.unit)}</div></div>
          <div class="kv"><div class="k">Rest</div><div class="v">${money(Math.max(o.qty*o.unit - o.deposit,0))}</div></div>
        </div>

        ${o.note ? `<div class="note">${o.note}</div>` : ""}
      `;

      const btns = document.createElement("div");
      btns.style.marginTop="8px";
      btns.innerHTML = `
        <button class="pill small grey">◀</button>
        <button class="pill small grey">Bearbeiten</button>
        <button class="pill small grey">▶</button>
      `;
      const [bPrev, bEdit, bNext] = btns.querySelectorAll("button");

      bPrev.onclick = e=>{
        e.stopPropagation();
        if (READ_ONLY) return roAlert();
        const idx = STATUSES.indexOf(o.status);
        if (idx>0) updateOrderStatus(o.id, STATUSES[idx-1]);
      };
      bNext.onclick = e=>{
        e.stopPropagation();
        if (READ_ONLY) return roAlert();
        const idx = STATUSES.indexOf(o.status);
        if (idx<STATUSES.length-1) updateOrderStatus(o.id, STATUSES[idx+1]);
      };
      bEdit.onclick = e=>{
        e.stopPropagation();
        if (READ_ONLY) return roAlert();
        openEditOrder(o.id);
      };

      card.appendChild(btns);
      col.appendChild(card);
    });
  });
}

/* ... der Rest der Datei bleibt unverändert (vollständig in der Datei) ... */

async function initApp(){
  await initSupabase();
  await initOrdersFromSupabase(); // lädt orders[] und migriert ggf. Altbestand
  initOrdersRealtime();
  switchView("orders");
}
