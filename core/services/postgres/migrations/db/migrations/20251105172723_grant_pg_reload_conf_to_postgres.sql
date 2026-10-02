-- migrate:up
grant execute on function pg_catalog.pg_reload_conf() to postgres with grant option;

-- migrate:down

