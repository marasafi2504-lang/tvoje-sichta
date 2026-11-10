-- =====================================================================
--  Tvoje šichta – oprava zabezpečení a příprava na AI (listopad 2026)
--  Spusťte JEDNOU v Supabase → SQL Editor → New query → Run.
--  Nic nemaže, jen opravuje. Lze spustit i opakovaně.
--
--  Co opravuje:
--  1. Mzdy a příplatky už neuvidí kolegové v týmu (jen vy sami).
--  2. Pojistka rolí už nezávisí na přepínači „app.trusted“.
--  3. Delší kódy pozvánek (8 znaků) pro nové týmy.
--  4. Tabulka pro limit dotazů na AI (ochrana před náklady).
-- =====================================================================

-- ---------- 1. Pojistka profilu bez přepínače ----------
-- Funkce běží s právy toho, kdo mění profil. Přímá změna z aplikace má
-- roli "authenticated" a podléhá kontrole. Funkce create_team / join_team /
-- leave_team běží s právy vlastníka databáze, takže kontrolou projdou.
create or replace function public.guard_profile()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if current_user <> 'authenticated' then
    return new; -- SQL editor nebo bezpečné funkce týmu
  end if;
  if new.team_id is distinct from old.team_id then
    if not (public.is_team_admin(old.team_id) and new.team_id is null and new.id <> auth.uid()) then
      raise exception 'Tým lze změnit jen přes pozvánku.';
    end if;
  end if;
  if new.role is distinct from old.role then
    if not public.is_team_admin(old.team_id) or new.id = auth.uid() then
      raise exception 'Roli může změnit jen admin týmu.';
    end if;
  end if;
  if new.id <> auth.uid() and (
       new.full_name   is distinct from old.full_name or
       new.wage        is distinct from old.wage or
       new.night_pct   is distinct from old.night_pct or
       new.holiday_pct is distinct from old.holiday_pct or
       new.weekend_pct is distinct from old.weekend_pct) then
    raise exception 'Jméno a mzdu si každý mění sám.';
  end if;
  return new;
end $$;

-- Funkce týmu bez přepínače app.trusted
create or replace function public.create_team(p_name text)
returns public.teams language plpgsql security definer set search_path = public as $$
declare t public.teams;
begin
  if auth.uid() is null then raise exception 'Nejste přihlášeni.'; end if;
  if (select team_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'Už jste členem týmu.';
  end if;
  insert into public.teams (name, created_by) values (trim(p_name), auth.uid()) returning * into t;
  update public.profiles set team_id = t.id, role = 'admin' where id = auth.uid();
  return t;
end $$;

create or replace function public.join_team(p_code text)
returns public.teams language plpgsql security definer set search_path = public as $$
declare t public.teams;
begin
  if auth.uid() is null then raise exception 'Nejste přihlášeni.'; end if;
  select * into t from public.teams where invite_code = upper(trim(p_code));
  if t.id is null then raise exception 'Kód týmu neexistuje.'; end if;
  update public.profiles set team_id = t.id, role = 'user' where id = auth.uid() and team_id is null;
  if not found then raise exception 'Už jste členem jiného týmu.'; end if;
  return t;
end $$;

create or replace function public.leave_team()
returns void language plpgsql security definer set search_path = public as $$
declare t uuid; admins int;
begin
  select team_id into t from public.profiles where id = auth.uid();
  if t is null then return; end if;
  select count(*) into admins from public.profiles where team_id = t and role = 'admin';
  if admins = 1 and public.is_team_admin(t) and
     (select count(*) from public.profiles where team_id = t) > 1 then
    raise exception 'Nejdřív jmenujte jiného správce.';
  end if;
  delete from public.shifts where user_id = auth.uid();
  update public.profiles set team_id = null, role = 'user' where id = auth.uid();
end $$;

-- ---------- 2. Soukromí mezd ----------
-- Kolegové v týmu vidí jen jméno a roli. Mzdu a příplatky čte jen vlastník
-- přes funkci my_profile().
revoke select, update on public.profiles from anon, authenticated;
grant select (id, full_name, role, team_id, created_at) on public.profiles to authenticated;
grant update (full_name, role, team_id, wage, night_pct, holiday_pct, weekend_pct) on public.profiles to authenticated;

create or replace function public.my_profile()
returns setof public.profiles language sql stable security definer set search_path = public as $$
  select * from public.profiles where id = auth.uid()
$$;
revoke all on function public.my_profile() from public, anon;
grant execute on function public.my_profile() to authenticated;

-- ---------- 3. Delší kód pozvánky pro nové týmy ----------
alter table public.teams alter column invite_code
  set default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

-- ---------- 4. Limit dotazů na AI ----------
create table if not exists public.ai_requests (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists ai_requests_user_idx on public.ai_requests (user_id, created_at desc);
alter table public.ai_requests enable row level security;
drop policy if exists requests_own on public.ai_requests;
create policy requests_own on public.ai_requests for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.ai_requests from anon;
