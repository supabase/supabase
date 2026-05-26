# Feature flags template

Adds a Postgres-backed feature flag model with environments, variants, JSONB audience rules, subject overrides, audit events, and an evaluation RPC.

## Includes

- Projects and environments
- Flags with global enablement and rollout percentage
- Optional variants with weights
- Audience rules using JSONB containment against caller attributes
- Per-subject overrides
- `public.evaluate_feature_flag(...)` RPC

## Example

```sql
select *
from public.evaluate_feature_flag(
  project_slug => 'app',
  environment_key => 'production',
  flag_key => 'new_onboarding',
  subject_key => auth.uid()::text,
  attributes => '{"plan": "pro"}'
);
```

Audience rules match when `attributes @> conditions`, so a rule with `{"plan": "pro"}` matches callers whose attributes include that key/value pair.
