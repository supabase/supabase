select
  table_schema,
  table_name

from information_schema.tables
where table_schema = ? and table_type = 'BASE TABLE'
order by table_schema, table_name;
