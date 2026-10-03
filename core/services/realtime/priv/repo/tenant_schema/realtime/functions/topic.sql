create or replace function realtime.topic()
  returns text
  language sql
  stable
  AS $function$
select nullif(current_setting('realtime.topic', true), '')::text;
$function$;

alter function "realtime"."topic"() owner to "supabase_realtime_admin";
