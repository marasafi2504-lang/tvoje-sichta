-- =====================================================================
--  Tvoje šichta – úprava pro obecné použití (čas od–do místo typů služeb)
--  Spusťte JEDNOU v Supabase → SQL Editor → New query → Run.
--  Nic nemaže. Starší služby se převedou na čas od–do. Lze spustit i opakovaně.
--  Pokud jste databázi zakládali až touto verzí souboru supabase-schema.sql,
--  nemusíte tento soubor spouštět, je v ní už zahrnutý.
-- =====================================================================

alter table public.shifts alter column type_id drop not null;
alter table public.shifts add column if not exists start_time text not null default '';
alter table public.shifts add column if not exists end_time   text not null default '';
alter table public.shifts add column if not exists off        boolean not null default false;

-- Převod služeb ze starých typů na čas od–do
update public.shifts s
   set start_time = t.start_time, end_time = t.end_time, off = t.off
  from public.shift_types t
 where s.type_id = t.id and s.start_time = '' and s.off = false;

-- Nová služba musí mít čas od–do, nebo být označená jako volno.
alter table public.shifts drop constraint if exists shifts_time_chk;
alter table public.shifts add constraint shifts_time_chk
  check (off or type_id is not null or (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'))
  not valid;

-- Nový tým už nezakládá žádné předvolené typy služeb.
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
revoke all on function public.create_team(text) from public, anon;
grant execute on function public.create_team(text) to authenticated;
