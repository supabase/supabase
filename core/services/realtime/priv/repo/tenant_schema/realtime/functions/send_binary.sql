create or replace function realtime.send_binary (
  payload bytea,
  event   text,
  topic   text,
  private boolean default true
)
  returns void
  language plpgsql
  AS $function$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$function$;

alter function "realtime"."send_binary"(bytea, text, text, boolean) owner to "supabase_realtime_admin";
