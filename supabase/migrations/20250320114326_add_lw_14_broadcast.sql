-- Example how to send message from DB to listening users
--
-- select
-- realtime.send(
--   jsonb_build_object('hello', 'world'), -- JSONB Payload
--   'event', -- Event name
--   'topic', -- Topic
--   false -- Public / Private flag
-- );

CREATE OR REPLACE FUNCTION public.send_updated_stats_for_lw14() RETURNS trigger AS $$
BEGIN
-- Based on ticket count send following message
-- {
--   "fuel": number (0.2-1) calculated as a limit function 0.2 + 1 / (1 + all tickets / 10)  
--   "payload_value": each regular ticket gives $1 each platinum one $10
-- }
    PERFORM realtime.send(
      jsonb_build_object('hello', 'world'), -- JSONB Payload
      'gauges-update', -- Event name
      'lw14', -- Topic
      true -- Public / Private flag
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER broadcast_stats_for_lw14_tickets
AFTER INSERT OR UPDATE OR DELETE ON public.tickets
FOR EACH ROW
WHEN (NEW.launch_week = 'lw14')
EXECUTE FUNCTION public.send_updated_stats_for_lw14();
