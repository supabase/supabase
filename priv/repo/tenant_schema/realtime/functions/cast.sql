create or replace function realtime."cast" (
  val   text,
  type_ regtype
)
  returns jsonb
  language plpgsql
  immutable
  AS $function$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$function$;

alter function "realtime"."cast"(text, regtype) owner to "supabase_realtime_admin";

grant execute on function "realtime"."cast"(text, regtype) to "anon", "authenticated", "service_role";
