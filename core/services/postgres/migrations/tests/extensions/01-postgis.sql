begin;
do $_$
begin
  if not exists (select 1 from pg_extension where extname = 'orioledb') then
    -- create postgis tiger as supabase_admin
    create extension if not exists postgis_tiger_geocoder cascade;

    -- \ir ansible/files/postgresql_extension_custom_scripts/postgis_tiger_geocoder/after-create.sql
    grant usage on schema tiger, tiger_data to postgres with grant option;
    grant all privileges on all tables in schema tiger, tiger_data to postgres with grant option;
    grant all privileges on all routines in schema tiger, tiger_data to postgres with grant option;
    grant all privileges on all sequences in schema tiger, tiger_data to postgres with grant option;
    alter default privileges in schema tiger, tiger_data grant all on tables to postgres with grant option;
    alter default privileges in schema tiger, tiger_data grant all on routines to postgres with grant option;
    alter default privileges in schema tiger, tiger_data grant all on sequences to postgres with grant option;
    SET search_path TO extensions, public, tiger, tiger_data;
    -- postgres role should have access
    set local role postgres;
    perform tiger.pprint_addy(tiger.pagc_normalize_address('710 E Ben White Blvd, Austin, TX 78704'));

    -- other roles can be granted access
    grant usage on schema tiger, tiger_data to authenticated;
    grant select on all tables in schema tiger, tiger_data to authenticated;
    grant execute on all routines in schema tiger, tiger_data to authenticated;

    -- authenticated role should have access now
    set local role authenticated;
    perform tiger.pprint_addy(tiger.pagc_normalize_address('710 E Ben White Blvd, Austin, TX 78704'));
    reset role;

    -- postgres role should have access to address_standardizer_data_us
    set local role postgres;
    perform 1 from us_lex;
    reset role;
  end if;
end
$_$;
rollback;
