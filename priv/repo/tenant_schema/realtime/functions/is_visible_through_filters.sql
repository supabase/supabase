create or replace function realtime.is_visible_through_filters (
  columns realtime.wal_column[],
  filters realtime.user_defined_filter[]
)
  returns boolean
  language sql
  stable
  AS $function$
    select
        filters is null
        or array_length(filters, 1) is null
        or coalesce(
            count(col.name) = count(1)
            and sum(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(col.type_oid::regtype, col.type_name::regtype),
                    val_1:=col.value #>> '{}',
                    val_2:=f.value,
                    negate:=coalesce(f.negate, false)
                )::int
            ) filter (where col.name is not null) = count(col.name),
            false
        )
    from
        unnest(filters) f
        left join unnest(columns) col
            on f.column_name = col.name;
$function$;

alter function "realtime"."is_visible_through_filters"(realtime.wal_column[], realtime.user_defined_filter[]) owner to "supabase_realtime_admin";

grant execute on function "realtime"."is_visible_through_filters"(realtime.wal_column[], realtime.user_defined_filter[]) to "anon", "authenticated", "service_role";
