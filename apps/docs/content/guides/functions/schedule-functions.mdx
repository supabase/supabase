---
id: 'schedule-functions'
title: 'Scheduling Edge Functions'
description: 'Schedule Edge Functions with pg_cron.'
---

<div class="video-container">
  <iframe
    src="https://www.youtube-nocookie.com/embed/-U6DJcjVvGo"
    frameBorder="1"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  ></iframe>
</div>

The hosted Supabase Platform supports the [`pg_cron` extension](/docs/guides/database/extensions/pgcron), a recurring job scheduler in Postgres.

In combination with the [`pg_net` extension](/docs/guides/database/extensions/pgnet), this allows us to invoke Edge Functions periodically on a set schedule.

<Admonition type="caution">

To access the auth token securely for your Edge Function call, we recommend storing them in [Supabase Vault](/docs/guides/database/vault).

</Admonition>

## Examples

### Invoke an Edge Function every minute

Store `project_url` and `anon_key` in Supabase Vault:

```sql
select vault.create_secret('https://project-ref.supabase.co', 'project_url');
select vault.create_secret('YOUR_SUPABASE_PUBLISHABLE_KEY', 'publishable_key');
```

Make a POST request to a Supabase Edge Function every minute:

```sql
select
  cron.schedule(
    'invoke-function-every-minute',
    '* * * * *', -- every minute
    $$
    select
      net.http_post(
          url:= (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/function-name',
          headers:=jsonb_build_object(
            'Content-type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
          ),
          body:=concat('{"time": "', now(), '"}')::jsonb
      ) as request_id;
    $$
  );
```

## Resources

- [`pg_net` extension](/docs/guides/database/extensions/pgnet)
- [`pg_cron` extension](/docs/guides/database/extensions/pgcron)
