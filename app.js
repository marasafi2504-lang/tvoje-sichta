// Tvoje šichta – logika aplikace (načítá ji index.html)
// @ts-nocheck
(function () {
  "use strict";

  // ===================== NASTAVENÍ CLOUDU =====================
  // Hodnoty najdete v Supabase → Project Settings → API Keys (Data API).
  // Prázdné hodnoty = aplikace běží jen v telefonu, bez účtů.
  const SUPABASE_URL = "";   // např. "https://abcdefgh.supabase.co"
  const SUPABASE_KEY = "";   // „Publishable key“ (sb_publishable_…) nebo „anon public“. NIKDY ne secret / service_role!
  const GOOGLE_LOGIN = false;      // true = tlačítko „Pokračovat přes Google“ (nejdřív zapněte Google v Supabase → Authentication → Providers)
  const GOOGLE_CLIENT_ID = "";     // záloha na Google Disk: Google Cloud → Credentials → OAuth client ID (Web), končí .apps.googleusercontent.com
  const AI_FUNCTION = "";          // "parse-shifts" = asistent používá AI (Supabase Edge Function). Prázdné = jen pravidla v telefonu.
  // ============================================================

  const KEY = "tvoje-sichta-v1";
  const OLD_KEY = "claudy-mobil-v1";
  const MONTHS = ["leden","únor","březen","duben","květen","červen","červenec","srpen","září","říjen","listopad","prosinec"];
  const DAYS_SHORT = ["Ne","Po","Út","St","Čt","Pá","So"];
  const DAYS_FULL = ["neděle","pondělí","úterý","středa","čtvrtek","pátek","sobota"];
  const MONTHS_GEN = ["ledna","února","března","dubna","května","června","července","srpna","září","října","listopadu","prosince"];
  // Jmeniny podle českého občanského kalendáře (klíč měsíc-den)
  const NAMEDAYS = {"1-1":"","1-2":"Karina","1-3":"Radmila","1-4":"Diana","1-5":"Dalimil","1-6":"","1-7":"Vilma","1-8":"Čestmír","1-9":"Vladan","1-10":"Břetislav","1-11":"Bohdana","1-12":"Pravoslav","1-13":"Edita","1-14":"Radovan","1-15":"Alice","1-16":"Ctirad","1-17":"Drahoslav","1-18":"Vladislav","1-19":"Doubravka","1-20":"Ilona","1-21":"Běla","1-22":"Slavomír","1-23":"Zdeněk","1-24":"Milena","1-25":"Miloš","1-26":"Zora","1-27":"Ingrid","1-28":"Otýlie","1-29":"Zdislava","1-30":"Robin","1-31":"Marika","2-1":"Hynek","2-2":"Nela","2-3":"Blažej","2-4":"Jarmila","2-5":"Dobromila","2-6":"Vanda","2-7":"Veronika","2-8":"Milada","2-9":"Apolena","2-10":"Mojmír","2-11":"Božena","2-12":"Slavěna","2-13":"Věnceslav","2-14":"Valentýn","2-15":"Jiřina","2-16":"Ljuba","2-17":"Miloslava","2-18":"Gizela","2-19":"Patrik","2-20":"Oldřich","2-21":"Lenka","2-22":"Petr","2-23":"Svatopluk","2-24":"Matěj","2-25":"Liliana","2-26":"Dorota","2-27":"Alexandr","2-28":"Lumír","2-29":"","3-1":"Bedřich","3-2":"Anežka","3-3":"Kamil","3-4":"Stela","3-5":"Kazimír","3-6":"Miroslav","3-7":"Tomáš","3-8":"Gabriela","3-9":"Františka","3-10":"Viktorie","3-11":"Anděla","3-12":"Řehoř","3-13":"Růžena","3-14":"Matylda, Rút","3-15":"Ida","3-16":"Elena, Herbert","3-17":"Vlastimil","3-18":"Eduard","3-19":"Josef","3-20":"Světlana","3-21":"Radek","3-22":"Leona","3-23":"Ivona","3-24":"Gabriel","3-25":"Marián","3-26":"Emanuel","3-27":"Dita","3-28":"Soňa","3-29":"Taťána","3-30":"Arnošt","3-31":"Kvido","4-1":"Hugo","4-2":"Erika","4-3":"Richard","4-4":"Ivana","4-5":"Miroslava","4-6":"Vendula","4-7":"Heřman, Hermína","4-8":"Ema","4-9":"Dušan","4-10":"Darja","4-11":"Izabela","4-12":"Julius","4-13":"Aleš","4-14":"Vincenc","4-15":"Anastázie","4-16":"Irena","4-17":"Rudolf","4-18":"Valérie","4-19":"Rostislav","4-20":"Marcela","4-21":"Alexandra","4-22":"Evženie","4-23":"Vojtěch","4-24":"Jiří","4-25":"Marek","4-26":"Oto","4-27":"Jaroslav","4-28":"Vlastislav","4-29":"Robert","4-30":"Blahoslav","5-1":"","5-2":"Zikmund","5-3":"Alexej","5-4":"Květoslav","5-5":"Klaudie","5-6":"Radoslav","5-7":"Stanislav","5-8":"","5-9":"Ctibor","5-10":"Blažena","5-11":"Svatava","5-12":"Pankrác","5-13":"Servác","5-14":"Bonifác","5-15":"Žofie","5-16":"Přemysl","5-17":"Aneta","5-18":"Nataša","5-19":"Ivo","5-20":"Zbyšek","5-21":"Monika","5-22":"Emil","5-23":"Vladimír","5-24":"Jana, Vanesa","5-25":"Viola","5-26":"Filip","5-27":"Valdemar","5-28":"Vilém","5-29":"Maxmilián","5-30":"Ferdinand","5-31":"Kamila","6-1":"Laura","6-2":"Jarmil","6-3":"Tamara","6-4":"Dalibor","6-5":"Dobroslav","6-6":"Norbert","6-7":"Iveta, Slavoj","6-8":"Medard","6-9":"Stanislava","6-10":"Gita","6-11":"Bruno","6-12":"Antonie","6-13":"Antonín","6-14":"Roland","6-15":"Vít","6-16":"Zbyněk","6-17":"Adolf","6-18":"Milan","6-19":"Leoš","6-20":"Květa","6-21":"Alois","6-22":"Pavla","6-23":"Zdeňka","6-24":"Jan","6-25":"Ivan","6-26":"Adriana","6-27":"Ladislav","6-28":"Lubomír","6-29":"Petr a Pavel","6-30":"Šárka","7-1":"Jaroslava","7-2":"Patricie","7-3":"Radomír","7-4":"Prokop","7-5":"Cyril a Metoděj","7-6":"","7-7":"Bohuslava","7-8":"Nora","7-9":"Drahoslava","7-10":"Libuše, Amálie","7-11":"Olga","7-12":"Bořek","7-13":"Markéta","7-14":"Karolína","7-15":"Jindřich","7-16":"Luboš","7-17":"Martina","7-18":"Drahomíra","7-19":"Čeněk","7-20":"Ilja","7-21":"Vítězslav","7-22":"Magdaléna","7-23":"Libor","7-24":"Kristýna","7-25":"Jakub","7-26":"Anna","7-27":"Věroslav","7-28":"Viktor","7-29":"Marta","7-30":"Bořivoj","7-31":"Ignác","8-1":"Oskar","8-2":"Gustav","8-3":"Miluše","8-4":"Dominik","8-5":"Kristián","8-6":"Oldřiška","8-7":"Lada","8-8":"Soběslav","8-9":"Roman","8-10":"Vavřinec","8-11":"Zuzana","8-12":"Klára","8-13":"Alena","8-14":"Alan","8-15":"Hana","8-16":"Jáchym","8-17":"Petra","8-18":"Helena","8-19":"Ludvík","8-20":"Bernard","8-21":"Johana","8-22":"Bohuslav","8-23":"Sandra","8-24":"Bartoloměj","8-25":"Radim","8-26":"Luděk","8-27":"Otakar","8-28":"Augustýn","8-29":"Evelína","8-30":"Vladěna","8-31":"Pavlína","9-1":"Linda, Samuel","9-2":"Adéla","9-3":"Bronislav","9-4":"Jindřiška","9-5":"Boris","9-6":"Boleslav","9-7":"Regína","9-8":"Mariana","9-9":"Daniela","9-10":"Irma","9-11":"Denisa, Denis","9-12":"Marie","9-13":"Lubor","9-14":"Radka","9-15":"Jolana","9-16":"Ludmila","9-17":"Naděžda","9-18":"Kryštof","9-19":"Zita","9-20":"Oleg","9-21":"Matouš","9-22":"Darina","9-23":"Berta","9-24":"Jaromír","9-25":"Zlata","9-26":"Andrea","9-27":"Jonáš","9-28":"Václav","9-29":"Michal","9-30":"Jeroným","10-1":"Igor","10-2":"Olívie, Oliver","10-3":"Bohumil","10-4":"František","10-5":"Eliška","10-6":"Hanuš","10-7":"Justýna","10-8":"Věra","10-9":"Štefan, Sára","10-10":"Marina","10-11":"Andrej","10-12":"Marcel","10-13":"Renáta","10-14":"Agáta","10-15":"Tereza","10-16":"Havel","10-17":"Hedvika","10-18":"Lukáš","10-19":"Michaela","10-20":"Vendelín","10-21":"Brigita","10-22":"Sabina","10-23":"Teodor","10-24":"Nina","10-25":"Beáta","10-26":"Erik","10-27":"Šarlota, Zoe","10-28":"","10-29":"Silvie","10-30":"Tadeáš","10-31":"Štěpánka","11-1":"Felix","11-2":"","11-3":"Hubert","11-4":"Karel","11-5":"Miriam","11-6":"Liběna","11-7":"Saskie","11-8":"Bohumír","11-9":"Bohdan","11-10":"Evžen","11-11":"Martin","11-12":"Benedikt","11-13":"Tibor","11-14":"Sáva","11-15":"Leopold","11-16":"Otmar","11-17":"Mahulena","11-18":"Romana","11-19":"Alžběta","11-20":"Nikola","11-21":"Albert","11-22":"Cecílie","11-23":"Klement","11-24":"Emílie","11-25":"Kateřina","11-26":"Artur","11-27":"Xenie","11-28":"René","11-29":"Zina","11-30":"Ondřej","12-1":"Iva","12-2":"Blanka","12-3":"Svatoslav","12-4":"Barbora","12-5":"Jitka","12-6":"Mikuláš","12-7":"Ambrož, Benjamín","12-8":"Květoslava","12-9":"Vratislav","12-10":"Julie","12-11":"Dana","12-12":"Simona","12-13":"Lucie","12-14":"Lýdie","12-15":"Radana, Radan","12-16":"Albína","12-17":"Daniel","12-18":"Miloslav","12-19":"Ester","12-20":"Dagmar","12-21":"Natálie","12-22":"Šimon","12-23":"Vlasta","12-24":"Adam a Eva","12-25":"","12-26":"Štěpán","12-27":"Žaneta","12-28":"Bohumila","12-29":"Judita","12-30":"David","12-31":"Silvestr"};
  const nameDay = (m, d) => NAMEDAYS[(m + 1) + "-" + d] || "";
  const fullDate = dt => `${DAYS_FULL[dt.getDay()]} ${dt.getDate()}. ${MONTHS_GEN[dt.getMonth()]} ${dt.getFullYear()}`;
  const COLORS = ["#fcd34d","#fdba74","#818cf8","#34d399","#60a5fa","#f472b6","#c4b5fd","#86efac","#fca5a5","#93c5fd"];

  const DEFAULT = () => ({
    shifts: {},
    wage: 200,
    nightPct: 0,
    holidayPct: 100,
    weekendPct: 0,
    theme: "dark",
    types: [
      { id: "R",   code: "R",   name: "Ranní",                              start: "06:00", end: "14:00", color: "#fcd34d", night: false, off: false },
      { id: "O",   code: "O",   name: "Odpolední",                          start: "14:00", end: "22:00", color: "#fdba74", night: false, off: false },
      { id: "N",   code: "N",   name: "Noční",                              start: "22:00", end: "06:00", color: "#818cf8", night: true,  off: false },
      { id: "D",   code: "D",   name: "Denní služba",                       start: "07:00", end: "19:00", color: "#34d399", night: false, off: false },
      { id: "NS",  code: "NS",  name: "Noční služba",                       start: "19:00", end: "07:00", color: "#60a5fa", night: true,  off: false },
      { id: "UPS", code: "UPS", name: "Ústavní pohotovostní služba (24 h)", start: "00:00", end: "00:00", color: "#f472b6", night: false, off: false },
      { id: "V",   code: "V",   name: "Volno",                              start: "00:00", end: "00:00", color: "#86efac", night: false, off: true  }
    ]
  });

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const pad = n => String(n).padStart(2, "0");
  const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const daysIn = (y, m) => new Date(y, m + 1, 0).getDate();
  const fmtInt = n => Math.round(n).toLocaleString("cs-CZ");
  const fmtH = n => (Math.round(n * 10) / 10).toLocaleString("cs-CZ") + " h";
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- Uložení ----------
  function load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY) || "null"); } catch (e) { raw = null; }
    const d = DEFAULT();
    if (!raw || typeof raw !== "object") return d;
    const out = { ...d, ...raw };
    out.shifts = (raw.shifts && typeof raw.shifts === "object") ? raw.shifts : {};
    if (!Array.isArray(raw.types) || !raw.types.length) out.types = d.types;
    return out;
  }
  let data = load();
  function save() {
    try { localStorage.setItem("tvoje-sichta-theme", data.theme); } catch (_) {}
    if (isCloud()) return; // v cloudu se služby ukládají na server
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { toast("Nepodařilo se uložit data."); }
  }

  const now = new Date();
  let view = { y: now.getFullYear(), m: now.getMonth() };
  let brush = data.types[0] ? data.types[0].id : "C";
  let donAmount = 100;

  // ---------- Typy a výpočty ----------
  const typeById = id => data.types.find(t => t.id === id);
  const shortOf = t => (t.code || t.name.slice(0, 3)).slice(0, 4);
  function minutes(hhmm) {
    const [h, m] = String(hhmm || "0:0").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  }
  function hoursOf(t) {
    if (t.off) return 0;
    let d = (minutes(t.end) - minutes(t.start) + 1440) % 1440;
    if (d === 0) d = 1440;
    return d / 60;
  }
  function rangeLabel(t) {
    if (t.off) return "volno";
    if (t.start === t.end) return "24 h";
    return `${t.start}–${t.end}`;
  }
  function textOn(hex) {
    const c = String(hex || "#888888").replace("#", "");
    const r = parseInt(c.slice(0, 2), 16) || 0, g = parseInt(c.slice(2, 4), 16) || 0, b = parseInt(c.slice(4, 6), 16) || 0;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#111827" : "#ffffff";
  }
  function monthEntries() {
    const out = [];
    const n = daysIn(view.y, view.m);
    for (let d = 1; d <= n; d++) {
      const k = keyOf(view.y, view.m, d);
      const code = data.shifts[k];
      if (code && typeById(code)) out.push({ day: d, code, date: new Date(view.y, view.m, d), status: isCloud() ? (cloud.status[k] || "approved") : "approved" });
    }
    return out;
  }
  // ---------- Státní svátky ČR ----------
  function easterSunday(y) {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1, day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month, day);
  }
  const holidayCache = {};
  function holidaysOf(y) {
    if (holidayCache[y]) return holidayCache[y];
    const list = {
      [keyOf(y, 0, 1)]: "Den obnovy samostatného českého státu, Nový rok",
      [keyOf(y, 4, 1)]: "Svátek práce",
      [keyOf(y, 4, 8)]: "Den vítězství",
      [keyOf(y, 6, 5)]: "Den slovanských věrozvěstů Cyrila a Metoděje",
      [keyOf(y, 6, 6)]: "Den upálení mistra Jana Husa",
      [keyOf(y, 8, 28)]: "Den české státnosti",
      [keyOf(y, 9, 28)]: "Den vzniku samostatného československého státu",
      [keyOf(y, 10, 17)]: "Den boje za svobodu a demokracii",
      [keyOf(y, 11, 24)]: "Štědrý den",
      [keyOf(y, 11, 25)]: "1. svátek vánoční",
      [keyOf(y, 11, 26)]: "2. svátek vánoční"
    };
    const es = easterSunday(y);
    const fri = new Date(y, es.getMonth(), es.getDate() - 2);
    const mon = new Date(y, es.getMonth(), es.getDate() + 1);
    list[keyOf(fri.getFullYear(), fri.getMonth(), fri.getDate())] = "Velký pátek";
    list[keyOf(mon.getFullYear(), mon.getMonth(), mon.getDate())] = "Velikonoční pondělí";
    return (holidayCache[y] = list);
  }
  const holidayName = (y, m, d) => holidaysOf(y)[keyOf(y, m, d)] || "";

  // Hodiny a odhad mzdy jedné služby podle dne, kdy začíná
  function shiftPay(t, y, m, d) {
    const h = hoursOf(t);
    const dow = new Date(y, m, d).getDay();
    const holiday = !!holidayName(y, m, d);
    const weekend = dow === 0 || dow === 6;
    const bonus = (t.night ? (Number(data.nightPct) || 0) : 0) +
      (holiday ? (Number(data.holidayPct) || 0) : 0) +
      (weekend ? (Number(data.weekendPct) || 0) : 0);
    return { h, holiday, weekend, bonus, pay: h * (Number(data.wage) || 0) * (1 + bonus / 100) };
  }

  function calc() {
    const per = {};
    let hours = 0, pay = 0, holidayHours = 0, weekendHours = 0, count = 0;
    for (const e of monthEntries()) {
      if (e.status !== "approved") continue; // čekající a zamítnuté se nepočítají
      const t = typeById(e.code);
      const s = shiftPay(t, view.y, view.m, e.day);
      const r = per[t.id] || (per[t.id] = { t, n: 0, h: 0, pay: 0 });
      r.n++; r.h += s.h; r.pay += s.pay;
      hours += s.h; pay += s.pay;
      if (!t.off) count++;
      if (s.holiday) holidayHours += s.h;
      if (s.weekend) weekendHours += s.h;
    }
    return { per, hours, pay, holidayHours, weekendHours, count };
  }

  // ---------- Render ----------
  function renderMonthLabel() {
    $("#monthLabel").textContent = `${MONTHS[view.m]} ${view.y}`;
  }

  function renderPalette() {
    const pills = data.types.map(t =>
      `<button class="pill${brush === t.id ? " on" : ""}" data-type="${esc(t.id)}" style="--c:${esc(t.color)};--t:${textOn(t.color)}">` +
      `<b>${esc(shortOf(t))}</b><span>${esc(t.name)}</span></button>`);
    pills.push(`<button class="pill clear${brush === "C" ? " on" : ""}" data-type="C"><b>✕</b><span>Smazat</span></button>`);
    $("#palette").innerHTML = pills.join("");
  }

  function renderGrid() {
    if (!selDay || selDay > daysIn(view.y, view.m)) selDay = defaultSelDay();
    const grid = $("#grid");
    grid.innerHTML = "";
    const offset = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) {
      const e = document.createElement("div");
      e.className = "day empty";
      grid.appendChild(e);
    }
    const today = keyOf(now.getFullYear(), now.getMonth(), now.getDate());
    const n = daysIn(view.y, view.m);
    for (let d = 1; d <= n; d++) {
      const k = keyOf(view.y, view.m, d);
      const dow = new Date(view.y, view.m, d).getDay();
      const t = typeById(data.shifts[k]);
      const cell = document.createElement("button");
      const hol = holidayName(view.y, view.m, d);
      cell.className = "day" + (t ? " has" : "") + (dow === 0 || dow === 6 ? " weekend" : "") + (hol ? " holiday" : "") + (k === today ? " today" : "") + (d === selDay ? " sel" : "") + (isCloud() && cloud.status[k] && cloud.status[k] !== "approved" ? " " + cloud.status[k] : "");
      cell.setAttribute("aria-label", `${fullDate(new Date(view.y, view.m, d))}${hol ? ", státní svátek" : ""}${t ? ", " + t.name : ""}`);
      if (t) { cell.style.background = t.color; cell.style.color = textOn(t.color); }
      cell.dataset.day = d;
      cell.innerHTML = `<span>${d}</span><span class="code">${t ? esc(shortOf(t)) : ""}</span>`;
      grid.appendChild(cell);
    }
    const hl = [];
    for (let d = 1; d <= n; d++) {
      const hol = holidayName(view.y, view.m, d);
      if (hol) hl.push(`<div><b>${d}. ${view.m + 1}.</b><span>${esc(hol)}</span></div>`);
    }
    const box = $("#holidayList");
    box.innerHTML = hl.join("");
    box.hidden = !hl.length;
    renderDayDetail();
  }

  // Detail vybraného dne pod kalendářem
  let selDay = 0;
  function defaultSelDay() {
    return (now.getFullYear() === view.y && now.getMonth() === view.m) ? now.getDate() : 1;
  }
  function renderDayDetail() {
    if (!selDay || selDay > daysIn(view.y, view.m)) selDay = defaultSelDay();
    const dt = new Date(view.y, view.m, selDay);
    const names = nameDay(view.m, selDay);
    const hol = holidayName(view.y, view.m, selDay);
    const t = typeById(data.shifts[keyOf(view.y, view.m, selDay)]);
    let shift = `<div class="dd-row">Služba: <b>žádná</b></div>`;
    if (t) {
      const s = shiftPay(t, view.y, view.m, selDay);
      shift = t.off
        ? `<div class="dd-row">Služba: <b>${esc(t.name)}</b></div>`
        : `<div class="dd-row">Služba: <b>${esc(t.name)}</b> ${esc(rangeLabel(t))} · ${fmtH(s.h)} · odhad <b>${fmtInt(s.pay)} Kč</b>${s.bonus ? ` (+${s.bonus} %)` : ""}</div>`;
    }
    const st = isCloud() ? cloud.status[keyOf(view.y, view.m, selDay)] : null;
    if (st === "pending") shift += `<div class="dd-row">Stav: <b>čeká na schválení</b> (zatím se nezapočítává)</div>`;
    if (st === "rejected") shift += `<div class="dd-row">Stav: <b>zamítnuto</b> – klepnutím na den žádost smažete nebo pošlete jinou</div>`;
    $("#dayDetail").innerHTML =
      `<div class="dd-date">${fullDate(dt)}</div>` +
      `<div class="dd-row">Svátek má: <b>${names ? esc(names) : "—"}</b></div>` +
      (hol ? `<div class="dd-row dd-hol">Státní svátek: <b>${esc(hol)}</b></div>` : "") +
      shift;
  }

  function renderStats() {
    const c = calc();
    $("#sHours").textContent = fmtH(c.hours);
    $("#sPay").textContent = fmtInt(c.pay) + " Kč";
  }

  function renderSummary() {
    const c = calc();
    const rows = data.types
      .filter(t => c.per[t.id])
      .map(t => {
        const r = c.per[t.id];
        return `<div class="row"><span>${esc(t.name)}</span><span><b>${r.n}×</b>${r.h ? " · " + fmtH(r.h) : ""}</span></div>`;
      });
    $("#sumRows").innerHTML = (rows.length ? rows.join("") : `<p class="muted">Tento měsíc zatím nemá žádné služby.</p>`) +
      `<div class="row"><span>Celkem odpracováno</span><b>${fmtH(c.hours)}</b></div>` +
      (c.holidayHours ? `<div class="row"><span>Z toho ve svátek</span><b>${fmtH(c.holidayHours)}</b></div>` : "") +
      (c.weekendHours ? `<div class="row"><span>Z toho o víkendu</span><b>${fmtH(c.weekendHours)}</b></div>` : "") +
      `<div class="row"><span>Odhad mzdy</span><span class="total">${fmtInt(c.pay)} Kč</span></div>`;
    $("#waText").value = buildWhatsApp();
  }

  function buildWhatsApp() {
    const entries = monthEntries().filter(e => e.status !== "rejected");
    if (!entries.length) return "Zatím nejsou zadané žádné služby.";
    const lines = entries.map(e => {
      const t = typeById(e.code);
      const dow = DAYS_SHORT[e.date.getDay()];
      const detail = t.off ? "" : ` (${rangeLabel(t)}, ${fmtH(hoursOf(t))})`;
      const hol = holidayName(view.y, view.m, e.day);
      return `${e.day}. ${dow} – ${t.name}${detail}${hol ? ` 🎉 ${hol}` : ""}${e.status === "pending" ? " (čeká na schválení)" : ""}`;
    });
    const who = isAdmin() && cloud.viewUser !== me() ? ` – ${memberName(cloud.viewUser)}` : "";
    return `*Služby${who} – ${MONTHS[view.m]} ${view.y}*\n\n` + lines.join("\n") +
      `\n\n⏱ Celkem: ${fmtH(calc().hours)}`;
  }

  // Seznam typů v nastavení. Při psaní se nepřekresluje, aby nezmizel focus.
  function renderTypeList() {
    const ro = isCloud() && !isAdmin();
    $("#typeList").innerHTML = (ro ? `<p class="muted" style="margin:0 0 8px">Typy služeb spravuje staniční sestra.</p>` : "") +
      `<fieldset class="plain"${ro ? " disabled" : ""}>` + data.types.map(t => `
      <div class="type" data-tid="${esc(t.id)}">
        <div class="type-top">
          <input type="color" class="swatch" data-f="color" value="${esc(t.color)}" aria-label="Barva">
          <input class="grow" data-f="name" value="${esc(t.name)}" maxlength="60" aria-label="Název">
          <input class="codein" data-f="code" value="${esc(t.code)}" maxlength="4" aria-label="Zkratka">
        </div>
        <div class="type-mid">
          ${t.off ? "" : `
          <label>Od <input type="time" data-f="start" value="${esc(t.start)}"></label>
          <label>Do <input type="time" data-f="end" value="${esc(t.end)}"></label>`}
          <span class="hrs" data-hours>${fmtH(hoursOf(t))}</span>
        </div>
        <div class="type-bot">
          <label class="chk"><input type="checkbox" data-f="off" ${t.off ? "checked" : ""}> Volno (bez hodin)</label>
          <label class="chk"><input type="checkbox" data-f="night" ${t.night ? "checked" : ""}> Příplatek za noc</label>
          <button class="btn danger small" data-act="delType" data-tid="${esc(t.id)}">Smazat</button>
        </div>
      </div>`).join("") + `</fieldset>`;
  }

  function renderSettingsFields() {
    $("#setWage").value = data.wage;
    $("#setNight").value = data.nightPct;
    $("#setHoliday").value = data.holidayPct;
    $("#setWeekend").value = data.weekendPct;
    $$("#themeChips .chip").forEach(c => c.classList.toggle("on", c.dataset.theme === (isDark() ? "dark" : "light")));
  }

  // Vzhled: výchozí je tmavý, tlačítkem 🌙 / ☀️ se dá přepnout na světlý
  const isDark = () => data.theme !== "light";

  function applyTheme() {
    const dark = isDark();
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? "#312e81" : "#4f46e5";
    const btn = $("#themeBtn");
    if (btn) {
      btn.textContent = dark ? "🌙" : "☀️";
      btn.setAttribute("aria-label", dark ? "Tmavý vzhled. Klepnutím přepnete na světlý." : "Světlý vzhled. Klepnutím přepnete na tmavý.");
    }
  }

  function renderAll() {
    renderMonthLabel();
    renderPalette();
    renderGrid();
    renderStats();
    renderSummary();
    renderTypeList();
    renderSettingsFields();
    applyTheme();
    renderAccount();
    renderAdmin();
  }

  function updateLive() {
    renderPalette();
    renderGrid();
    renderStats();
    renderSummary();
  }

  // ---------- Pomocné ----------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  // Dvoukliková potvrzovací tlačítka (confirm() v prohlížeči artefaktu nefunguje)
  function armButton(btn, label, onConfirm) {
    if (btn.dataset.armed) {
      clearTimeout(btn._t);
      delete btn.dataset.armed;
      onConfirm();
      return;
    }
    const old = btn.textContent;
    btn.dataset.armed = "1";
    btn.textContent = label;
    btn._t = setTimeout(() => { delete btn.dataset.armed; btn.textContent = old; }, 3000);
  }

  function showTab(name) {
    currentTab = name;
    $("#monthBar").hidden = !(name === "cal" || name === "sum");
    $$(".view").forEach(v => v.classList.toggle("on", v.id === "view-" + name));
    $$("nav.tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === name));
    window.scrollTo(0, 0);
    if (name === "ai") openAssistant();
    if (name === "set") { renderDrive(); if (GOOGLE_CLIENT_ID && !inWebView()) loadGis().catch(() => {}); }
    renderAdmin();
  }

  function toggleDay(day) {
    selDay = day;
    const k = keyOf(view.y, view.m, day);
    if (isCloud()) {
      const cur = data.shifts[k];
      cloudSetDay(k, (brush === "C" || cur === brush) ? null : (typeById(brush) ? brush : null));
      return;
    }
    if (brush === "C" || data.shifts[k] === brush) delete data.shifts[k];
    else data.shifts[k] = brush;
    save();
    renderGrid(); renderStats(); renderSummary();
  }

  function shiftMonth(delta) {
    view.m += delta;
    if (view.m < 0) { view.m = 11; view.y--; }
    if (view.m > 11) { view.m = 0; view.y++; }
    selDay = defaultSelDay();
    renderAll();
    if (isCloud() && view.y !== cloud.loadedYear) loadShifts().then(renderAll);
  }

  // ---------- Platba ----------
  function mod97(str) {
    let r = 0;
    for (const ch of str) r = (r * 10 + Number(ch)) % 97;
    return r;
  }
  function czToIban(input) {
    const m = input.match(/^(?:(\d{1,6})-)?(\d{1,10})\/(\d{4})$/);
    if (!m) return null;
    const prefix = (m[1] || "0").padStart(6, "0");
    const number = m[2].padStart(10, "0");
    const bban = m[3] + prefix + number;
    const check = String(98 - mod97(bban + "123500")).padStart(2, "0");
    return "CZ" + check + bban;
  }
  function validIban(iban) {
    const numeric = (iban.slice(4) + iban.slice(0, 4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
    return mod97(numeric) === 1;
  }
  function cleanMsg(s) {
    return String(s).replace(/[*:%]/g, " ").trim().slice(0, 60);
  }

  const DON_IBAN = "CZ2655000000000598701011";
  const DON_NAME = "MAREK SAFRANEK";

  function donAmountValue() {
    if (donAmount > 0) return donAmount;
    const v = Math.round(Number($("#donCustom").value) || 0);
    return v > 0 ? v : 0;
  }

  function makeQr() {
    let spd = `SPD*1.0*ACC:${DON_IBAN}`;
    const amt = donAmountValue();
    if (amt > 0) spd += `*AM:${amt.toFixed(2)}`;
    spd += `*CC:CZK*RN:${DON_NAME}`;
    // bez diakritiky, aby QR kód přečetly všechny banky
    const msg = cleanMsg($("#donMsg").value).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (msg) spd += `*MSG:${msg}`;
    spd += "*";

    const box = $("#qrBox");
    if (typeof window.qrcode === "function") {
      const qr = window.qrcode(0, "M");
      qr.addData(spd, "Byte");
      qr.make();
      box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2 });
    } else {
      box.innerHTML = '<span style="color:#64748b;font-size:13px;text-align:center">QR kód se nenačetl (zkontrolujte připojení). Zkuste to prosím později.</span>';
    }
  }

  function initDonate() {
    makeQr();
  }

  async function copyText(text, okMsg, fallbackEl) {
    try { await navigator.clipboard.writeText(text); toast(okMsg); }
    catch (_) {
      if (fallbackEl) { fallbackEl.select(); }
      try { document.execCommand("copy"); toast(okMsg); }
      catch (__) { toast("Kopírování se nepovedlo. Text označte ručně."); }
    }
  }


  // ---------- Postranní panel O aplikaci ----------
  const drawerOpen = () => $("#drawer").classList.contains("open");
  const sheetOpen = () => $("#sheet").classList.contains("open");
  function showDrawer() {
    $("#drawer").classList.add("open"); $("#scrim").classList.add("show");
    $("#drawer").setAttribute("aria-hidden", "false");
  }
  function hideDrawer() {
    $("#drawer").classList.remove("open"); $("#scrim").classList.remove("show");
    $("#drawer").setAttribute("aria-hidden", "true");
  }
  function showSheet(id) {
    const tpl = document.getElementById(id);
    if (!tpl) return;
    $("#sheetTitle").textContent = tpl.dataset.title;
    const body = $("#sheetBody");
    body.innerHTML = "";
    body.appendChild(tpl.content.cloneNode(true));
    body.scrollTop = 0;
    $("#sheet").classList.add("open");
  }
  function hideSheet() { $("#sheet").classList.remove("open"); }
  function pushUi(ui) { try { history.pushState({ ui }, ""); } catch (_) {} }
  function closeUi(ui, hide) {
    if (history.state && history.state.ui === ui) { try { history.back(); return; } catch (_) {} }
    hide();
  }
  window.addEventListener("popstate", () => {
    if (sheetOpen()) hideSheet();
    else if (drawerOpen()) hideDrawer();
  });
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (sheetOpen()) closeUi("sheet", hideSheet);
    else if (drawerOpen()) closeUi("drawer", hideDrawer);
  });


  // ---------- Asistent (běží v aplikaci, bez internetu) ----------
  const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  const NAME_INDEX = (() => {
    const idx = {};
    for (const k in NAMEDAYS) {
      const [m, d] = k.split("-").map(Number);
      NAMEDAYS[k].split(/,\s*|\s+a\s+/).filter(Boolean).forEach(n => {
        (idx[norm(n)] = idx[norm(n)] || { name: n, dates: [] }).dates.push([m - 1, d]);
      });
    }
    return idx;
  })();

  const BAD = [/\bkurv/, /\bpic[aeiouy]/, /\bkokot/, /\bcurak/, /\bzmrd/, /\bmrd/, /\bjeb/, /\bvyjeb/, /\bprdel/, /\bhovn/,
    /\bdebil/, /\bkreten/, /\bsuka(t|l|m|s)/, /\bfuck/, /\bshit/, /\bbitch/, /\bporn/, /\bsex/, /\bnah(a|e|y) /, /\bdrog(a|y|u|ou|ami)?\b/,
    /\bpervitin/, /\bkokain/, /\bheroin/, /\bmarihuan/, /\bzbran/, /\bbomb/];
  const RISK = [/zabit se/, /zabiju se/, /sebevra/, /nechci (uz )?zit/, /ublizit si/, /skoncit se zivotem/, /chci umrit/];

  const TIPS = [
    "Na začátku měsíce si naklikejte celý rozpis a pošlete ho rodině přes Přehled → WhatsApp. Všichni pak vědí, kdy jste v práci.",
    "Jednou za měsíc si udělejte zálohu v Nastavení → Záloha a pošlete si ji do poznámek nebo e-mailu.",
    "Služba přes půlnoc? Zadejte začátek a konec, třeba 19:00 a 07:00. Aplikace sama spočítá 12 hodin.",
    "Ve státní svátek se ke službě automaticky přičte příplatek za svátek. Výši najdete v Nastavení → Mzda.",
    "Pro vlastní druh služby stačí v Nastavení klepnout na + Přidat typ služby a nastavit čas a barvu.",
    "Po noční službě si dopřejte spánek ve tmě a tichu. Pomáhá zatemnění a vypnutý telefon.",
    "Při dlouhé službě pijte průběžně, ne až na konci. Malé doušky po celou dobu udrží pozornost.",
    "Klepnutím na den v kalendáři uvidíte, kdo má svátek, jestli je státní svátek a kolik vám služba vydělá.",
    "Tlačítkem 🌙 / ☀️ vpravo nahoře přepnete tmavý a světlý vzhled."
  ];

  function greetingWord(h) {
    if (h < 4) return "Dobrý večer";
    if (h < 9) return "Dobré ráno";
    if (h < 12) return "Dobré dopoledne";
    if (h < 18) return "Dobré odpoledne";
    if (h < 22) return "Dobrý večer";
    return "Dobrý večer";
  }
  const timeStr = d => `${d.getHours()}:${pad(d.getMinutes())}`;

  function todayInfo() {
    const n = new Date();
    const tm = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
    const names = nameDay(n.getMonth(), n.getDate());
    const tNames = nameDay(tm.getMonth(), tm.getDate());
    const hol = holidayName(n.getFullYear(), n.getMonth(), n.getDate());
    const t = typeById(data.shifts[keyOf(n.getFullYear(), n.getMonth(), n.getDate())]);
    let s = `Dnes je <b>${fullDate(n)}</b> a je <b>${timeStr(n)}</b>.`;
    s += names ? ` Svátek má <b>${esc(names)}</b>` : " Dnes nemá svátek nikdo z kalendáře";
    s += tNames ? `, zítra <b>${esc(tNames)}</b>.` : ".";
    if (hol) s += `<br>Dnes je státní svátek: <b>${esc(hol)}</b>.`;
    if (t) s += t.off ? `<br>Dnes máte <b>volno</b>. Užijte si ho.` : `<br>Dnes máte službu <b>${esc(t.name)}</b> (${esc(rangeLabel(t))}).`;
    return s;
  }

  function nextHolidays(count) {
    const out = [];
    const n = new Date();
    const start = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    for (let y = n.getFullYear(); y <= n.getFullYear() + 1 && out.length < count; y++) {
      const list = Object.entries(holidaysOf(y)).sort((a, b) => a[0] < b[0] ? -1 : 1);
      for (const [k, name] of list) {
        const [yy, mm, dd] = k.split("-").map(Number);
        const dt = new Date(yy, mm - 1, dd);
        if (dt >= start) out.push({ dt, name });
        if (out.length >= count) break;
      }
    }
    return out;
  }

  function daysUntil(dt) {
    const n = new Date();
    const a = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
    const b = Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate());
    return Math.round((b - a) / 864e5);
  }
  const inDays = k => k === 0 ? "dnes" : k === 1 ? "zítra" : k < 5 ? `za ${k} dny` : `za ${k} dní`;

  // Bezpečná kalkulačka: + - * / ^ ( ) a procenta, bez eval
  function calcExpr(src) {
    let s = src.replace(/×|x/gi, "*").replace(/÷|:/g, "/").replace(/,/g, ".").replace(/\s+/g, "");
    // "… + b %" na konci = celý příklad navýšený o b procent, "… - b %" = snížený; jinde "b %" = b/100
    const tail = s.match(/^(.+)([+\-])(\d+(?:\.\d+)?)%$/);
    if (tail) s = `(${tail[1]})*(1${tail[2]}${tail[3]}/100)`;
    s = s.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)");
    if (!/^[\d.+\-*/^()]+$/.test(s) || !/[+\-*/^]/.test(s.replace(/^-/, ""))) return null;
    const tokens = s.match(/\d+(?:\.\d+)?|[+\-*/^()]/g);
    if (!tokens) return null;
    let i = 0;
    const peek = () => tokens[i];
    function prim() {
      const tk = tokens[i++];
      if (tk === "(") { const v = add(); if (tokens[i++] !== ")") throw 0; return v; }
      if (tk === "-") return -prim();
      if (tk === "+") return prim();
      if (tk !== undefined && /^\d/.test(tk)) return parseFloat(tk);
      throw 0;
    }
    function pow() { const b = prim(); if (peek() === "^") { i++; return Math.pow(b, pow()); } return b; }
    function mul() { let v = pow(); while (peek() === "*" || peek() === "/") { const op = tokens[i++]; const r = pow(); v = op === "*" ? v * r : v / r; } return v; }
    function add() { let v = mul(); while (peek() === "+" || peek() === "-") { const op = tokens[i++]; const r = mul(); v = op === "+" ? v + r : v - r; } return v; }
    try {
      const v = add();
      if (i !== tokens.length || !isFinite(v)) return null;
      return v;
    } catch (_) { return null; }
  }
  const fmtNum = v => (Math.round(v * 1e6) / 1e6).toLocaleString("cs-CZ", { maximumFractionDigits: 6 });

  function findDate(q) {
    if (/\bdnes\b/.test(q)) return 0;
    if (/\bzitra\b/.test(q)) return 1;
    if (/\bpozitri\b/.test(q)) return 2;
    if (/\bvcera\b/.test(q)) return -1;
    const m = q.match(/\b(\d{1,2})\.\s?(\d{1,2})\.?/);
    if (m) return { d: +m[1], m: +m[2] - 1 };
    for (let k = 0; k < 12; k++) {
      const mm = q.match(new RegExp("\\b(\\d{1,2})\\.?\\s?" + norm(MONTHS_GEN[k]) + "\\b"));
      if (mm) return { d: +mm[1], m: k };
    }
    return null;
  }

  function findName(text) {
    const STOP = new Set(["kdy","ma","svatek","jmeniny","kdo","dnes","zitra","vcera","pozitri","prosim","mi","rekni","a","jake","jaky","je","the","slavi","oslavuje","name"]);
    const words = norm(text).replace(/[^a-z\s]/g, " ").split(" ").filter(w => w.length > 1 && !STOP.has(w));
    for (const w of words) if (NAME_INDEX[w]) return NAME_INDEX[w];
    const ends = ["ovi","ou","em","e","u","y","a","i"];
    for (const w of words) for (const e of ends) {
      if (w.endsWith(e) && w.length - e.length >= 2) {
        const base = w.slice(0, -e.length);
        if (NAME_INDEX[base]) return NAME_INDEX[base];
        if (NAME_INDEX[base + "a"]) return NAME_INDEX[base + "a"];
      }
    }
    return null;
  }

  function monthReport() {
    const c = calc();
    const head = `${MONTHS[view.m]} ${view.y}`;
    if (!c.count && !c.hours) return `V měsíci <b>${head}</b> zatím nemáte žádné služby. Naklikejte je v Kalendáři.`;
    let s = `Za <b>${head}</b>: <b>${c.count}</b> ${c.count === 1 ? "služba" : c.count < 5 ? "služby" : "služeb"}, celkem <b>${fmtH(c.hours)}</b>.`;
    const parts = [];
    if (c.holidayHours) parts.push(`ve svátek ${fmtH(c.holidayHours)}`);
    if (c.weekendHours) parts.push(`o víkendu ${fmtH(c.weekendHours)}`);
    if (parts.length) s += ` Z toho ${parts.join(", ")}.`;
    return s;
  }
  function payReport() {
    const c = calc();
    if (!c.hours) return `Tento měsíc zatím nemáte žádné odpracované hodiny, takže odhad je 0 Kč.`;
    return `Odhad mzdy za <b>${MONTHS[view.m]} ${view.y}</b> je <b>${fmtInt(c.pay)} Kč</b> hrubého ` +
      `(${fmtH(c.hours)} × ${fmtInt(data.wage)} Kč/h a příplatky: noc ${data.nightPct || 0} %, svátek ${data.holidayPct || 0} %, víkend ${data.weekendPct || 0} %).` +
      `<br>Je to jen orientační částka bez daní a odvodů. Sazby změníte v Nastavení → Mzda.`;
  }

  function reply(text) {
    const q = norm(text);
    if (!q) return null;
    if (RISK.some(r => r.test(q))) {
      return "Je mi líto, že je vám takhle těžko. Nemusíte na to být sami. Zavolejte prosím na <b>Linku první psychické pomoci 116 123</b> (nonstop, zdarma), nebo se ozvěte někomu blízkému. Pokud jste v ohrožení, volejte <b>155</b> nebo <b>112</b>.";
    }
    if (BAD.some(r => r.test(q))) {
      return "Tohle sem nepatří 🙂 Jsem tu na služby, svátky, výpočty a rady k aplikaci. Zkuste se zeptat třeba „Kolik mám tento měsíc hodin?“";
    }
    if (/^(ahoj|cau|cus|nazdar|zdravim|dobry den|dobre rano|dobry vecer|hello|hi|hej)\b/.test(q)) {
      return `${greetingWord(new Date().getHours())}! ${todayInfo()}`;
    }
    if (/\b(diky|dekuji|dekuju|dik|super|paráda|parada)\b/.test(q)) return "Rádo se stalo. Kdyby něco, jsem tady.";
    if (/co umis|napoveda|\bhelp\b|jak ti|co dokazes|s cim/.test(q)) {
      return "Umím tohle:<ul><li>kdo má dnes, zítra nebo v určitý den svátek, a kdy má svátek konkrétní jméno,</li><li>státní svátky a kolik zbývá do nejbližšího,</li><li>kolik máte tento měsíc služeb, hodin a odhad mzdy,</li><li>délku služby (třeba „od 19:00 do 7:00“),</li><li>kalkulačku: + − × ÷, závorky, mocniny a procenta,</li><li>tipy k aplikaci a k práci na směny,</li><li>zapsat službu příkazem, třeba „dej mi příští úterý ranní“, „chci volno v pátek“, „zruš mi zítřek“ nebo „dej mi noční každou středu v prosinci“. Když mě opravíte, zapamatuji si to.</li></ul>Jsem jednoduchý pomocník přímo v aplikaci, ne umělá inteligence s internetem, takže na obecné otázky mimo tato témata neodpovím.";
    }
    // délka služby
    const tm = q.match(/(\d{1,2})[:.](\d{2})\s*(?:-|–|do|az)\s*(\d{1,2})[:.](\d{2})/) || q.match(/\bod (\d{1,2})(?:[:.](\d{2}))? do (\d{1,2})(?:[:.](\d{2}))?/);
    if (tm) {
      const a = (+tm[1]) * 60 + (+(tm[2] || 0)), b = (+tm[3]) * 60 + (+(tm[4] || 0));
      if (+tm[1] < 25 && +tm[3] < 25) {
        let dmin = (b - a + 1440) % 1440; if (dmin === 0) dmin = 1440;
        const hh = Math.floor(dmin / 60), mm = dmin % 60;
        return `Od ${tm[1]}:${pad(+(tm[2] || 0))} do ${tm[3]}:${pad(+(tm[4] || 0))} je to <b>${hh} h${mm ? " " + mm + " min" : ""}</b>${b <= a ? " (přes půlnoc)" : ""}.`;
      }
    }
    // procenta "x % z y"
    const pz = q.match(/(\d+(?:[.,]\d+)?)\s*%\s*z\s*(\d+(?:[.,]\d+)?)/);
    if (pz) {
      const v = parseFloat(pz[1].replace(",", ".")) / 100 * parseFloat(pz[2].replace(",", "."));
      return `${pz[1]} % z ${pz[2]} je <span class="calc">${fmtNum(v)}</span>`;
    }
    // jmeniny
    if (/svatek|jmenin/.test(q) && !/statni|statnich/.test(q)) {
      const when = findDate(q);
      if (/\bkdo\b|\bdnes\b|\bzitra\b|\bvcera\b|\bpozitri\b/.test(q) || (when && typeof when === "object")) {
        let dt;
        if (typeof when === "number") { const n = new Date(); dt = new Date(n.getFullYear(), n.getMonth(), n.getDate() + when); }
        else if (when) dt = new Date(new Date().getFullYear(), when.m, when.d);
        else dt = new Date();
        const names = nameDay(dt.getMonth(), dt.getDate());
        const hol = holidayName(dt.getFullYear(), dt.getMonth(), dt.getDate());
        let s = `${fullDate(dt).replace(/^./, c => c.toUpperCase())}: `;
        s += names ? `svátek má <b>${esc(names)}</b>.` : "podle kalendáře nemá svátek nikdo.";
        if (hol) s += `<br>Je to státní svátek: <b>${esc(hol)}</b>.`;
        return s;
      }
      const f = findName(text);
      if (f) {
        const list = f.dates.map(([m, d]) => {
          const n = new Date();
          let dt = new Date(n.getFullYear(), m, d);
          if (daysUntil(dt) < 0) dt = new Date(n.getFullYear() + 1, m, d);
          return `<b>${d}. ${MONTHS_GEN[m]}</b> (${inDays(daysUntil(dt))})`;
        });
        return `${esc(f.name)} má svátek ${list.join(" a ")}.`;
      }
      return "To jméno v českém kalendáři nenacházím. Zkuste ho napsat v prvním pádě, třeba „Kdy má svátek Petr?“";
    }
    // státní svátky
    if (/statni|svatky|volno ze zakona|velikonoc|vanoc/.test(q)) {
      const list = nextHolidays(5);
      const first = list[0];
      return `Nejbližší státní svátek je <b>${esc(first.name)}</b>, ${fullDate(first.dt)} (${inDays(daysUntil(first.dt))}).` +
        `<ul>${list.slice(1).map(h => `<li>${h.dt.getDate()}. ${MONTHS_GEN[h.dt.getMonth()]} ${h.dt.getFullYear()}: ${esc(h.name)}</li>`).join("")}</ul>`;
    }
    // čas a datum
    if (/kolik je hodin|\bcas\b|kolik je ted/.test(q)) return `Je <b>${timeStr(new Date())}</b>.`;
    if (/datum|jaky je (dnes )?den|co je dnes|ktery je dnes/.test(q)) return todayInfo();
    // mzda a hodiny
    if (/vydel|mzd|vyplat|penez|penize|kolik dostanu|plat\b/.test(q)) return payReport();
    if (/hodin|sluzb|smen|odpracov|prehled/.test(q)) return monthReport();
    if (/priplat/.test(q)) {
      return `Aplikace počítá tři příplatky, které nastavíte v Nastavení → Mzda: za noc (teď ${data.nightPct || 0} %), za státní svátek (${data.holidayPct || 0} %) a za víkend (${data.weekendPct || 0} %). Sčítají se. Zákoník práce určuje minimum 10 % za noc a víkend a 100 % za svátek, pokud nedostanete náhradní volno. Ve státní sféře (plat) platí jiné sazby.`;
    }
    // nápověda k aplikaci
    if (/zaloh/.test(q)) return "Záloha: Nastavení → Záloha → <b>Vytvořit zálohu</b> → <b>Kopírovat zálohu</b>. Text si pošlete do poznámek nebo e-mailu. Obnovíte ji vložením do pole a klepnutím na Obnovit ze zálohy.";
    if (/whats|poslat|sdilet|export/.test(q)) return "Rozpis pošlete v záložce <b>Přehled</b> → <b>Otevřít ve WhatsAppu</b>. Můžete ho i zkopírovat nebo sdílet jinam.";
    if (/\bups\b|pohotovost/.test(q)) return "UPS (ústavní pohotovostní služba) je předvolená jako 24hodinová služba. Čas a barvu upravíte v Nastavení → Typy služeb.";
    if (/typ|pridat|nova sluzba|vlastni/.test(q)) return "Nový typ služby přidáte v Nastavení → <b>+ Přidat typ služby</b>. Nastavte název, zkratku, začátek, konec a barvu.";
    if (/\btip|\brad[au]|poradi|doporuc/.test(q)) return "💡 " + TIPS[Math.floor(Math.random() * TIPS.length)];
    // kalkulačka
    const expr = text.replace(/^(.*?)(spocitej|spočítej|vypocitej|vypočítej|kolik je|kolik dela|kolik dělá)\s*/i, "").replace(/[=?]\s*$/, "").trim();
    const v = calcExpr(expr);
    if (v !== null) return `${esc(expr)} = <span class="calc">${fmtNum(v)}</span>`;
    return "Tomu úplně nerozumím. Zkuste třeba „Kdo má zítra svátek?“, „Kolik vydělám?“, „od 19:00 do 7:00“ nebo příklad „1250 * 1,1“. Napište „Co umíš?“ a ukážu vám víc.";
  }

  function addMsg(html, who) {
    const el = document.createElement("div");
    el.className = "msg " + who;
    el.innerHTML = html;
    $("#chat").appendChild(el);
    requestAnimationFrame(() => window.scrollTo(0, document.body.scrollHeight));
  }
  let greeted = false;
  function openAssistant() {
    if (greeted) return;
    greeted = true;
    addMsg(`${greetingWord(new Date().getHours())}, vítejte v aplikaci Tvoje šichta! ${todayInfo()}<br>Na co se chcete zeptat?`, "bot");
  }
  function ask(text) {
    const q = String(text).trim().slice(0, 300);
    if (!q) return;
    addMsg(esc(q), "me");
    const cmd = parseCommand(q);
    if (aiReady() && looksLikeShiftCommand(q, cmd)) { aiParse(q, cmd); return; }
    if (cmd) { setTimeout(() => showCommand(cmd), 250); return; }
    const r = reply(q);
    if (r) setTimeout(() => addMsg(r, "bot"), 250);
  }
  $("#chatForm").addEventListener("submit", e => {
    e.preventDefault();
    const inp = $("#chatInput");
    ask(inp.value);
    inp.value = "";
  });
  $("#chatChips").addEventListener("click", e => {
    const b = e.target.closest("[data-ask]");
    if (b) ask(b.dataset.ask);
  });


  // =====================================================================
  //  CLOUD (Supabase): přihlášení, tým, směny v reálném čase
  // =====================================================================
  const THEME_KEY = "tvoje-sichta-theme";
  const cloud = {
    sb: null, user: null, profile: null, team: null, members: [],
    viewUser: null, status: {}, loadedYear: null, channel: null,
    pending: [], recovery: false, msg: "", busy: false
  };
  const cloudConfigured = () => !!(SUPABASE_URL && SUPABASE_KEY && window.supabase && window.supabase.createClient);
  const isCloud = () => !!(cloud.user && cloud.profile && cloud.team);
  const isAdmin = () => isCloud() && cloud.profile.role === "admin";
  const me = () => cloud.user && cloud.user.id;
  const memberName = id => {
    const m = cloud.members.find(x => x.id === id);
    return m ? (m.full_name || "Bez jména") : "Neznámý";
  };
  function readTheme() {
    try { return localStorage.getItem(THEME_KEY) || data.theme || "dark"; } catch (_) { return data.theme || "dark"; }
  }
  const czErr = e => {
    const m = String((e && e.message) || e || "");
    if (/Invalid login credentials/i.test(m)) return "Špatný e-mail nebo heslo.";
    if (/Email not confirmed/i.test(m)) return "E-mail zatím není potvrzený. Klikněte na odkaz v e-mailu od Supabase.";
    if (/User already registered/i.test(m)) return "Tento e-mail už je zaregistrovaný. Přihlaste se.";
    if (/Password should be at least/i.test(m)) return "Heslo musí mít aspoň 6 znaků.";
    if (/rate limit/i.test(m)) return "Příliš mnoho pokusů. Zkuste to za chvíli.";
    if (/Failed to fetch|NetworkError/i.test(m)) return "Nejste připojeni k internetu.";
    return m || "Něco se nepovedlo.";
  };

  const mapType = r => ({ id: r.id, code: r.code || "", name: r.name, start: r.start_time, end: r.end_time,
    color: r.color, night: !!r.night, off: !!r.off, sort: r.sort || 0 });

  function enterCloudMode(types) {
    const p = cloud.profile;
    const learned = (data.aiLearn && cloud.wasCloud) ? data.aiLearn : { aliases: {}, history: [] };
    data = {
      ...DEFAULT(),
      theme: readTheme(),
      shifts: {},
      types: types.map(mapType),
      wage: Number(p.wage), nightPct: Number(p.night_pct), holidayPct: Number(p.holiday_pct), weekendPct: Number(p.weekend_pct),
      aiLearn: learned
    };
    cloud.wasCloud = true;
    if (!typeById(brush) && brush !== "C") brush = data.types[0] ? data.types[0].id : "C";
  }

  function leaveCloudMode() {
    if (cloud.channel && cloud.sb) { cloud.sb.removeChannel(cloud.channel); cloud.channel = null; }
    if (cloud.wasCloud) {
      cloud.wasCloud = false;
      cloud.status = {}; cloud.pending = []; cloud.members = []; cloud.team = null;
      data = load();
      brush = data.types[0] ? data.types[0].id : "C";
      renderAll();
    }
    renderAccount(); renderAdmin();
  }

  let loadSeq = 0;
  async function loadCloud() {
    const seq = ++loadSeq;
    if (!cloud.sb || !cloud.user) { cloud.profile = null; leaveCloudMode(); return; }
    const sb = cloud.sb;
    const { data: prof, error } = await sb.rpc("my_profile").maybeSingle();
    if (seq !== loadSeq) return;
    if (error) { toast("Cloud: " + czErr(error)); return; }
    cloud.profile = prof;
    if (!prof || !prof.team_id) { cloud.team = null; leaveCloudMode(); return; }
    const [t, m, ty] = await Promise.all([
      sb.from("teams").select("*").eq("id", prof.team_id).maybeSingle(),
      sb.from("profiles").select("id, full_name, role").eq("team_id", prof.team_id).order("full_name"),
      sb.from("shift_types").select("*").eq("team_id", prof.team_id).order("sort").order("created_at")
    ]);
    if (seq !== loadSeq) return;
    if (t.error || m.error || ty.error) { toast("Cloud: " + czErr(t.error || m.error || ty.error)); return; }
    cloud.team = t.data; cloud.members = m.data || [];
    if (!cloud.viewUser || !cloud.members.some(x => x.id === cloud.viewUser) || prof.role !== "admin") cloud.viewUser = me();
    enterCloudMode(ty.data || []);
    await loadShifts();
    await loadLearned();
    subscribeCloud();
    if (isAdmin()) await loadPending();
    renderAll(); renderAccount(); renderAdmin();
  }

  async function loadShifts() {
    if (!isCloud()) return;
    const from = `${view.y - 1}-01-01`, to = `${view.y + 1}-12-31`;
    const { data: rows, error } = await cloud.sb.from("shifts")
      .select("day, type_id, status").eq("user_id", cloud.viewUser).gte("day", from).lte("day", to).limit(3000);
    if (error) { toast("Cloud: " + czErr(error)); return; }
    cloud.loadedYear = view.y;
    data.shifts = {}; cloud.status = {};
    for (const r of rows || []) { data.shifts[r.day] = r.type_id; cloud.status[r.day] = r.status; }
  }

  async function reloadTypes() {
    if (!isCloud()) return;
    const { data: rows, error } = await cloud.sb.from("shift_types").select("*").eq("team_id", cloud.team.id).order("sort").order("created_at");
    if (error) return;
    data.types = (rows || []).map(mapType);
    if (!typeById(brush) && brush !== "C") brush = data.types[0] ? data.types[0].id : "C";
    updateLive();
    if (!document.activeElement || !document.activeElement.closest("#typeList")) renderTypeList();
  }

  async function loadPending() {
    if (!isAdmin()) { cloud.pending = []; return; }
    const { data: rows, error } = await cloud.sb.from("shifts")
      .select("id, day, type_id, user_id").eq("team_id", cloud.team.id).eq("status", "pending").order("day").limit(200);
    cloud.pending = error ? [] : (rows || []);
    renderPending();
  }

  let rtTimer = null;
  function subscribeCloud() {
    if (cloud.channel) cloud.sb.removeChannel(cloud.channel);
    const f = `team_id=eq.${cloud.team.id}`;
    cloud.channel = cloud.sb.channel("team-" + cloud.team.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "shifts", filter: f }, () => {
        clearTimeout(rtTimer);
        rtTimer = setTimeout(async () => { await loadShifts(); await loadPending(); updateLive(); renderAdmin(); }, 400);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "shift_types", filter: f }, () => reloadTypes())
      .subscribe();
  }

  // Uložení / smazání jedné služby (optimisticky, při chybě se vrátí zpět)
  async function cloudSetDay(k, typeId, userId) {
    const target = userId || cloud.viewUser;
    const admin = isAdmin();
    const viewing = target === cloud.viewUser;
    const prev = data.shifts[k], prevSt = cloud.status[k];
    if (!admin && viewing && prevSt === "approved") {
      toast("Schválenou službu může změnit jen staniční sestra.");
      return false;
    }
    if (viewing) {
      if (typeId) { data.shifts[k] = typeId; cloud.status[k] = admin ? "approved" : "pending"; }
      else { delete data.shifts[k]; delete cloud.status[k]; }
      renderGrid(); renderStats(); renderSummary();
    }
    const res = typeId
      ? await cloud.sb.from("shifts").upsert({ team_id: cloud.team.id, user_id: target, day: k, type_id: typeId,
          status: admin ? "approved" : "pending", created_by: me() }, { onConflict: "user_id,day" })
      : await cloud.sb.from("shifts").delete().eq("user_id", target).eq("day", k);
    if (res.error) {
      if (viewing) {
        if (prev) { data.shifts[k] = prev; cloud.status[k] = prevSt; } else { delete data.shifts[k]; delete cloud.status[k]; }
        renderGrid(); renderStats(); renderSummary();
      }
      toast("Neuloženo: " + czErr(res.error));
      return false;
    }
    if (!admin && typeId) toast("Odesláno ke schválení staniční sestře.");
    if (admin) loadPending();
    return true;
  }

  const saveTypeTimers = {};
  function cloudSaveType(t) {
    if (!isAdmin()) return;
    clearTimeout(saveTypeTimers[t.id]);
    saveTypeTimers[t.id] = setTimeout(async () => {
      const { error } = await cloud.sb.from("shift_types").update({
        code: t.code, name: t.name || "Bez názvu", start_time: t.start, end_time: t.end,
        color: t.color, night: !!t.night, off: !!t.off
      }).eq("id", t.id);
      if (error) toast("Typ neuložen: " + czErr(error));
    }, 600);
  }

  async function cloudSaveProfile(patch) {
    if (!isCloud()) return;
    const { error } = await cloud.sb.from("profiles").update(patch).eq("id", me());
    if (error) toast("Neuloženo: " + czErr(error));
    else Object.assign(cloud.profile, patch);
  }

  // ---------- Účet a tým (Nastavení) ----------
  function renderAccount() {
    const box = $("#accountCard");
    if (!box) return;
    const dataCard = $("#dataCard");
    if (dataCard) $$("[data-local-only]", dataCard).forEach(el => el.hidden = isCloud());
    $("#addTypeBtn") && ($("#addTypeBtn").hidden = isCloud() && !isAdmin());
    const note = cloud.msg ? `<p class="acc-msg">${esc(cloud.msg)}</p>` : "";
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      box.innerHTML = `<h2>Účet a tým</h2><p class="muted" style="margin:0">Aplikace teď běží jen v tomto telefonu. Pro sdílení se staniční a kolegy je potřeba propojit cloud (správce aplikace vyplní adresu a klíč Supabase v kódu).</p>`;
      return;
    }
    if (!cloud.sb) {
      box.innerHTML = `<h2>Účet a tým</h2><p class="muted" style="margin:0">Cloud se nenačetl. Zkontrolujte připojení k internetu a aplikaci otevřete znovu.</p>`;
      return;
    }
    if (cloud.recovery) {
      box.innerHTML = `<h2>Nové heslo</h2>
        <label class="field"><span>Nové heslo (aspoň 6 znaků)</span><input id="accNewPass" type="password" autocomplete="new-password"></label>
        <div class="stack"><button class="btn primary" data-act="authNewPass">Uložit heslo</button></div>${note}`;
      return;
    }
    if (!cloud.user) {
      box.innerHTML = `<h2>Účet a tým</h2>
        <p class="muted" style="margin-top:0">Přihlaste se a vaše služby se uloží do cloudu. Uvidí je i staniční sestra a nepřijdete o ně při výměně telefonu.</p>
        <label class="field"><span>E-mail</span><input id="accEmail" type="email" autocomplete="email" inputmode="email"></label>
        <label class="field"><span>Heslo</span><input id="accPass" type="password" autocomplete="current-password"></label>
        <label class="field" id="accNameWrap" hidden><span>Jméno a příjmení</span><input id="accName" autocomplete="name" maxlength="60"></label>
        <div class="btn-row">
          <button class="btn primary" data-act="authLogin">Přihlásit</button>
          <button class="btn" data-act="authSignup">Registrovat</button>
        </div>
        ${GOOGLE_LOGIN ? `<div class="stack"><button class="btn" data-act="authGoogle">Pokračovat přes Google</button></div>` : ""}
        <div class="stack"><button class="btn link" data-act="authReset">Zapomenuté heslo</button></div>${note}`;
      return;
    }
    const p = cloud.profile || {};
    const who = `<div class="acc-who"><b>${esc(p.full_name || cloud.user.email)}</b><span>${esc(cloud.user.email || "")}</span></div>`;
    if (!cloud.team) {
      box.innerHTML = `<h2>Účet a tým</h2>${who}
        <p class="muted">Ještě nejste v žádném týmu. Staniční sestra tým založí, ostatní se připojí kódem, který jim pošle.</p>
        <label class="field"><span>Kód týmu od staniční</span><input id="accCode" maxlength="8" autocapitalize="characters" placeholder="např. 7F3A9C2B"></label>
        <div class="stack"><button class="btn primary" data-act="teamJoin">Připojit se k týmu</button></div>
        <label class="field" style="margin-top:14px"><span>Nebo založte tým (jste-li staniční)</span><input id="accTeam" maxlength="80" placeholder="např. Interna 3"></label>
        <div class="stack"><button class="btn" data-act="teamCreate">Založit tým</button></div>
        <div class="stack"><button class="btn link" data-act="authLogout">Odhlásit</button></div>${note}`;
      return;
    }
    const admin = isAdmin();
    const members = cloud.members.map(m => `
      <div class="member">
        <span><b>${esc(m.full_name || "Bez jména")}</b>${m.role === "admin" ? ' <i class="badge">admin</i>' : ""}${m.id === me() ? ' <i class="badge me">vy</i>' : ""}</span>
        ${admin && m.id !== me() ? `<span class="member-act">
          <button class="btn small" data-act="memberRole" data-id="${m.id}" data-role="${m.role === "admin" ? "user" : "admin"}">${m.role === "admin" ? "Odebrat admina" : "Udělat adminem"}</button>
          <button class="btn small danger" data-act="memberRemove" data-id="${m.id}">Odebrat</button></span>` : ""}
      </div>`).join("");
    box.innerHTML = `<h2>Účet a tým</h2>${who}
      <div class="row"><span>Tým</span><b>${esc(cloud.team.name)}</b></div>
      <div class="row"><span>Vaše role</span><b>${admin ? "Admin / staniční sestra" : "Běžný uživatel"}</b></div>
      ${admin ? `<div class="row"><span>Kód pro pozvání</span><b class="code-big">${esc(cloud.team.invite_code)}</b></div>
        <div class="stack"><button class="btn" data-act="copyInvite">Kopírovat pozvánku</button></div>` : ""}
      <h2 style="margin-top:16px">Členové (${cloud.members.length})</h2>
      <div class="members">${members}</div>
      <label class="field" style="margin-top:12px"><span>Vaše jméno</span><input id="accRename" maxlength="60" value="${esc(p.full_name || "")}"></label>
      <div class="btn-row">
        <button class="btn" data-act="authLogout">Odhlásit</button>
        <button class="btn danger" data-act="teamLeave">Opustit tým</button>
      </div>${note}`;
  }

  async function accountAction(act, btn) {
    const sb = cloud.sb;
    if (!sb) return;
    const val = id => ($("#" + id) ? $("#" + id).value.trim() : "");
    const done = m => { cloud.msg = m || ""; renderAccount(); };
    try {
      switch (act) {
        case "authLogin": {
          const { error } = await sb.auth.signInWithPassword({ email: val("accEmail"), password: $("#accPass").value });
          if (error) return done(czErr(error));
          return done("");
        }
        case "authSignup": {
          if ($("#accNameWrap").hidden) { $("#accNameWrap").hidden = false; $("#accName").focus(); cloud.msg = ""; return; }
          const name = val("accName");
          if (name.length < 2) return done("Vyplňte jméno a příjmení.");
          const { data: r, error } = await sb.auth.signUp({ email: val("accEmail"), password: $("#accPass").value,
            options: { data: { full_name: name }, emailRedirectTo: location.origin + location.pathname } });
          if (error) return done(czErr(error));
          return done(r.session ? "" : "Hotovo. Potvrďte registraci odkazem v e-mailu a pak se přihlaste.");
        }
        case "authReset": {
          const email = val("accEmail");
          if (!email) return done("Nejdřív napište svůj e-mail.");
          const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
          return done(error ? czErr(error) : "Poslali jsme vám e-mail s odkazem na nové heslo.");
        }
        case "authNewPass": {
          const { error } = await sb.auth.updateUser({ password: $("#accNewPass").value });
          if (error) return done(czErr(error));
          cloud.recovery = false;
          return done("Heslo je změněné.");
        }
        case "authGoogle": {
          if (inWebView()) return done("V této verzi aplikace Google přihlášení blokuje. Přihlaste se e-mailem a heslem, nebo použijte aplikaci nainstalovanou z Chromu.");
          const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
          if (error) return done(czErr(error));
          return;
        }
        case "authLogout":
          await sb.auth.signOut();
          return done("");
        case "teamJoin": {
          const { error } = await sb.rpc("join_team", { p_code: val("accCode") });
          if (error) return done(czErr(error));
          cloud.msg = "Jste v týmu."; return loadCloud();
        }
        case "teamCreate": {
          const { error } = await sb.rpc("create_team", { p_name: val("accTeam") });
          if (error) return done(czErr(error));
          cloud.msg = "Tým je založený. Pošlete kolegům kód pro pozvání."; return loadCloud();
        }
        case "teamLeave":
          return armButton(btn, "Klepněte znovu pro odchod", async () => {
            const { error } = await sb.rpc("leave_team");
            if (error) return done(czErr(error));
            cloud.msg = "Opustili jste tým."; loadCloud();
          });
        case "copyInvite":
          return copyText(`Připoj se k našemu týmu v aplikaci Tvoje šichta: https://marasafi2504-lang.github.io/tvoje-sichta/ → Nastavení → Účet a tým → kód ${cloud.team.invite_code}`, "Pozvánka zkopírována.", null);
        case "memberRole": {
          const { error } = await sb.from("profiles").update({ role: btn.dataset.role }).eq("id", btn.dataset.id);
          if (error) return done(czErr(error));
          return loadCloud();
        }
        case "memberRemove":
          return armButton(btn, "Opravdu?", async () => {
            const { error } = await sb.from("profiles").update({ team_id: null, role: "user" }).eq("id", btn.dataset.id);
            if (error) return done(czErr(error));
            await sb.from("shifts").delete().eq("user_id", btn.dataset.id);
            loadCloud();
          });
      }
    } catch (e) { done(czErr(e)); }
  }

  // ---------- Admin: výběr člověka, hromadné přiřazení, žádosti ----------
  function renderAdmin() {
    const bar = $("#adminBar");
    if (!bar) return;
    const show = isAdmin() && (currentTab === "cal" || currentTab === "sum");
    bar.hidden = !show;
    $("#bulkCard").hidden = !(isAdmin() && currentTab === "cal" && bulkOpen);
    $("#cloudHint").hidden = !(isCloud() && !isAdmin());
    if (!isAdmin()) { $("#pendingCard").hidden = true; return; }
    const sel = $("#viewUserSel");
    sel.innerHTML = cloud.members.map(m => `<option value="${m.id}"${m.id === cloud.viewUser ? " selected" : ""}>${esc(m.full_name || "Bez jména")}${m.id === me() ? " (vy)" : ""}</option>`).join("");
    $("#pendingBtn").textContent = cloud.pending.length ? `Žádosti: ${cloud.pending.length}` : "Žádné žádosti";
    $("#pendingBtn").classList.toggle("primary", !!cloud.pending.length);
    renderPending();
    if (!$("#bulkMembers").dataset.ready || $("#bulkMembers").dataset.team !== cloud.team.id + cloud.members.length) {
      $("#bulkMembers").innerHTML = cloud.members.map(m => `<label class="chk pillchk"><input type="checkbox" value="${m.id}"> ${esc(m.full_name || "Bez jména")}</label>`).join("");
      $("#bulkMembers").dataset.ready = "1";
      $("#bulkMembers").dataset.team = cloud.team.id + cloud.members.length;
    }
    const bt = $("#bulkType");
    const cur = bt.value;
    bt.innerHTML = data.types.map(t => `<option value="${t.id}">${esc(t.name)}${t.off ? "" : " (" + esc(rangeLabel(t)) + ")"}</option>`).join("") +
      `<option value="__del">— smazat služby v rozsahu —</option>`;
    if (cur) bt.value = cur;
    if (!$("#bulkFrom").value) {
      $("#bulkFrom").value = keyOf(view.y, view.m, 1);
      $("#bulkTo").value = keyOf(view.y, view.m, daysIn(view.y, view.m));
    }
  }

  function renderPending() {
    const card = $("#pendingCard");
    if (!card) return;
    if (!isAdmin() || !pendingOpen || !cloud.pending.length) { card.hidden = true; return; }
    card.hidden = false;
    const rows = cloud.pending.map(r => {
      const t = typeById(r.type_id);
      const [y, m, d] = r.day.split("-").map(Number);
      return `<div class="req"><div><b>${esc(memberName(r.user_id))}</b><span>${fullDate(new Date(y, m - 1, d))} · ${esc(t ? t.name : "?")}</span></div>
        <div class="req-act"><button class="btn small primary" data-act="reqApprove" data-id="${r.id}">Schválit</button>
        <button class="btn small danger" data-act="reqReject" data-id="${r.id}">Zamítnout</button></div></div>`;
    }).join("");
    $("#pendingList").innerHTML = rows;
  }

  let bulkOpen = false, pendingOpen = false, currentTab = "cal";

  async function bulkRun(btn) {
    const users = $$("#bulkMembers input:checked").map(i => i.value);
    const from = $("#bulkFrom").value, to = $("#bulkTo").value;
    const days = $$("#bulkDays input:checked").map(i => Number(i.value));
    const typeId = $("#bulkType").value;
    const overwrite = $("#bulkOverwrite").checked;
    const info = m => { $("#bulkInfo").textContent = m; };
    if (!users.length) return info("Vyberte aspoň jednoho člověka.");
    if (!from || !to || from > to) return info("Zkontrolujte rozsah dat.");
    const dates = [];
    const [fy, fm, fd] = from.split("-").map(Number), [ty, tm, td] = to.split("-").map(Number);
    for (let dt = new Date(fy, fm - 1, fd); dt <= new Date(ty, tm - 1, td); dt.setDate(dt.getDate() + 1)) {
      if (days.includes(dt.getDay())) dates.push(keyOf(dt.getFullYear(), dt.getMonth(), dt.getDate()));
    }
    if (!dates.length) return info("V rozsahu nejsou žádné vybrané dny v týdnu.");
    if (users.length * dates.length > 3000) return info("Najednou jde přiřadit nejvýš 3000 služeb. Zmenšete rozsah.");
    btn.disabled = true; info("Ukládám…");
    let count = 0, err = null;
    try {
      if (typeId === "__del") {
        for (let i = 0; i < dates.length && !err; i += 300) {
          const r = await cloud.sb.from("shifts").delete({ count: "exact" }).in("user_id", users).in("day", dates.slice(i, i + 300));
          err = r.error; count += r.count || 0;
        }
      } else {
        const rows = [];
        for (const u of users) for (const d of dates) rows.push({ team_id: cloud.team.id, user_id: u, day: d, type_id: typeId, status: "approved", created_by: me() });
        for (let i = 0; i < rows.length && !err; i += 500) {
          const r = await cloud.sb.from("shifts").upsert(rows.slice(i, i + 500), { onConflict: "user_id,day", ignoreDuplicates: !overwrite });
          err = r.error; count += Math.min(500, rows.length - i);
        }
      }
    } catch (e) { err = e; }
    btn.disabled = false;
    if (err) return info("Chyba: " + czErr(err));
    info(typeId === "__del" ? `Smazáno služeb: ${count}.` : `Hotovo. Zpracováno ${count} služeb${overwrite ? "" : " (existující zůstaly beze změny)"}.`);
    await loadShifts(); await loadPending(); updateLive(); renderAdmin();
  }

  async function reviewRequest(id, status) {
    const { error } = await cloud.sb.from("shifts").update({ status }).eq("id", id);
    if (error) return toast("Chyba: " + czErr(error));
    cloud.pending = cloud.pending.filter(r => r.id !== id);
    toast(status === "approved" ? "Schváleno." : "Zamítnuto.");
    await loadShifts(); updateLive(); renderAdmin();
  }

  async function cloudInit() {
    renderAccount();
    if (!cloudConfigured()) return;
    try {
      cloud.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    } catch (e) { cloud.sb = null; renderAccount(); return; }
    cloud.sb.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") { cloud.recovery = true; setTimeout(() => showTab("set"), 0); }
      const uid = session && session.user ? session.user.id : null;
      const changed = uid !== (cloud.user ? cloud.user.id : null);
      cloud.user = session ? session.user : null;
      if (changed) setTimeout(loadCloud, 0);
      setTimeout(renderAccount, 0);
    });
    const { data: s } = await cloud.sb.auth.getSession();
    cloud.user = s && s.session ? s.session.user : null;
    await loadCloud();
  }

  async function loadLearned() {
    if (!isCloud()) return;
    const { data: rows } = await cloud.sb.from("ai_feedback").select("corrected").eq("user_id", me())
      .not("corrected", "is", null).order("created_at", { ascending: true }).limit(500);
    const aliases = {};
    for (const r of rows || []) Object.assign(aliases, (r.corrected && r.corrected.aliases) || {});
    data.aiLearn = { aliases, history: [] };
  }

  // =====================================================================
  //  ASISTENT: příkazy („dej mi příští úterý ranní“) a učení z oprav
  // =====================================================================
  const WEEKDAY_RE = [
    [1, /\bpondel[ie]\w*/], [2, /\buter[yk]\w*/], [3, /\bstred[aeu]\w*/], [4, /\bctvrt(ek|ku|kem)\b/],
    [5, /\bpat(ek|ku|kem)\b/], [6, /\bsobot[auye]\w*/], [0, /\bnedel[ie]\w*/]
  ];
  const MONTH_LOC = ["lednu","unoru","breznu","dubnu","kvetnu","cervnu","cervenci","srpnu","zari","rijnu","listopadu","prosinci"];
  const TYPE_SYNONYMS = {
    R: ["ranni","rannu","ranku","ranky","ranka","ranko","rano"],
    O: ["odpoledni","odpoledne","odpoledku","odpolednu","odpo"],
    N: ["nocni","nocnu","nocku","nocka","noc"],
    D: ["denni","dennu","denku","denni sluzba","denni sluzbu","denni smenu","dlouha denni","dlouhou denni"],
    NS: ["nocni sluzba","nocni sluzbu","nocni sluzby"],
    UPS: ["ups","pohotovost","pohotovostni","ustavni pohotovost","ustavni pohotovostni"],
    V: ["volno","volna","dovolena","dovolenou","dovolene"]
  };
  const CMD_VERB = /\b(dej|dejte|dat|zapis|zapiste|zapsat|pridej|pridejte|pridat|naplanuj|naplanujte|nastav|nastavte|zadej|zadejte|vloz|vlozte|chci|chtel|chtela|potrebuju|potrebuji|prirad|priradte|smaz|smazte|zrus|zruste|odstran|vymaz|vymazte|hod|hodte)\b/;
  const CMD_DELETE = /\b(smaz|smazte|zrus|zruste|odstran|vymaz|vymazte)\b/;
  const STOPWORDS = new Set(["dej","dejte","mi","me","mne","prosim","na","v","ve","do","od","a","i","tu","ten","to","tento","toto","tuto","pristi","pristim","sluzbu","sluzba","smenu","smena","chci","bych","jsem","se","si","za","den","dny","dni","tyden","kazde","kazdy","kazdou","zitra","dnes","pozitri","taky","take","ještě","jeste","zapis","pridej","nastav","prosim","budu","mit"]);

  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const mondayOf = d => addDays(d, -((d.getDay() + 6) % 7));
  const wdOffset = wd => (wd + 6) % 7; // pondělí 0 … neděle 6
  const dkey = d => keyOf(d.getFullYear(), d.getMonth(), d.getDate());

  function parseDates(q, base) {
    base = startOfDay(base || new Date());
    const out = new Map();
    const add = d => out.set(dkey(d), d);
    const used = [];
    // rozsah „od 10.11. do 14.11.“
    const rng = q.match(/\bod\s+(\d{1,2})\.\s?(\d{1,2})\.?(?:\s?(\d{4}))?\s*(?:do|-|–)\s*(\d{1,2})\.\s?(\d{1,2})\.?(?:\s?(\d{4}))?/);
    if (rng) {
      const y1 = rng[3] ? +rng[3] : base.getFullYear(), y2 = rng[6] ? +rng[6] : y1;
      let a = new Date(y1, +rng[2] - 1, +rng[1]); const b = new Date(y2, +rng[5] - 1, +rng[4]);
      for (let i = 0; a <= b && i < 62; i++, a = addDays(a, 1)) add(a);
      q = q.replace(rng[0], " ");
      used.push("od", "do");
    }
    if (/\bdnes\b/.test(q)) add(base);
    if (/\bzitra\b/.test(q)) add(addDays(base, 1));
    if (/\bpozitri\b/.test(q)) add(addDays(base, 2));
    const za = q.match(/\bza\s+(\d{1,3})\s+(dni|dny|den)\b/);
    if (za) add(addDays(base, +za[1]));
    if (/\bza\s+tyden\b/.test(q)) add(addDays(base, 7));
    // „15.11.“ nebo „15. 11. 2026“
    for (const m of q.matchAll(/\b(\d{1,2})\.\s?(\d{1,2})\.(?:\s?(\d{4}))?/g)) {
      let y = m[3] ? +m[3] : base.getFullYear();
      let d = new Date(y, +m[2] - 1, +m[1]);
      if (!m[3] && d < base) d = new Date(y + 1, +m[2] - 1, +m[1]);
      add(d);
    }
    // „15. listopadu“
    for (let k = 0; k < 12; k++) {
      const re = new RegExp("\\b(\\d{1,2})\\.?\\s+" + norm(MONTHS_GEN[k]) + "\\b", "g");
      for (const m of q.matchAll(re)) {
        let d = new Date(base.getFullYear(), k, +m[1]);
        if (d < base) d = new Date(base.getFullYear() + 1, k, +m[1]);
        add(d);
      }
    }
    // „každé úterý (v prosinci / tento měsíc / příští měsíc)“
    const every = /\bkazd(e|y|ou|ej)\b/.test(q);
    let monthIdx = null, monthYear = base.getFullYear();
    MONTH_LOC.forEach((w, i) => { if (new RegExp("\\bv\\s+" + w + "\\b").test(q)) monthIdx = i; });
    if (/\bpristi\s+mesic/.test(q)) { monthIdx = (base.getMonth() + 1) % 12; }
    if (/\b(tento|tenhle)\s+mesic/.test(q)) monthIdx = base.getMonth();
    if (monthIdx !== null && monthIdx < base.getMonth()) monthYear++;
    for (const [wd, re] of WEEKDAY_RE) {
      const m = q.match(re);
      if (!m) continue;
      if (every) {
        const mi = monthIdx !== null ? monthIdx : base.getMonth();
        for (let d = 1; d <= daysIn(monthYear, mi); d++) {
          const dt = new Date(monthYear, mi, d);
          if (dt.getDay() === wd && dt >= base) add(dt);
        }
        continue;
      }
      const before = q.slice(0, m.index).trim().split(" ").slice(-2).join(" ");
      if (/\bpristi(m)?$|\bpristi\s+(v|ve)$/.test(before) || /\bpristi\s+tyden\b/.test(q)) add(addDays(mondayOf(base), 7 + wdOffset(wd)));
      else if (/\b(tento|toto|tuto|tenhle|tuhle|tohle)$/.test(before)) add(addDays(mondayOf(base), wdOffset(wd)));
      else for (let i = 1; i <= 7; i++) { const d = addDays(base, i); if (d.getDay() === wd) { add(d); break; } }
    }
    return [...out.values()].sort((a, b) => a - b);
  }

  function parseType(q) {
    const words = q.split(" ");
    const aliases = (data.aiLearn && data.aiLearn.aliases) || {};
    for (const w of words) if (aliases[w] && typeById(aliases[w])) return { type: typeById(aliases[w]), via: "learned", word: w };
    let best = null;
    const consider = (phrase, t) => {
      if (!phrase) return;
      const re = new RegExp("(^|\\s)" + phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\s|$)");
      if (re.test(q) && (!best || phrase.length > best.len)) best = { type: t, len: phrase.length, word: phrase };
    };
    for (const t of data.types) {
      consider(norm(t.name), t);
      if (t.code && t.code.length >= 2) consider(norm(t.code), t);
      (TYPE_SYNONYMS[(t.code || "").toUpperCase()] || []).forEach(s => consider(s, t));
    }
    return best ? { type: best.type, via: "rules", word: best.word } : null;
  }

  function parseTarget(q) {
    if (!isAdmin()) return { id: isCloud() ? me() : null, name: null };
    const words = q.split(" ");
    if (/\b(mi|me|mne|sobe)\b/.test(q)) return { id: me(), name: memberName(me()), word: null };
    let hit = null;
    for (const m of cloud.members) {
      const first = norm((m.full_name || "").split(" ")[0]);
      if (first.length < 3) continue;
      const stem = first.length > 4 ? first.slice(0, first.length - 1) : first;
      const w = words.find(x => x === first || (x.startsWith(stem) && x.length - stem.length <= 3));
      if (w && (!hit || w === first)) hit = { id: m.id, name: m.full_name, word: w };
    }
    return hit || { id: cloud.viewUser, name: memberName(cloud.viewUser), word: null };
  }

  function parseCommand(text) {
    const q = norm(text).replace(/[,!?;]/g, " ").replace(/\s+/g, " ").trim();
    if (/^(kdo|kdy|kolik|jaky|jaka|jake|co|proc|jak)\b/.test(q)) return null;
    const dates = parseDates(q);
    const tp = parseType(q);
    const del = CMD_DELETE.test(q);
    const verb = CMD_VERB.test(q);
    if (!verb && !(dates.length && tp)) return null;
    if (!dates.length && !tp && !del) return null;
    const target = parseTarget(q);
    const known = new Set([...(tp ? tp.word.split(" ") : []), ...(target.word ? [target.word] : [])]);
    const unknown = q.split(" ").filter(w => w.length >= 3 && !STOPWORDS.has(w) && !/\d/.test(w) && !known.has(w) &&
      !WEEKDAY_RE.some(([, re]) => re.test(w)) && !MONTH_LOC.includes(w) && !MONTHS_GEN.map(norm).includes(w) && !CMD_VERB.test(w));
    return {
      input: text, action: del ? "delete" : "set",
      dates: dates.map(dkey), typeId: tp ? tp.type.id : null, via: tp ? tp.via : null,
      target: target.id, targetName: target.name, unknown: unknown.slice(0, 3)
    };
  }

  const cmds = {};
  let cmdSeq = 0;
  const dateLabel = k => { const [y, m, d] = k.split("-").map(Number); return fullDate(new Date(y, m - 1, d)); };

  function renderCommand(id, editing) {
    const c = cmds[id];
    const t = c.final.typeId ? typeById(c.final.typeId) : null;
    const ds = c.final.dates;
    const whenTxt = ds.length ? (ds.length <= 4 ? ds.map(dateLabel).join(", ") : `${ds.length} dní (${dateLabel(ds[0])} – ${dateLabel(ds[ds.length - 1])})`) : "<i>neurčeno</i>";
    const showRange = t && !t.off && !t.name.includes(rangeLabel(t));
    const what = c.final.action === "delete" ? "smazat službu" : (t ? `${esc(t.name)}${showRange ? " (" + esc(rangeLabel(t)) + ")" : ""}` : "<i>neurčeno</i>");
    const who = isAdmin() ? `<li>Komu: <b>${esc(memberName(c.final.target))}</b></li>` : "";
    const ready = ds.length && (c.final.action === "delete" || t);
    let html = `<div class="cmd">Rozumím takto${c.parsed.via === "ai" ? " (AI)" : ""}:<ul>${who}<li>Kdy: <b>${whenTxt}</b></li><li>Co: <b>${what}</b></li></ul>` +
      (c.parsed.note ? `<p class="muted" style="margin:6px 0 0">${esc(c.parsed.note)}</p>` : "");
    if (c.state === "done") {
      html += `<p class="cmd-done">${c.doneMsg}</p></div>`;
    } else if (editing || !ready) {
      const typeOpts = data.types.map(x => `<option value="${x.id}"${x.id === c.final.typeId ? " selected" : ""}>${esc(x.name)}</option>`).join("") +
        `<option value="__del"${c.final.action === "delete" ? " selected" : ""}>— smazat službu —</option>`;
      const whoOpts = isAdmin() ? `<label class="field"><span>Komu</span><select data-fix="target">${cloud.members.map(m => `<option value="${m.id}"${m.id === c.final.target ? " selected" : ""}>${esc(m.full_name)}</option>`).join("")}</select></label>` : "";
      html += `<div class="cmd-fix">${!ready ? "<p>Doplňte prosím, co chybí:</p>" : ""}
        ${whoOpts}
        <label class="field"><span>Den${ds.length > 1 ? " (opraví všechny na jeden den)" : ""}</span><input type="date" data-fix="date" value="${ds[0] || dkey(addDays(new Date(), 1))}"></label>
        <label class="field"><span>Služba</span><select data-fix="type"><option value="">— vyberte —</option>${typeOpts}</select></label>
        <div class="btn-row"><button class="btn primary small" data-cmd="savefix" data-id="${id}">Uložit opravu</button><button class="btn small" data-cmd="cancel" data-id="${id}">Zrušit</button></div></div></div>`;
    } else {
      html += `<div class="btn-row cmd-btns"><button class="btn primary small" data-cmd="save" data-id="${id}">✓ Uložit</button>
        <button class="btn small" data-cmd="edit" data-id="${id}">✎ Opravit</button></div>
        <button class="btn link small" data-cmd="cancel" data-id="${id}">Zrušit</button></div>`;
    }
    c.el.innerHTML = html;
  }

  function showCommand(parsed) {
    const id = "c" + (++cmdSeq);
    const el = document.createElement("div");
    el.className = "msg bot";
    $("#chat").appendChild(el);
    cmds[id] = { el, parsed, final: { action: parsed.action, dates: parsed.dates.slice(), typeId: parsed.typeId, target: parsed.target }, state: "open" };
    renderCommand(id, false);
    requestAnimationFrame(() => window.scrollTo(0, document.body.scrollHeight));
  }

  async function applyCommand(c) {
    const f = c.final;
    const typeId = f.action === "delete" ? null : f.typeId;
    if (!isCloud()) {
      f.dates.forEach(k => { if (typeId) data.shifts[k] = typeId; else delete data.shifts[k]; });
      save(); renderAll();
      return { ok: f.dates.length, msg: typeId ? "Uloženo do kalendáře." : "Smazáno z kalendáře." };
    }
    if (isAdmin() && f.target !== cloud.viewUser) {
      let res;
      if (typeId) res = await cloud.sb.from("shifts").upsert(f.dates.map(d => ({ team_id: cloud.team.id, user_id: f.target, day: d, type_id: typeId, status: "approved", created_by: me() })), { onConflict: "user_id,day" });
      else res = await cloud.sb.from("shifts").delete().eq("user_id", f.target).in("day", f.dates);
      if (res.error) return { ok: 0, msg: "Neuloženo: " + czErr(res.error) };
      return { ok: f.dates.length, msg: `Uloženo pro ${esc(memberName(f.target))}.` };
    }
    let ok = 0;
    for (const d of f.dates) if (await cloudSetDay(d, typeId, f.target)) ok++;
    const skipped = f.dates.length - ok;
    const base = isAdmin() ? "Uloženo." : "Odesláno ke schválení staniční sestře.";
    return { ok, msg: ok ? base + (skipped ? ` ${skipped} dní se nepodařilo (schválené služby mění jen staniční).` : "") : "Nic se neuložilo. Schválené služby může měnit jen staniční sestra." };
  }

  // Zpětná vazba: uloží vstup, výsledek a opravu; z oprav se naučí nová slova pro typy služeb
  async function recordFeedback(c, accepted) {
    const p = c.parsed, f = c.final;
    const learned = {};
    if (accepted && f.action === "set" && f.typeId && f.typeId !== p.typeId) {
      p.unknown.forEach(w => { learned[w] = f.typeId; });
      if (!p.unknown.length && p.via === "learned") { /* oprava naučeného slova */ }
    }
    if (!data.aiLearn) data.aiLearn = { aliases: {}, history: [] };
    Object.assign(data.aiLearn.aliases, learned);
    const changed = JSON.stringify([p.action, p.dates, p.typeId, p.target]) !== JSON.stringify([f.action, f.dates, f.typeId, f.target]);
    const entry = { input_text: p.input.slice(0, 300), parsed: { action: p.action, dates: p.dates, type_id: p.typeId, target: p.target, via: p.via },
      corrected: changed || Object.keys(learned).length ? { action: f.action, dates: f.dates, type_id: f.typeId, target: f.target, aliases: learned } : null,
      accepted };
    if (isCloud()) {
      const { error } = await cloud.sb.from("ai_feedback").insert({ ...entry, team_id: cloud.team.id });
      if (error) console.warn(error);
    } else {
      data.aiLearn.history = [...(data.aiLearn.history || []), { ...entry, at: new Date().toISOString() }].slice(-100);
      save();
    }
    return Object.keys(learned);
  }

  async function onCmdClick(e) {
    const b = e.target.closest("[data-cmd]");
    if (!b) return;
    const c = cmds[b.dataset.id];
    if (!c || c.state !== "open") return;
    const act = b.dataset.cmd;
    if (act === "edit") return renderCommand(b.dataset.id, true);
    if (act === "cancel") {
      c.state = "done"; c.doneMsg = "Zrušeno. Nic jsem neuložil.";
      renderCommand(b.dataset.id); recordFeedback(c, false);
      return;
    }
    if (act === "savefix") {
      const box = c.el;
      const dv = $("[data-fix=date]", box).value, tv = $("[data-fix=type]", box).value;
      const tg = $("[data-fix=target]", box);
      if (!dv || !tv) return toast("Vyberte den i službu.");
      if (!c.final.dates.length || c.final.dates.length === 1 || dv !== c.final.dates[0]) c.final.dates = [dv];
      c.final.action = tv === "__del" ? "delete" : "set";
      c.final.typeId = tv === "__del" ? null : tv;
      if (tg) c.final.target = tg.value;
    }
    b.disabled = true;
    const r = await applyCommand(c);
    const learned = await recordFeedback(c, r.ok > 0);
    c.state = "done";
    const t = typeById(c.final.typeId);
    c.doneMsg = (r.ok ? "✓ " : "⚠️ ") + r.msg + (learned.length && t ? ` Díky za opravu, příště už budu vědět, že „${esc(learned.join("“, „"))}“ znamená ${esc(t.name)}.` : "");
    renderCommand(b.dataset.id);
  }


  // Běží aplikace ve vloženém prohlížeči (WebView, např. APK z WebIntoApp)? Tam Google přihlášení blokuje.
  const inWebView = () => /; wv\)|\bWebView\b/i.test(navigator.userAgent);

  // =====================================================================
  //  AI ASISTENT přes Supabase Edge Function (klíč k AI je jen na serveru)
  // =====================================================================
  const aiReady = () => !!(AI_FUNCTION && isCloud() && navigator.onLine);
  function looksLikeShiftCommand(text, local) {
    const q = norm(text);
    if (/^(kdo|kdy|kolik|jaky|jaka|jake|co|proc|jak)\b/.test(q)) return false;
    return !!local || CMD_VERB.test(q);
  }
  function validateAi(r, text, local) {
    if (!r || !Array.isArray(r.dates)) return null;
    const dates = [...new Set(r.dates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d + "T12:00:00"))))].sort().slice(0, 62);
    const action = r.action === "delete" ? "delete" : "set";
    const typeId = action === "set" && r.type_id && typeById(r.type_id) ? r.type_id : null;
    const target = isAdmin() && cloud.members.some(m => m.id === r.target) ? r.target : (isAdmin() ? cloud.viewUser : me());
    if (!dates.length && !typeId && action === "set") return null;
    return { input: text, action, dates, typeId, via: "ai", target, targetName: memberName(target),
      unknown: local ? local.unknown : [], note: typeof r.note === "string" ? r.note.slice(0, 200) : "" };
  }
  async function aiParse(text, local) {
    const wait = document.createElement("div");
    wait.className = "msg bot"; wait.textContent = "Přemýšlím…";
    $("#chat").appendChild(wait);
    requestAnimationFrame(() => window.scrollTo(0, document.body.scrollHeight));
    try {
      const now = new Date();
      const payload = {
        text, today: dkey(now), weekday: DAYS_FULL[now.getDay()],
        types: data.types.map(t => ({ id: t.id, name: t.name, code: t.code || "", start: t.start, end: t.end, off: !!t.off })),
        members: isAdmin() ? cloud.members.map(m => ({ id: m.id, name: m.full_name || "" })) : []
      };
      const { data: r, error } = await cloud.sb.functions.invoke(AI_FUNCTION, { body: payload });
      if (error) {
        let msg = "";
        try { msg = (await error.context.json()).error || ""; } catch (_) {}
        throw new Error(msg || "AI teď neodpovídá.");
      }
      wait.remove();
      const res = validateAi(r, text, local);
      if (res) return showCommand(res);
      if (local) return showCommand(local);
      addMsg(r && r.note ? esc(r.note) : "Tomu jsem nerozuměl. Zkuste to napsat jinak, třeba „Dej mi ranní 15. 11.“", "bot");
    } catch (e) {
      wait.remove();
      if (local) return showCommand(local);
      addMsg(esc(e && e.message ? e.message : "AI teď neodpovídá.") + " Zkuste to prosím později.", "bot");
    }
  }

  // =====================================================================
  //  ZÁLOHA NA GOOGLE DISK (šifrovaná, ve skryté složce aplikace)
  // =====================================================================
  const DRIVE_FILE = "tvoje-sichta-zaloha.json";
  const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
  const DRIVE_LAST = "tvoje-sichta-drive-last";
  const drive = { token: null, exp: 0, busy: false, msg: "" };
  const getLastBackup = () => { try { return localStorage.getItem(DRIVE_LAST) || ""; } catch (_) { return ""; } };

  function renderDrive() {
    const box = $("#driveCard");
    if (!box) return;
    box.hidden = !GOOGLE_CLIENT_ID;
    if (!GOOGLE_CLIENT_ID) return;
    const last = getLastBackup();
    box.innerHTML = `<h2>Záloha na Google Disk</h2>
      <p class="muted" style="margin-top:0">Zašifrovaná záloha se uloží do skryté složky aplikace na vašem Google Disku. Nikdo jiný ji neuvidí, ani autor aplikace. Bez hesla ji nikdo neotevře, ani vy, proto si heslo dobře zapamatujte.</p>
      ${inWebView() ? `<p class="acc-msg">Tato verze aplikace běží ve vloženém prohlížeči, kde Google přihlášení blokuje. Zálohu udělejte v aplikaci nainstalované z Chromu.</p>` : ""}
      <div class="row"><span>Poslední záloha</span><b>${last ? esc(new Date(last).toLocaleString("cs-CZ")) : "zatím žádná"}</b></div>
      <label class="field"><span>Heslo zálohy (aspoň 8 znaků)</span><input id="drivePass" type="password" autocomplete="new-password"></label>
      <div class="btn-row">
        <button class="btn primary" data-act="driveBackup"${drive.busy ? " disabled" : ""}>Zálohovat</button>
        <button class="btn" data-act="driveRestore"${drive.busy ? " disabled" : ""}>Obnovit</button>
      </div>
      ${drive.msg ? `<p class="acc-msg">${esc(drive.msg)}</p>` : ""}`;
  }

  function loadGis() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    if (loadGis.p) return loadGis.p;
    loadGis.p = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.onload = () => res();
      s.onerror = () => { loadGis.p = null; rej(new Error("Google se nenačetl. Zkontrolujte připojení k internetu.")); };
      document.head.appendChild(s);
    });
    return loadGis.p;
  }

  async function driveToken() {
    if (drive.token && Date.now() < drive.exp - 60000) return drive.token;
    if (inWebView()) throw new Error("V této verzi aplikace Google přihlášení blokuje. Použijte aplikaci nainstalovanou z Chromu.");
    await loadGis();
    return new Promise((res, rej) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: r => {
          if (r.error) return rej(new Error("Google přístup nepovolil (" + r.error + ")."));
          drive.token = r.access_token;
          drive.exp = Date.now() + (Number(r.expires_in) || 3600) * 1000;
          res(drive.token);
        },
        error_callback: e => rej(new Error(e && e.type === "popup_closed" ? "Okno přihlášení ke Googlu bylo zavřeno." : "Přihlášení ke Googlu se nepovedlo. Povolte vyskakovací okna."))
      });
      client.requestAccessToken();
    });
  }

  async function driveFetch(url, opts = {}) {
    const token = await driveToken();
    const r = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: "Bearer " + token } });
    if (r.status === 401) { drive.token = null; throw new Error("Přihlášení ke Googlu vypršelo. Zkuste to znovu."); }
    if (!r.ok) throw new Error("Google Disk odpověděl chybou " + r.status + ".");
    return r;
  }
  async function driveFind() {
    const q = encodeURIComponent(`name='${DRIVE_FILE}'`);
    const r = await driveFetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&orderBy=modifiedTime%20desc`);
    const j = await r.json();
    return (j.files || [])[0] || null;
  }
  async function driveUpload(text) {
    const existing = await driveFind();
    if (existing) {
      await driveFetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existing.id)}?uploadType=media`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: text });
      return;
    }
    const boundary = "ts" + Math.random().toString(36).slice(2);
    const meta = { name: DRIVE_FILE, parents: ["appDataFolder"], mimeType: "application/json" };
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${text}\r\n--${boundary}--`;
    await driveFetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
      { method: "POST", headers: { "Content-Type": "multipart/related; boundary=" + boundary }, body });
  }
  async function driveDownload() {
    const f = await driveFind();
    if (!f) return null;
    const r = await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(f.id)}?alt=media`);
    return await r.text();
  }

  // Šifrování AES-GCM 256, klíč z hesla přes PBKDF2-SHA256
  function toB64(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function fromB64(s) {
    const bin = atob(s), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function deriveKey(pass, salt, iter) {
    const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" }, base,
      { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function encryptBackup(obj, pass) {
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), iter = 310000;
    const key = await deriveKey(pass, salt, iter);
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(obj))));
    return JSON.stringify({ app: "tvoje-sichta", v: 1, kdf: "PBKDF2-SHA256", iter, salt: toB64(salt), iv: toB64(iv), data: toB64(ct), created: new Date().toISOString() });
  }
  async function decryptBackup(text, pass) {
    let env;
    try { env = JSON.parse(text); } catch (_) { throw new Error("Soubor není záloha Tvoje šichta."); }
    if (!env || env.app !== "tvoje-sichta" || !env.data) throw new Error("Soubor není záloha Tvoje šichta.");
    const key = await deriveKey(pass, fromB64(env.salt), Number(env.iter) || 310000);
    let plain;
    try { plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(env.iv) }, key, fromB64(env.data)); }
    catch (_) { throw new Error("Špatné heslo zálohy."); }
    return { obj: JSON.parse(new TextDecoder().decode(plain)), created: env.created };
  }

  async function driveAction(act) {
    if (drive.busy) return;
    const pass = ($("#drivePass") || {}).value || "";
    if (pass.length < 8) { drive.msg = "Zadejte heslo zálohy, aspoň 8 znaků."; return renderDrive(); }
    if (act === "driveRestore" && isCloud()) { drive.msg = "V týmu se služby ukládají na server a obnovovat je nemusíte. Obnovu ze zálohy použijte bez přihlášení k týmu."; return renderDrive(); }
    drive.busy = true;
    drive.msg = act === "driveBackup" ? "Zálohuji…" : "Stahuji zálohu…";
    renderDrive();
    try {
      if (act === "driveBackup") {
        await driveUpload(await encryptBackup(data, pass));
        try { localStorage.setItem(DRIVE_LAST, new Date().toISOString()); } catch (_) {}
        drive.msg = "Hotovo. Záloha je uložená na Google Disku.";
      } else {
        const text = await driveDownload();
        if (!text) drive.msg = "Na Google Disku zatím žádná záloha není.";
        else {
          const { obj, created } = await decryptBackup(text, pass);
          if (!obj || !Array.isArray(obj.types) || !obj.types.length || typeof obj.shifts !== "object") throw new Error("Záloha je poškozená.");
          data = { ...DEFAULT(), ...obj };
          brush = data.types[0] ? data.types[0].id : "C";
          save(); renderAll();
          drive.msg = `Obnoveno ze zálohy z ${new Date(created).toLocaleString("cs-CZ")}.`;
        }
      }
    } catch (e) {
      drive.msg = (e && e.message) || "Něco se nepovedlo. Zkuste to znovu.";
    }
    drive.busy = false;
    renderDrive();
  }
  function driveReminder() {
    if (!GOOGLE_CLIENT_ID || inWebView() || isCloud() || !Object.keys(data.shifts || {}).length) return;
    const last = getLastBackup();
    if (!last || Date.now() - new Date(last).getTime() > 14 * 864e5) setTimeout(() => toast("Tip: zálohujte si služby na Google Disk (Nastavení)."), 4000);
  }

  // Hlasové zadávání (Chrome na Androidu; v některých aplikacích nemusí být k dispozici)
  function initVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btn = $("#micBtn");
    if (!SR || !btn) return;
    btn.hidden = false;
    let rec = null;
    btn.addEventListener("click", () => {
      if (rec) { rec.stop(); return; }
      try {
        rec = new SR();
        rec.lang = "cs-CZ"; rec.interimResults = false; rec.maxAlternatives = 1;
        btn.classList.add("rec");
        rec.onresult = ev => { const t = ev.results[0][0].transcript; ask(t); };
        rec.onerror = ev => { if (ev.error === "not-allowed") toast("Mikrofon není povolený."); };
        rec.onend = () => { btn.classList.remove("rec"); rec = null; };
        rec.start();
      } catch (_) { btn.classList.remove("rec"); rec = null; toast("Hlasové zadávání tady nefunguje."); }
    });
  }

  // ---------- Delegace kliků ----------
  document.addEventListener("click", e => {
    const tab = e.target.closest("nav.tabs [data-tab]");
    if (tab) return showTab(tab.dataset.tab);

    const pill = e.target.closest("#palette .pill");
    if (pill) { brush = pill.dataset.type; return renderPalette(); }

    const dayBtn = e.target.closest(".day[data-day]");
    if (dayBtn) return toggleDay(Number(dayBtn.dataset.day));

    const amt = e.target.closest("#donAmounts .chip");
    if (amt) {
      donAmount = Number(amt.dataset.amt);
      $$("#donAmounts .chip").forEach(c => c.classList.toggle("on", c === amt));
      $("#donCustom").hidden = donAmount !== 0;
      if (donAmount === 0) $("#donCustom").focus();
      makeQr();
      return;
    }

    const th = e.target.closest("#themeChips .chip");
    if (th) { data.theme = th.dataset.theme; save(); return renderAll(); }

    const act = e.target.closest("[data-act]");
    if (!act) return;
    switch (act.dataset.act) {
      case "driveBackup": return driveAction("driveBackup");
      case "driveRestore": return armButton(act, "Klepněte znovu – přepíše data", () => driveAction("driveRestore"));
      case "authLogin": case "authSignup": case "authReset": case "authNewPass": case "authLogout": case "authGoogle":
      case "teamJoin": case "teamCreate": case "teamLeave": case "copyInvite": case "memberRole": case "memberRemove":
        return accountAction(act.dataset.act, act);
      case "bulkToggle": bulkOpen = !bulkOpen; renderAdmin(); if (bulkOpen) $("#bulkCard").scrollIntoView({ behavior: "smooth" }); return;
      case "pendingToggle": pendingOpen = !pendingOpen; renderAdmin(); if (!cloud.pending.length) toast("Žádné žádosti nečekají."); return;
      case "bulkRun": return bulkRun(act);
      case "reqApprove": return reviewRequest(act.dataset.id, "approved");
      case "reqReject": return reviewRequest(act.dataset.id, "rejected");
      case "reqApproveAll":
        return (async () => {
          const ids = cloud.pending.map(r => r.id);
          if (!ids.length) return;
          const { error } = await cloud.sb.from("shifts").update({ status: "approved" }).in("id", ids);
          if (error) return toast("Chyba: " + czErr(error));
          toast(`Schváleno: ${ids.length}.`);
          await loadPending(); await loadShifts(); updateLive(); renderAdmin();
        })();
      case "themeCycle": {
        data.theme = isDark() ? "light" : "dark";
        save(); renderAll();
        return;
      }
      case "prev": return shiftMonth(-1);
      case "next": return shiftMonth(1);

      case "waOpen":
        window.open("https://wa.me/?text=" + encodeURIComponent($("#waText").value), "_blank", "noopener");
        return;
      case "waCopy":
        return copyText($("#waText").value, "Zkopírováno.", $("#waText"));
      case "waShare": {
        const text = $("#waText").value;
        if (navigator.share) navigator.share({ text }).catch(() => {});
        else toast("Sdílení tady není podporováno. Použijte Kopírovat.");
        return;
      }

      case "goDon": hideSheet(); hideDrawer(); return showTab("don");
      case "aboutOpen": showDrawer(); pushUi("drawer"); return;
      case "aboutClose": return closeUi("drawer", hideDrawer);
      case "topic": showSheet(act.dataset.topic); pushUi("sheet"); return;
      case "sheetClose": return closeUi("sheet", hideSheet);

      case "addType": {
        if (isCloud()) {
          if (!isAdmin()) return;
          return (async () => {
            const { data: row, error } = await cloud.sb.from("shift_types").insert({ team_id: cloud.team.id, name: "Nový typ",
              start_time: "08:00", end_time: "16:00", color: COLORS[data.types.length % COLORS.length], sort: data.types.length + 1 }).select().single();
            if (error) return toast("Chyba: " + czErr(error));
            data.types.push(mapType(row)); renderAll(); toast("Přidán nový typ. Upravte ho v seznamu.");
          })();
        }
        const id = "T" + Date.now().toString(36);
        data.types.push({
          id, code: "", name: "Nový typ", start: "08:00", end: "16:00",
          color: COLORS[data.types.length % COLORS.length], night: false, off: false
        });
        save(); renderAll();
        toast("Přidán nový typ. Upravte ho v seznamu.");
        return;
      }
      case "delType": {
        const tid = act.dataset.tid;
        if (data.types.length <= 1) return toast("Musí zůstat aspoň jeden typ.");
        return armButton(act, "Klepněte znovu", async () => {
          if (isCloud()) {
            const { error } = await cloud.sb.from("shift_types").delete().eq("id", tid);
            if (error) return toast("Chyba: " + czErr(error));
          }
          data.types = data.types.filter(t => t.id !== tid);
          for (const k of Object.keys(data.shifts)) if (data.shifts[k] === tid) delete data.shifts[k];
          if (brush === tid) brush = data.types[0].id;
          save(); renderAll();
          toast("Typ smazán.");
        });
      }

      case "clearMonth":
        return armButton(act, "Klepněte znovu pro vymazání", async () => {
          if (isCloud()) {
            const { error } = await cloud.sb.from("shifts").delete().eq("user_id", cloud.viewUser)
              .gte("day", keyOf(view.y, view.m, 1)).lte("day", keyOf(view.y, view.m, daysIn(view.y, view.m)));
            if (error) return toast("Chyba: " + czErr(error));
            await loadShifts(); renderAll();
            return toast(isAdmin() ? "Měsíc vymazán." : "Smazány vaše čekající a zamítnuté žádosti. Schválené služby mění staniční.");
          }
          const prefix = `${view.y}-${pad(view.m + 1)}-`;
          Object.keys(data.shifts).filter(k => k.startsWith(prefix)).forEach(k => delete data.shifts[k]);
          save(); renderAll();
          toast("Měsíc vymazán.");
        });
      case "clearAll":
        return armButton(act, "Klepněte znovu pro smazání vše", () => {
          const types = data.types;
          data = DEFAULT();
          data.types = types.length ? types : data.types;
          data.shifts = {};
          save(); renderAll();
          toast("Všechna data smazána.");
        });

      case "bkShow":
        $("#bkOut").value = JSON.stringify(data);
        return;
      case "bkCopy":
        return copyText($("#bkOut").value, "Záloha zkopírována.", $("#bkOut"));
      case "bkRestore": {
        let obj = null;
        try { obj = JSON.parse($("#bkIn").value); } catch (_) { obj = null; }
        if (!obj || !Array.isArray(obj.types) || !obj.types.length || typeof obj.shifts !== "object") {
          return toast("Záloha není čitelná.");
        }
        data = { ...DEFAULT(), ...obj };
        brush = data.types[0].id;
        save(); renderAll();
        $("#bkIn").value = "";
        toast("Záloha obnovena.");
        return;
      }
    }
  });

  // Úpravy typů (psaní bez překreslení seznamu)
  $("#typeList").addEventListener("input", e => {
    const row = e.target.closest("[data-tid]");
    const f = e.target.dataset.f;
    if (!row || !f) return;
    const t = typeById(row.dataset.tid);
    if (!t) return;
    if (e.target.type === "checkbox") t[f] = e.target.checked;
    else if (f === "code") t.code = e.target.value.trim().slice(0, 4);
    else if (f === "name") t.name = e.target.value.slice(0, 60);
    else if (f === "color") t.color = e.target.value;
    else if (f === "start" || f === "end") { if (!e.target.value) return; t[f] = e.target.value; }
    save();
    const hr = row.querySelector("[data-hours]");
    if (hr) hr.textContent = fmtH(hoursOf(t));
    if (isCloud()) cloudSaveType(t);
    updateLive();
  });
  $("#typeList").addEventListener("change", e => {
    if (e.target.dataset.f === "off") renderTypeList();
  });

  const bindNum = (sel, fn) => $(sel).addEventListener("change", e => {
    fn(Math.max(0, Number(e.target.value) || 0));
    if (isCloud()) cloudSaveProfile({ wage: data.wage, night_pct: data.nightPct, holiday_pct: data.holidayPct, weekend_pct: data.weekendPct });
    save(); renderAll();
  });
  bindNum("#setWage", v => data.wage = v);
  bindNum("#setNight", v => data.nightPct = v);
  bindNum("#setHoliday", v => data.holidayPct = v);
  bindNum("#setWeekend", v => data.weekendPct = v);

  $("#donMsg").addEventListener("input", makeQr);
  $("#donCustom").addEventListener("input", makeQr);
  window.addEventListener("load", makeQr);


  $("#chat").addEventListener("click", onCmdClick);
  $("#viewUserSel").addEventListener("change", async e => {
    cloud.viewUser = e.target.value;
    selDay = 0;
    await loadShifts(); renderAll();
  });
  document.addEventListener("change", e => {
    if (e.target.id === "accRename" && isCloud()) {
      const n = e.target.value.trim();
      if (n.length >= 2) cloudSaveProfile({ full_name: n }).then(loadCloud);
    }
  });

  renderAll();
  initDonate();
  initVoice();
  cloudInit();
  renderDrive();
  driveReminder();

  // Instalace jako aplikace a offline režim (jen na https, např. GitHub Pages)
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
  // Ladicí konzole pro mobil: otevřete adresu s ?debug=1 na konci
  if (/[?&]debug=1/.test(location.search)) {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/eruda@3.0.1/eruda.js";
    s.onload = () => window.eruda && window.eruda.init();
    document.head.appendChild(s);
  }
})();
