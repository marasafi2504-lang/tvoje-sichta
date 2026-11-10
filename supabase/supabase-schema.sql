-- =====================================================================
--  Tvoje šichta – databáze pro Supabase
--  Vložte celý tento skript do Supabase → SQL Editor → New query → Run.
--  Skript lze spustit opakovaně (nic nesmaže, jen doplní chybějící části).
-- =====================================================================

-- ---------- TABULKY ----------

-- Tým = oddělení / stanice. Má kód pro pozvání kolegů.
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 80),
  invite_code text not null unique default upper(substr(md5(random()::text), 1, 6)),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Profil uživatele (vzniká automaticky při registraci).
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null default '',
  role         text not null default 'user' check (role in ('admin', 'user')),
  team_id      uuid references public.teams(id) on delete set null,
  wage         numeric not null default 200 check (wage >= 0),
  night_pct    numeric not null default 0   check (night_pct >= 0),
  holiday_pct  numeric not null default 100 check (holiday_pct >= 0),
  weekend_pct  numeric not null default 0   check (weekend_pct >= 0),
  created_at   timestamptz not null default now()
);

-- Typy služeb – společné pro celý tým, spravuje admin.
create table if not exists public.shift_types (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  code        text not null default '' check (char_length(code) <= 4),
  name        text not null check (char_length(name) between 1 and 60),
  start_time  text not null default '07:00',
  end_time    text not null default '19:00',
  color       text not null default '#34d399',
  night       boolean not null default false,
  off         boolean not null default false,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

-- Směny. Jeden člověk = nejvýš jedna služba za den.
-- status: approved = schváleno, pending = čeká na schválení, rejected = zamítnuto
create table if not exists public.shifts (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  day         date not null,
  type_id     uuid not null references public.shift_types(id) on delete cascade,
  status      text not null default 'approved' check (status in ('approved', 'pending', 'rejected')),
  note        text not null default '' check (char_length(note) <= 200),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, day)
);
create index if not exists shifts_team_day_idx on public.shifts (team_id, day);

-- Historie asistenta: co uživatel napsal, co asistent pochopil a co uživatel opravil.
create table if not exists public.ai_feedback (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  team_id     uuid references public.teams(id) on delete set null,
  input_text  text not null check (char_length(input_text) <= 300),
  parsed      jsonb,
  corrected   jsonb,
  accepted    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists ai_feedback_user_idx on public.ai_feedback (user_id, created_at desc);

-- ---------- POMOCNÉ FUNKCE (bezpečně, bez rekurze v RLS) ----------

create or replace function public.my_team()
returns uuid language sql stable security definer set search_path = public as $$
  select team_id from public.profiles where id = auth.uid()
$$;

create or replace function public.is_team_admin(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and team_id = t
  )
$$;

-- Profil se založí sám po registraci.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Roli a tým si běžný uživatel sám změnit nemůže.
-- Admin může povýšit nebo odebrat člena svého týmu.
create or replace function public.guard_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or current_setting('app.trusted', true) = 'on' then
    return new; -- SQL editor (vlastník projektu) a funkce create_team / join_team / leave_team
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
  return new;
end $$;

drop trigger if exists guard_profile_trg on public.profiles;
create trigger guard_profile_trg
  before update on public.profiles
  for each row execute function public.guard_profile();

-- Založení týmu: zakladatel se stane adminem a tým dostane výchozí typy služeb.
create or replace function public.create_team(p_name text)
returns public.teams language plpgsql security definer set search_path = public as $$
declare t public.teams;
begin
  if auth.uid() is null then raise exception 'Nejste přihlášeni.'; end if;
  if (select team_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'Už jste členem týmu.';
  end if;
  perform set_config('app.trusted', 'on', true);
  insert into public.teams (name, created_by) values (trim(p_name), auth.uid()) returning * into t;
  update public.profiles set team_id = t.id, role = 'admin' where id = auth.uid();
  insert into public.shift_types (team_id, code, name, start_time, end_time, color, night, off, sort) values
    (t.id, 'R',   'Ranní',                              '06:00', '14:00', '#fcd34d', false, false, 1),
    (t.id, 'O',   'Odpolední',                          '14:00', '22:00', '#fdba74', false, false, 2),
    (t.id, 'N',   'Noční',                              '22:00', '06:00', '#818cf8', true,  false, 3),
    (t.id, 'D',   'Denní služba',                       '07:00', '19:00', '#34d399', false, false, 4),
    (t.id, 'NS',  'Noční služba',                       '19:00', '07:00', '#60a5fa', true,  false, 5),
    (t.id, 'UPS', 'Ústavní pohotovostní služba (24 h)', '00:00', '00:00', '#f472b6', false, false, 6),
    (t.id, 'V',   'Volno',                              '00:00', '00:00', '#86efac', false, true,  7);
  return t;
end $$;

-- Připojení k týmu kódem pozvánky (vždy jako běžný uživatel).
create or replace function public.join_team(p_code text)
returns public.teams language plpgsql security definer set search_path = public as $$
declare t public.teams;
begin
  if auth.uid() is null then raise exception 'Nejste přihlášeni.'; end if;
  select * into t from public.teams where invite_code = upper(trim(p_code));
  if t.id is null then raise exception 'Kód týmu neexistuje.'; end if;
  perform set_config('app.trusted', 'on', true);
  update public.profiles set team_id = t.id, role = 'user' where id = auth.uid() and team_id is null;
  if not found then raise exception 'Už jste členem jiného týmu.'; end if;
  return t;
end $$;

-- Opuštění týmu (admin nemůže odejít, pokud je jediný admin).
create or replace function public.leave_team()
returns void language plpgsql security definer set search_path = public as $$
declare t uuid; admins int;
begin
  select team_id into t from public.profiles where id = auth.uid();
  if t is null then return; end if;
  select count(*) into admins from public.profiles where team_id = t and role = 'admin';
  if admins = 1 and public.is_team_admin(t) and
     (select count(*) from public.profiles where team_id = t) > 1 then
    raise exception 'Nejdřív jmenujte jiného admina.';
  end if;
  perform set_config('app.trusted', 'on', true);
  delete from public.shifts where user_id = auth.uid();
  update public.profiles set team_id = null, role = 'user' where id = auth.uid();
end $$;

-- Čas poslední změny směny.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists shifts_touch on public.shifts;
create trigger shifts_touch before update on public.shifts
  for each row execute function public.touch_updated_at();

-- Běžný uživatel smí měnit jen vlastní žádosti a ty zůstávají „čeká na schválení“.
create or replace function public.guard_shift()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_team_admin(new.team_id) then
    return new;
  end if;
  new.user_id := auth.uid();
  new.team_id := public.my_team();
  new.status := 'pending';
  if tg_op = 'INSERT' then new.created_by := auth.uid(); end if;
  return new;
end $$;
drop trigger if exists guard_shift_trg on public.shifts;
create trigger guard_shift_trg before insert or update on public.shifts
  for each row execute function public.guard_shift();

-- ---------- ZABEZPEČENÍ (Row Level Security) ----------

alter table public.teams       enable row level security;
alter table public.profiles    enable row level security;
alter table public.shift_types enable row level security;
alter table public.shifts      enable row level security;
alter table public.ai_feedback enable row level security;

-- teams
drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams for select to authenticated
  using (id = public.my_team());
drop policy if exists teams_update on public.teams;
create policy teams_update on public.teams for update to authenticated
  using (public.is_team_admin(id)) with check (public.is_team_admin(id));

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or (team_id is not null and team_id = public.my_team()));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_team_admin(team_id))
  with check (id = auth.uid() or public.is_team_admin(team_id) or team_id is null);

-- shift_types
drop policy if exists types_select on public.shift_types;
create policy types_select on public.shift_types for select to authenticated
  using (team_id = public.my_team());
drop policy if exists types_write on public.shift_types;
create policy types_write on public.shift_types for all to authenticated
  using (public.is_team_admin(team_id)) with check (public.is_team_admin(team_id));

-- shifts
drop policy if exists shifts_select on public.shifts;
create policy shifts_select on public.shifts for select to authenticated
  using (user_id = auth.uid() or public.is_team_admin(team_id));
drop policy if exists shifts_insert on public.shifts;
create policy shifts_insert on public.shifts for insert to authenticated
  with check (
    public.is_team_admin(team_id)
    or (user_id = auth.uid() and team_id = public.my_team() and status = 'pending')
  );
drop policy if exists shifts_update on public.shifts;
create policy shifts_update on public.shifts for update to authenticated
  using (public.is_team_admin(team_id) or (user_id = auth.uid() and status in ('pending', 'rejected')))
  with check (public.is_team_admin(team_id) or (user_id = auth.uid() and status = 'pending'));
drop policy if exists shifts_delete on public.shifts;
create policy shifts_delete on public.shifts for delete to authenticated
  using (public.is_team_admin(team_id) or (user_id = auth.uid() and status in ('pending', 'rejected')));

-- ai_feedback
drop policy if exists feedback_own on public.ai_feedback;
create policy feedback_own on public.ai_feedback for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Funkce smí volat jen přihlášení uživatelé.
revoke all on function public.create_team(text) from public, anon;
revoke all on function public.join_team(text)   from public, anon;
revoke all on function public.leave_team()      from public, anon;
grant execute on function public.create_team(text) to authenticated;
grant execute on function public.join_team(text)   to authenticated;
grant execute on function public.leave_team()      to authenticated;

-- ---------- REALTIME (změny se ihned ukážou všem) ----------
do $$
begin
  alter publication supabase_realtime add table public.shifts;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.shift_types;
exception when duplicate_object then null;
end $$;

-- =====================================================================
--  ZABEZPEČENÍ A AI (verze listopad 2026) – přepisuje starší části výše
-- =====================================================================

-- ---------- Pojistka profilu bez přepínače ----------
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
  insert into public.shift_types (team_id, code, name, start_time, end_time, color, night, off, sort) values
    (t.id, 'R',   'Ranní',                              '06:00', '14:00', '#fcd34d', false, false, 1),
    (t.id, 'O',   'Odpolední',                          '14:00', '22:00', '#fdba74', false, false, 2),
    (t.id, 'N',   'Noční',                              '22:00', '06:00', '#818cf8', true,  false, 3),
    (t.id, 'D',   'Denní služba',                       '07:00', '19:00', '#34d399', false, false, 4),
    (t.id, 'NS',  'Noční služba',                       '19:00', '07:00', '#60a5fa', true,  false, 5),
    (t.id, 'UPS', 'Ústavní pohotovostní služba (24 h)', '00:00', '00:00', '#f472b6', false, false, 6),
    (t.id, 'V',   'Volno',                              '00:00', '00:00', '#86efac', false, true,  7);
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
    raise exception 'Nejdřív jmenujte jiného admina.';
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
