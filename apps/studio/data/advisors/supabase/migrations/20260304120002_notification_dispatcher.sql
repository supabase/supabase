-- =============================================================================
-- Notification Dispatcher
-- Dispatches notifications to configured channels when issues are created
-- or escalated. Degrades gracefully when pg_net/vault are unavailable.
-- =============================================================================

create or replace function _supabase_advisors.dispatch_notifications()
returns trigger
language plpgsql
security definer
as $$
declare
  v_channel record;
  v_payload jsonb;
  v_has_pg_net boolean;
begin
  if TG_OP = 'INSERT' or (
    TG_OP = 'UPDATE'
    and OLD.severity != NEW.severity
    and NEW.severity = 'critical'
  ) then

    select exists(select 1 from pg_extension where extname = 'pg_net') into v_has_pg_net;

    for v_channel in
      select * from _supabase_advisors.channels
      where is_enabled = true
        and NEW.severity = any(severity_filter)
        and (category_filter is null or NEW.category = any(category_filter))
    loop
      v_payload := jsonb_build_object(
        'issue_id', NEW.id,
        'title', NEW.title,
        'severity', NEW.severity,
        'category', NEW.category,
        'status', NEW.status,
        'alert_count', NEW.alert_count,
        'description', NEW.description,
        'suggested_actions', NEW.suggested_actions
      );

      insert into _supabase_advisors.notifications (
        issue_id, channel_id, channel_type, recipient, payload, status
      ) values (
        NEW.id,
        v_channel.id,
        v_channel.type,
        case v_channel.type
          when 'email' then coalesce((v_channel.config->>'email')::text, 'unknown')
          when 'slack' then coalesce((v_channel.config->>'channel')::text, 'unknown')
          when 'webhook' then coalesce((v_channel.config->>'url')::text, 'unknown')
          else 'unknown'
        end,
        v_payload,
        case when v_has_pg_net then 'pending' else 'failed' end
      );

      if v_has_pg_net and v_channel.type in ('webhook', 'slack') then
        declare
          v_url text;
        begin
          if v_channel.type = 'slack' then
            v_url := (v_channel.config->>'webhook_url')::text;
            if v_url is not null then
              perform net.http_post(
                url := v_url,
                headers := '{"Content-Type": "application/json"}'::jsonb,
                body := jsonb_build_object(
                  'text', format('[%s] %s: %s', upper(NEW.severity), NEW.category, NEW.title),
                  'blocks', jsonb_build_array(
                    jsonb_build_object(
                      'type', 'section',
                      'text', jsonb_build_object(
                        'type', 'mrkdwn',
                        'text', format(
                          '*%s* _%s_\n%s\n%s alert(s) · %s',
                          NEW.title,
                          NEW.severity,
                          coalesce(NEW.description, ''),
                          NEW.alert_count,
                          NEW.category
                        )
                      )
                    )
                  )
                )
              );
            end if;
          elsif v_channel.type = 'webhook' then
            v_url := (v_channel.config->>'url')::text;
            if v_url is not null then
              perform net.http_post(
                url := v_url,
                headers := '{"Content-Type": "application/json"}'::jsonb,
                body := v_payload
              );
            end if;
          end if;

          update _supabase_advisors.notifications
          set status = 'sent', sent_at = now()
          where issue_id = NEW.id
            and channel_id = v_channel.id
            and status = 'pending';
        exception when others then
          update _supabase_advisors.notifications
          set status = 'failed'
          where issue_id = NEW.id
            and channel_id = v_channel.id
            and status = 'pending';
        end;
      end if;
    end loop;
  end if;

  return NEW;
end;
$$;

create trigger dispatch_notifications_trigger
  after insert or update on _supabase_advisors.issues
  for each row execute function _supabase_advisors.dispatch_notifications();
