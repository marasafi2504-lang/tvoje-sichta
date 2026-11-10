// =====================================================================
//  Tvoje šichta – Supabase Edge Function „parse-shifts“
//  Převede větu („dej Báře v pátek noční“) na strukturovaný návrh služby.
//  Učí se z oprav uživatele: posledních 8 oprav z tabulky ai_feedback
//  dostane AI jako příklady (few-shot).
//
//  Tajný klíč ANTHROPIC_API_KEY je uložený jen v Supabase
//  (Edge Functions → Secrets), nikdy ne v aplikaci.
// =====================================================================
import { createClient } from "npm:@supabase/supabase-js@2.97.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const MODEL = Deno.env.get("AI_MODEL") ?? "claude-haiku-5-5";
const LIMIT_PER_HOUR = Number(Deno.env.get("AI_LIMIT_PER_HOUR") ?? "40");

type Member = { id: string; name: string };
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const TOOL = {
  name: "navrh_sluzeb",
  description: "Strukturovaný návrh jedné změny služeb v kalendáři.",
  input_schema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["set", "delete"], description: "set = přidělit službu, delete = smazat službu" },
      dates: { type: "array", items: { type: "string", description: "Datum ve tvaru YYYY-MM-DD" }, maxItems: 62 },
      from: { type: "string", description: "Začátek služby ve tvaru HH:MM (24 hodin). U delete a u volna vynech." },
      to: { type: "string", description: "Konec služby ve tvaru HH:MM (24 hodin). Stejný čas jako začátek = 24hodinová služba. U delete a u volna vynech." },
      off: { type: "boolean", description: "true = volno, dovolená nebo náhradní volno (bez času). Jinak vynech." },
      target: { type: "string", description: "Přesné id člena týmu, kterému služba patří. Když jde o uživatele samotného nebo seznam členů chybí, vynech." },
      note: { type: "string", description: "Krátká česká poznámka, když něco chybí nebo je nejasné." },
    },
    required: ["action", "dates"],
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Použijte POST." }, 405);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ error: "AI není nastavená (chybí tajný klíč ANTHROPIC_API_KEY)." }, 500);

  // Přihlášený uživatel – vše dál běží s jeho právy (RLS)
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
  const sb = createClient(Deno.env.get("SUPABASE_URL") ?? "", supabaseKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    auth: { persistSession: false },
  });
  const { data: auth } = await sb.auth.getUser();
  if (!auth?.user) return json({ error: "Nejste přihlášeni." }, 401);

  // deno-lint-ignore no-explicit-any
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Neplatný požadavek." }, 400); }
  const text = String(body?.text ?? "").slice(0, 300).trim();
  const today = /^\d{4}-\d{2}-\d{2}$/.test(body?.today) ? body.today : new Date().toISOString().slice(0, 10);
  const weekday = String(body?.weekday ?? "").slice(0, 12);
  const members: Member[] = (Array.isArray(body?.members) ? body.members : []).slice(0, 200)
    .map((m: Member) => ({ id: String(m.id).slice(0, 40), name: String(m.name ?? "").slice(0, 80) }));
  if (!text) return json({ error: "Chybí text." }, 400);

  // Limit dotazů za hodinu (ochrana před náklady)
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await sb.from("ai_requests").select("id", { count: "exact", head: true }).gte("created_at", since);
  if ((count ?? 0) >= LIMIT_PER_HOUR) return json({ error: "Dosáhli jste limitu dotazů na AI za hodinu. Zkuste to později." }, 429);
  await sb.from("ai_requests").insert({});

  // Opravy uživatele = příklady, ze kterých se AI učí jeho zvyklosti
  const { data: fb } = await sb.from("ai_feedback")
    .select("input_text, corrected, created_at")
    .not("corrected", "is", null)
    .order("created_at", { ascending: false })
    .limit(8);
  const examples = (fb ?? []).map((r) => {
    const c = r.corrected ?? {};
    const when = String(r.created_at ?? "").slice(0, 10);
    return `Dne ${when} uživatel napsal: "${String(r.input_text).replace(/"/g, "'")}"\nSprávný výsledek: ${JSON.stringify({ action: c.action, dates: c.dates, from: c.from, to: c.to, off: c.off, target: c.target })}`;
  }).join("\n\n");

  const memberLines = members.map((m) => `- id="${m.id}": ${m.name}`).join("\n");

  const system = [
    "Jsi asistent české aplikace na plánování služeb ve zdravotnictví (Tvoje šichta).",
    "Převeď větu uživatele na JEDNU změnu služeb a zavolej nástroj navrh_sluzeb.",
    `Dnes je ${weekday} ${today}, časové pásmo Europe/Prague. Týden začíná pondělím.`,
    "„Příští úterý“ = úterý v příštím týdnu. „Tento pátek“ = pátek v tomto týdnu. Datum bez roku = nejbližší budoucí výskyt.",
    "„Každé úterý v prosinci“ = všechna úterý v prosinci (od dneška dál). Rozsah „od 10. do 14.“ = všechny dny včetně.",
    "Služba je čas od–do. Když uživatel řekne konkrétní čas („od 6 do 14“, „7-19“, „18:30 do 6:30“), použij ho přesně.",
    "Běžná slova: ranní = 06:00–14:00, odpolední = 14:00–22:00, noční = 22:00–06:00, denní = 07:00–19:00, noční služba = 19:00–07:00, 24hodinová služba/pohotovost = 00:00–00:00.",
    "Volno, dovolená a náhradní volno: action set a off true, bez času.",
    "Slova smaž, zruš, odstraň znamenají action delete.",
    members.length
      ? `Členové týmu (do target dej přesně id; „mi“, „mně“, „sobě“ = uživatel sám, pak target vynech):\n${memberLines}`
      : "Uživatel zadává služby sám sobě, pole target vynech.",
    "Nevymýšlej si. Když chybí den nebo čas, nech pole prázdné a do note krátce česky napiš, co doplnit.",
    examples ? `Opravy od tohoto uživatele. Řiď se jimi, ukazují jeho zvyklosti a slova:\n${examples}` : "",
  ].filter(Boolean).join("\n");

  let out;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        system,
        tools: [TOOL],
        tool_choice: { type: "tool", name: TOOL.name },
        messages: [{ role: "user", content: text }],
      }),
    });
    if (!r.ok) {
      console.error("Anthropic API", r.status, await r.text());
      return json({ error: r.status === 401 ? "AI klíč je neplatný." : "AI služba teď neodpovídá." }, 502);
    }
    out = await r.json();
  } catch (e) {
    console.error(e);
    return json({ error: "AI služba teď neodpovídá." }, 502);
  }

  // deno-lint-ignore no-explicit-any
  const use = (out?.content ?? []).find((c: any) => c.type === "tool_use");
  if (!use) return json({ error: "AI nevrátila návrh." }, 502);
  const p = use.input ?? {};

  // Kontrola výstupu: jen platná data, existující typy a členové
  const memberIds = new Set(members.map((m) => m.id));
  const dates = (Array.isArray(p.dates) ? p.dates : [])
    .filter((d: unknown) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d)))
    .slice(0, 62);

  return json({
    action: p.action === "delete" ? "delete" : "set",
    dates,
    from: p.off !== true && typeof p.from === "string" && TIME_RE.test(p.from) ? p.from : null,
    to: p.off !== true && typeof p.to === "string" && TIME_RE.test(p.to) ? p.to : null,
    off: p.action !== "delete" && p.off === true,
    target: typeof p.target === "string" && memberIds.has(p.target) ? p.target : null,
    note: typeof p.note === "string" ? p.note.slice(0, 200) : "",
  });
});
