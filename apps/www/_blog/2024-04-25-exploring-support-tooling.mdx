---
title: 'Exploring Support Tooling at Supabase: A Dive into SLA Buddy'
description: 'In this post, we explore the support tooling at Supabase, and how we use SLA Buddy to monitor our SLAs.'
author: rodrigo_mansueli
imgSocial: 2024-04-25-exploring-support-tooling/slabuddy-og.png
imgThumb: 2024-04-25-exploring-support-tooling/slabuddy-og.png
categories:
  - engineering
tags:
  - slack
  - service-level-agreement
  - support
date: '2024-04-25'
toc_depth: 3
---

## Introduction

In database management and support operations, ensuring Service Level Agreement (SLA) compliance is paramount. Supabase, known for its innovative approach to database management and support, introduces SLA Buddy, a robust support tool aimed at efficient SLA enforcement. This blog post delves into the intricacies of SLA Buddy, shedding light on its functions, operations, and interactions within the Supabase ecosystem.

### Introducing SLA Buddy

Supabase's commitment to innovation extends beyond database solutions; it encompasses robust support operations. SLA Buddy stands as a testament to Supabase's dedication to streamlining support processes and ensuring timely resolution of user queries.

## Dogfooding: The Birth of SLA Buddy

Supabase firmly believes in dogfooding a philosophy that entails using one's own products internally. This approach played a pivotal role in the creation of SLA Buddy. Leveraging Supabase's suite of tools, including Edge Functions and Database functionalities, SLA Buddy was meticulously developed to meet the stringent demands of support operations.

## Understanding SLA Buddy's Functions

SLA Buddy's core function revolves around enforcing SLAs effectively. Let's delve into its primary functions:

### SLA Enforcement

SLA Buddy ensures SLA compliance through a series of intricate processes. This includes:

- **Slack Reminders**: Utilizing Slack reminders to prompt support engineers about impending SLA deadlines.
- **Calendar Checks**: Employing calendar integration to determine who's currently available to answer support tickets.

## Let's take a look at SLA Buddy's Operations

To gain a deeper understanding of SLA Buddy's operations, let's take a look on the main diagram of operations:
![SLA Buddy Operations](/images/blog/2024-04-25-exploring-support-tooling/slabuddy_diagram.svg)

### Watching Messages

SLA Buddy actively monitors Slack channels using PostgreSQL functions like **`process_channels`**. This function scans Slack channels, handles new messages, and adds tasks to the queue for each new ticket that comes to the platform. Once the channel is scanned through the scan_channel edge function it adds rows to the `slack_watcher` table. There is a trigger function on that table that creates tasks for each ticket according to the SLA which depends on which channel that the message came from. Tickets have different SLAs, depending on both severity and the subscription level of the user opening the ticket.

```sql
CREATE OR REPLACE FUNCTION "public"."insert_tasks"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
    escalationtimeintervals int[];
    currentinterval int;
    threadts text;

BEGIN
    IF new.channel_id <> '' THEN
        SELECT escalation_time INTO escalationtimeintervals
          FROM priority WHERE channel_id = new.channel_id;
    ELSE
        escalationtimeintervals := array[10, 20, 35, 50]; -- minutes
    END IF;
    -- INSERT tasks for each escalation level
    FOR i IN 1..4
    LOOP
        -- set the current escalation time interval
        currentinterval := escalationtimeintervals[i];
        -- format thread_ts as (epoch time as a big int) + '.' + ts_ms
        thread_timestamp := extract(epoch FROM new.ts)::bigint::text || '.' || new.ts_ms;

        -- check IF ticket_type is not 'feedback'
        IF lower(new.ticket_type) <> 'feedback' THEN
            INSERT INTO checking_tasks_queue (http_verb, payload, due_time, replied)
            values (
                'POST',
                jsonb_build_object(
                    'channel_id', new.channel_id,
                    'thread_ts', thread_timestamp,
                    'escalation_level', i,
                    'ticket_id', new.ticket_number,
                    'ticket_priority', new.ticket_priority,
                    'ticket_type', new.ticket_type
                ),
                new.ts + (currentinterval * interval '1 minute'),
                false
            );
        END IF;
    END LOOP;
    -- return the new slack_msg row
    return new;
END;
$$;
```

### **Verifying Due Tasks**

The core function **`check_due_tasks_and_update()`** plays a pivotal role in task verification and status updating. It ensures that tasks are duly acknowledged, thereby facilitating timely resolution.

```sql
CREATE OR REPLACE FUNCTION "public"."check_due_tasks_and_update"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    _task RECORD;
    _response JSONB;
    _response_row JSONB;
    _ticket_id text;
    _have_replied BOOLEAN;
    _ticket_array text;
    _lock_key CONSTANT int := 42;
    _lock_acquired boolean;
BEGIN
    -- Try to acquire the advisory lock
    _lock_acquired := pg_try_advisory_lock(_lock_key);
    IF NOT _lock_acquired THEN
        RAISE NOTICE 'Could not acquire lock. Another instance is running. Exiting function...';
        RETURN;
    END IF;

    -- Call create_ticket_array()
    RAISE NOTICE 'Calling create_ticket_array()';
    _ticket_array := public.create_ticket_array();

    -- Check IF _ticket_array is '[]'
    IF _ticket_array = '[]' THEN
        RAISE NOTICE 'No tickets to process. Exiting function...';
        -- Release the advisory lock
        PERFORM pg_advisory_unlock(_lock_key);
        RETURN;
    END IF;

    -- Call help_plataform_wrapper() using _ticket_array
    RAISE NOTICE 'Calling help_plataform_wrapper()';
    _response := public.help_plataform_wrapper(_ticket_array);

    -- Check IF _response is NULL
    IF _response IS NULL THEN
        RAISE NOTICE 'Response is NULL. Exiting function...';
        -- Release the advisory lock
        PERFORM pg_advisory_unlock(_lock_key);
        RETURN;
    END IF;

    -- Process the response
    FOR _response_row IN SELECT * FROM jsonb_array_elements(_response)
    LOOP
        _ticket_id := _response_row->>'ticket_id';
        _have_replied := (_response_row->>'have_replied')::BOOLEAN;
        RAISE NOTICE 'Processing response for ticket_id: %, have_replied: %', _ticket_id, _have_replied;
        IF _have_replied THEN
            RAISE NOTICE 'Ticket % has a reply. Updating...', _ticket_id;
            -- Perform actions for replied tickets
            UPDATE public.checking_tasks_queue
            SET replied_at = NOW(), replied = TRUE
            WHERE payload->>'ticket_id' = _ticket_id;
        ELSE
            RAISE NOTICE 'Ticket % has no reply. Taking actions...', _ticket_id;
            -- Perform actions for no reply
            SELECT * INTO _task FROM public.checking_tasks_queue
            WHERE payload->>'ticket_id' = _ticket_id AND status = '' AND due_time <= NOW()
            ORDER BY due_time ASC
            LIMIT 1;

            IF FOUND THEN
                RAISE NOTICE 'Sending Slack notification for ticket %', _ticket_id;
                -- Use EXCEPTION to handle duplicate keys
                BEGIN
                    INSERT INTO post_to_slack_log(payload) VALUES (_task.payload);
                    PERFORM slack_post_wrapper(_task.payload);
                EXCEPTION
                    WHEN unique_violation THEN
                        RAISE NOTICE 'Duplicate entry for ticket %. Skipping...', _ticket_id;
                    WHEN OTHERS THEN
                        RAISE NOTICE 'Error while inserting into post_to_slack_log. Skipping...';
                        RAISE NOTICE '% %', SQLERRM, SQLSTATE;
                END;
                -- Update the status to 'sent' after calling slack_post_wrapper
                UPDATE public.checking_tasks_queue
                SET status = 'sent'
                WHERE id = _task.id;
            ELSE
                RAISE NOTICE 'Task for ticket % not found!', _ticket_id;
            END IF;
        END IF;
    END LOOP;
    -- Release the advisory lock
    PERFORM pg_advisory_unlock(_lock_key);
END;
$$;
```

### Posting SLA Enforcement Messages on Slack

SLA Buddy employs the Edge Function **`post_ticket_escalation`** to post SLA enforcement messages on Slack. This integration with PostgreSQL functions ensures streamlined execution and effective communication with support engineers.

## Interactions with Support Members

SLA Buddy fosters seamless interactions between support engineers and the tool itself. Through Slack threads, support members can postpone the next steps in the escalation process by 30 min by `@mentioning` the bot in the thread. We also pushed a [guide on how to interact with mentions](https://supabase.com/docs/guides/functions/examples/slack-bot-mention) in Slack as part of the bot's development.

The bot won't get disarmed until a response is sent in the ticket because we believe that even if the Support Engineer is unable to help the user, they can at least triage and set expectations for the next steps in the ticket like escalating to a specific team.

## Watching Support Events

Another crucial aspect of SLA Buddy is its ability to monitor support events seamlessly. At Supabase we have the concept of Embedded Support when a member of the support team will work on more advanced tickets related to a specific Supabase product such as Edge Functions, Dashboard, Storage, Auth, Realtime etc.

The shift information about Support Engineers is hosted in a Google Calendar. This information is retrieved using the following function:

```sql
CREATE OR REPLACE FUNCTION "public"."get_embedded_event_names"
	("date_param" timestamp with time zone DEFAULT "now"())
  RETURNS "jsonb"
  LANGUAGE "plpgsql" SECURITY DEFINER
  SET "search_path" TO ''
  AS $$
DECLARE
  target_date timestamp with time zone := COALESCE(date_param, now());
  start_date timestamp with time zone := target_date + INTERVAL '2 hours';
  end_date timestamp with time zone := start_date + INTERVAL '1 day' - INTERVAL '1 millisecond';
  time_min text := to_char(start_date, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  time_max text := to_char(end_date, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  base_url text;
  api_url text;
  response jsonb;
  events jsonb; -- Change the declaration to jsonb
  embedded_event_names text[];
BEGIN
  SELECT decrypted_secret
  INTO base_url
  FROM vault.decrypted_secrets
  WHERE name = 'calendar_base_url';

  api_url := base_url || '&timeMin=' || time_min || '&timeMax=' || time_max;

  select "content"::jsonb into response from extensions.http_get(api_url);
  events := response->'items'; -- Remove the typecast to ::jsonb

  SELECT ARRAY_AGG(event->>'summary')
  INTO embedded_event_names
  FROM jsonb_array_elements(events) AS event -- Use jsonb_array_elements function
  WHERE (event->>'summary') ILIKE '%embedded%';
  RETURN COALESCE(to_jsonb(embedded_event_names)::text,'[]');
END;
$$;
```

**Escalation Logic**

SLA Buddy's escalation logic is defined in 4 steps of escalation going from a more narrow set of Support Engineers to the Head of Success. Here's the progression:

| Target     | Level | Action               | Timeline |
| ---------- | ----- | -------------------- | -------- |
| Enterprise | 1     | Non-embedded support | 10 min   |
|            | 2     | On-shift support     | 20 min   |
|            | 3     | @group-support       | 35 min   |
|            | 4     | @head of success     | 50 min   |
| Team       | 1     | Non-embedded support | 1 hour   |
|            | 2     | On-shift support     | 3 hours  |
|            | 3     | @group-support       | 6 hours  |
|            | 4     | @head of success     | 12 hours |

## Conclusion

SLA Buddy is a core operational component for Supabase support operations, keeping the whole team informed and engaged, and assisting with prioritizing tickets by their SLA restrictions.

We are firm believers in letting technology streamline operational work and allowing humans to focus on solving real problems, and SLA Buddy is a great example of that.

## Final Thoughts

SLA Buddy started a passion project, born from a need to ensure that we're providing top-quality support to Supabase's users. We're big fans of personal exploration and kaizen incremental change.

And we're not done with SLA Buddy. It'll grow and evolve as Supabase grows, and our needs and the needs of our users change. Because it's built on Supabase features, it'll be easy to update and maintain, and it'll provide more and more value to our internal operations, we hope it might provide some value to you, too. We're also big believers in the Open Source community, and welcome any feedback or ideas you might have to make SLA Buddy even better for everyone.

## More Resources About Slack and Edge Functions

- [GitHub Repo: SLA Buddy](https://github.com/mansueli/slabuddy)
- [Docs Edge Functions: slack mention reply](https://supabase.com/docs/guides/functions/examples/slack-bot-mention)
- [Docs Edge Functions: geting started](https://supabase.com/docs/guides/functions/getting-started)
- [Docs Edge Functions: debugging](https://supabase.com/docs/guides/functions/debugging)
- [Slack Consolidate: a slackbot build with Python & Supabase](https://supabase.com/blog/slack-consolidate-slackbot-to-consolidate-messages)
