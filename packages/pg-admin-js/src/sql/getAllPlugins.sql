SELECT 
    e.extname AS "name", 
    e.extversion AS "version", 
    n.nspname AS "schema", 
    c.description AS "description"

FROM 
    pg_catalog.pg_extension e 
    LEFT JOIN  pg_catalog.pg_namespace n ON n.oid = e.extnamespace 
    LEFT JOIN pg_catalog.pg_description c ON c.objoid = e.oid AND c.classoid = 'pg_catalog.pg_extension'::pg_catalog.regclass
ORDER BY 1;