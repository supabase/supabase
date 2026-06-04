# App rate limits template

Adds application-level quotas for product behavior. This does not replace Supabase Auth, Realtime, or Edge platform limits. Use it for limits like "10 AI generations per user per day", "100 exports per organization per hour", or "3 invite emails per workspace per minute".

## Includes

- Rule table for fixed-window and token-bucket limits
- Counter and bucket state tables
- `public.consume_app_rate_limit(...)` RPC for atomic checks and consumption
- `public.reset_app_rate_limit(...)` RPC for admin resets

## Example

```sql
insert into public.app_rate_limit_rules (
  key,
  algorithm,
  limit_count,
  window_seconds
)
values ('ai.generations.daily', 'fixed_window', 10, 86400);

select *
from public.consume_app_rate_limit('ai.generations.daily', auth.uid()::text);
```
