export const FUNCTIONS_SQL = /* SQL */ `
-- CTE with sane arg_modes, arg_names, and arg_types.
-- All three are always of the same length.
-- All three include all args, including OUT and TABLE args.
with functions as (
  select
    *,
    -- proargmodes is null when all arg modes are IN
    coalesce(
      p.proargmodes,
      array_fill('i'::text, array[cardinality(coalesce(p.proallargtypes, p.proargtypes))])
    ) as arg_modes,
    -- proargnames is null when all args are unnamed
    coalesce(
      p.proargnames,
      array_fill(''::text, array[cardinality(coalesce(p.proallargtypes, p.proargtypes))])
    ) as arg_names,
    -- proallargtypes is null when all arg modes are IN
    coalesce(p.proallargtypes, p.proargtypes) as arg_types,
    array_cat(
      array_fill(false, array[pronargs - pronargdefaults]),
      array_fill(true, array[pronargdefaults])) as arg_has_defaults
  from
    pg_proc as p
  where
    p.prokind = 'f'
)
select
  f.oid as id,
  n.nspname as schema,
  f.proname as name,
  l.lanname as language,
  case
    when l.lanname = 'internal' then ''
    else f.prosrc
  end as definition,
  case
    when l.lanname = 'internal' then f.prosrc
    else pg_get_functiondef(f.oid)
  end as complete_statement,
  coalesce(f_args.args, '[]') as args,
  pg_get_function_arguments(f.oid) as argument_types,
  pg_get_function_identity_arguments(f.oid) as identity_argument_types,
  f.prorettype as return_type_id,
  pg_get_function_result(f.oid) as return_type,
  nullif(rt.typrelid, 0) as return_type_relation_id,
  f.proretset as is_set_returning_function,
  case
    when f.proretset and rt.typrelid != 0 then true
    else false
  end as returns_set_of_table,
  case
    when f.proretset and rt.typrelid != 0 then
      (select relname from pg_class where oid = rt.typrelid)
    else null
  end as return_table_name,
  case
    when f.proretset then
      coalesce(f.prorows, 0) > 1
    else false
  end as returns_multiple_rows,
  case
    when f.provolatile = 'i' then 'IMMUTABLE'
    when f.provolatile = 's' then 'STABLE'
    when f.provolatile = 'v' then 'VOLATILE'
  end as behavior,
  f.prosecdef as security_definer,
  f_config.config_params as config_params
from
  functions f
  left join pg_namespace n on f.pronamespace = n.oid
  left join pg_language l on f.prolang = l.oid
  left join pg_type rt on rt.oid = f.prorettype
  left join (
    select
      oid,
      jsonb_object_agg(param, value) filter (where param is not null) as config_params
    from
      (
        select
          oid,
          (string_to_array(unnest(proconfig), '='))[1] as param,
          (string_to_array(unnest(proconfig), '='))[2] as value
        from
          functions
      ) as t
    group by
      oid
  ) f_config on f_config.oid = f.oid
  left join (
    select
      oid,
      jsonb_agg(jsonb_build_object(
        'mode', mode,
        'name', name,
        'type_id', type_id,
        'has_default', coalesce(has_default, false),
        'table_name', table_name
      )) as args
    from
      (
        select
          t1.oid,
          t2.mode,
          t1.name,
          t1.type_id,
          t1.has_default,
          case 
            when pt.typrelid != 0 then pc.relname 
            else null 
          end as table_name
        from
          (
            select
              oid,
              unnest(arg_modes) as mode,
              unnest(arg_names) as name,
              unnest(arg_types)::int8 as type_id,
              unnest(arg_has_defaults) as has_default
            from
              functions
          ) as t1
          cross join lateral (
            select
              case
                when t1.mode = 'i' then 'in'
                when t1.mode = 'o' then 'out'
                when t1.mode = 'b' then 'inout'
                when t1.mode = 'v' then 'variadic'
                else 'table'
              end as mode
          ) as t2
          left join pg_type pt on pt.oid = t1.type_id
          left join pg_class pc on pc.oid = pt.typrelid
      ) sub
    group by
      oid
  ) f_args on f_args.oid = f.oid
`
