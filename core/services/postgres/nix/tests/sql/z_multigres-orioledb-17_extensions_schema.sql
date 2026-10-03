-- all default extensions are installed in a schema "extensions"
-- we don't include the version as that will break often, we only care about
-- ensuring these extensions are present
select
    e.extname as extension_name,
    n.nspname as schema_name,
    e.extowner::regrole as extension_owner
from
    pg_extension e
join
    pg_namespace n on e.extnamespace = n.oid
where
    n.nspname = 'extensions' and e.extname != 'pgjwt'
order by
    e.extname;
