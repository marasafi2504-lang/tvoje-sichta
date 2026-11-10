# Tvoje šichta

Plánovač služeb pro zdravotníky a všechny, kdo pracují na směny. Autor: Marek Šafránek.

Aplikace běží na adrese https://marasafi2504-lang.github.io/tvoje-sichta/

## Soubory

| Soubor | K čemu je |
|---|---|
| `index.html` | vzhled aplikace |
| `app.js` | logika aplikace a nastavení (Supabase, Google, AI) |
| `manifest.json`, `sw.js`, `icon-*.png` | instalace jako aplikace a offline režim |
| `supabase/supabase-schema.sql` | databáze pro Supabase (SQL Editor → Run) |
| `supabase/oprava-zabezpeceni.sql` | oprava pro starší databázi |
| `supabase/functions/parse-shifts/index.ts` | AI asistent (Supabase Edge Function) |

Do `app.js` patří jen veřejný „publishable“ klíč Supabase. Tajné klíče (service_role, ANTHROPIC_API_KEY) do repozitáře nikdy nedávejte, patří do Supabase → Edge Functions → Secrets.
