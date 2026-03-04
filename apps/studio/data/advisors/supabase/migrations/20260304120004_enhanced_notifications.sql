-- =============================================================================
-- Enhanced Notification Dispatcher
-- Richer payloads for Slack (action buttons, docs link, context block),
-- webhooks (actions array), and email (structured metadata).
-- Replaces the function from 20260304120002.
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
  v_rule record;
  v_docs_url text;
  v_supabase_url text;
  v_issue_path text;
  v_actions jsonb;
begin
  if TG_OP = 'INSERT' or (
    TG_OP = 'UPDATE'
    and OLD.severity != NEW.severity
    and NEW.severity = 'critical'
  ) then

    select exists(select 1 from pg_extension where extname = 'pg_net') into v_has_pg_net;

    -- Look up the originating rule for docs/remediation info
    select r.* into v_rule
    from _supabase_advisors.alerts a
    join _supabase_advisors.rules r on r.id = a.rule_id
    where a.issue_id = NEW.id
    order by a.triggered_at desc
    limit 1;

    v_docs_url := coalesce(v_rule.remediation, null);

    -- Try to get the Supabase URL for building dashboard links
    begin
      select decrypted_secret into v_supabase_url
        from vault.decrypted_secrets where name = 'supabase_url' limit 1;
    exception when others then
      v_supabase_url := null;
    end;

    v_issue_path := '/project/_/advisors/issues/' || NEW.id::text;

    -- Build actions array for structured payloads
    v_actions := jsonb_build_array(
      jsonb_build_object(
        'type', 'status_update',
        'label', 'Acknowledge',
        'target_status', 'acknowledged'
      ),
      jsonb_build_object(
        'type', 'status_update',
        'label', 'Resolve',
        'target_status', 'resolved'
      )
    );

    if v_docs_url is not null then
      v_actions := v_actions || jsonb_build_array(
        jsonb_build_object(
          'type', 'link',
          'label', 'View Documentation',
          'url', v_docs_url
        )
      );
    end if;

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
        'suggested_actions', NEW.suggested_actions,
        'actions', v_actions,
        'docs_url', v_docs_url,
        'issue_path', v_issue_path,
        'rule_name', coalesce(v_rule.name, null),
        'rule_title', coalesce(v_rule.title, null)
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
          v_slack_blocks jsonb;
          v_action_elements jsonb;
          v_context_parts text;
        begin
          if v_channel.type = 'slack' then
            v_url := (v_channel.config->>'webhook_url')::text;
            if v_url is not null then
              -- Build action buttons for Slack
              v_action_elements := jsonb_build_array(
                jsonb_build_object(
                  'type', 'button',
                  'text', jsonb_build_object('type', 'plain_text', 'text', 'View Issue'),
                  'url', v_issue_path
                )
              );

              if v_docs_url is not null then
                v_action_elements := v_action_elements || jsonb_build_array(
                  jsonb_build_object(
                    'type', 'button',
                    'text', jsonb_build_object('type', 'plain_text', 'text', 'View Docs'),
                    'url', v_docs_url
                  )
                );
              end if;

              v_context_parts := format(
                'Actions: Acknowledge · Resolve · Dismiss | %s alert(s) · %s',
                NEW.alert_count,
                NEW.category
              );

              v_slack_blocks := jsonb_build_array(
                jsonb_build_object(
                  'type', 'section',
                  'text', jsonb_build_object(
                    'type', 'mrkdwn',
                    'text', format(
                      '*%s*  `%s`  _%s_\n%s',
                      NEW.title,
                      upper(NEW.severity),
                      NEW.category,
                      coalesce(NEW.description, '')
                    )
                  )
                ),
                jsonb_build_object(
                  'type', 'actions',
                  'elements', v_action_elements
                ),
                jsonb_build_object(
                  'type', 'context',
                  'elements', jsonb_build_array(
                    jsonb_build_object(
                      'type', 'mrkdwn',
                      'text', v_context_parts
                    )
                  )
                )
              );

              perform net.http_post(
                url := v_url,
                headers := '{"Content-Type": "application/json"}'::jsonb,
                body := jsonb_build_object(
                  'text', format('[%s] %s: %s', upper(NEW.severity), NEW.category, NEW.title),
                  'blocks', v_slack_blocks
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
