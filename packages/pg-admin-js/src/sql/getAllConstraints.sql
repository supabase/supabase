select
  coalesce(table_schema, referenced_schema) as table_schema,
  coalesce(table_name, referenced_table) as table_name,
  coalesce(column_name, referenced_column) as column_name,
  constraint_schema,
  constraint_name,
  constraint_type,
  check_clause,
  referenced_schema,
  referenced_table,
  referenced_column
  
from information_schema.table_constraints
natural full join information_schema.key_column_usage
natural full join information_schema.check_constraints
inner join (
  select
    table_schema as referenced_schema,
    table_name as referenced_table,
    column_name as referenced_column,
    constraint_name
  from information_schema.constraint_column_usage
) as referenced_columns using (constraint_name)

where constraint_schema = ?
order by table_schema, table_name, ordinal_position
