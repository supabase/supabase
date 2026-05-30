---
id: 'mfa-verification-hook'
title: 'MFA Verification Hook'
---

You can add additional checks to the [Supabase MFA implementation](/docs/guides/auth/auth-mfa) with hooks. For example, you can:

- Limit the number of verification attempts performed over a period of time.
- Sign out users who have too many invalid verification attempts.
- Count, rate limit, or ban sign-ins.

**Inputs**

Supabase Auth will send a payload containing these fields to your hook:

| Field         | Type      | Description                                                                                                                       |
| ------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `factor_id`   | `string`  | Unique identifier for the MFA factor being verified                                                                               |
| `factor_type` | `string`  | `totp` or `phone`                                                                                                                 |
| `user_id`     | `string`  | Unique identifier for the user                                                                                                    |
| `valid`       | `boolean` | Whether the verification attempt was valid. For TOTP, this means that the six digit code was correct (true) or incorrect (false). |

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="mfa-verification-attempt-json"
>
<TabPanel id="mfa-verification-attempt-json" label="JSON">

```json
{
  "factor_id": "6eab6a69-7766-48bf-95d8-bd8f606894db",
  "user_id": "3919cb6e-4215-4478-a960-6d3454326cec",
  "valid": true
}
```

</TabPanel>

<TabPanel id="mfa-verification-attempt-json-schema" label="JSON Schema">

```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "x-faker": "random.uuid"
    },
    "valid": {
      "type": "boolean",
      "x-faker": "random.boolean"
    }
  },
  "required": ["user_id", "valid"]
}
```

</TabPanel>
</Tabs>

**Outputs**

Return this if your hook processed the input without errors.

| Field      | Type     | Description                                                                                                                                                                                                           |
| ---------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `decision` | `string` | The decision on whether to allow authentication to move forward. Use `reject` to deny the verification attempt and log the user out of all active sessions. Use `continue` to use the default Supabase Auth behavior. |
| `message`  | `string` | The message to show the user if the decision was `reject`.                                                                                                                                                            |

```json
{
  "decision": "reject",
  "message": "You have exceeded maximum number of MFA attempts."
}
```

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">
<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql-limit-failed-mfa-verification-attempts"
>
<TabPanel id="sql-limit-failed-mfa-verification-attempts" label="Limit failed MFA verification attempts">

Your company requires that a user can input an incorrect MFA Verification code no more than once every 2 seconds.

Create a table to record the last time a user had an incorrect MFA verification attempt for a factor.

```sql
create table public.mfa_failed_verification_attempts (
  user_id uuid not null,
  factor_id uuid not null,
  last_failed_at timestamp not null default now(),
  primary key (user_id, factor_id)
);
```

Create a hook to read and write information to this table. For example:

```sql
create function public.hook_mfa_verification_attempt(event jsonb)
  returns jsonb
  language plpgsql
as $$
  declare
    last_failed_at timestamp;
  begin
    if event->'valid' is true then
      -- code is valid, accept it
      return jsonb_build_object('decision', 'continue');
    end if;

    select last_failed_at into last_failed_at
      from public.mfa_failed_verification_attempts
      where
        user_id = event->'user_id'
          and
        factor_id = event->'factor_id';

    if last_failed_at is not null and now() - last_failed_at < interval '2 seconds' then
      -- last attempt was done too quickly
      return jsonb_build_object(
        'error', jsonb_build_object(
          'http_code', 429,
          'message',   'Please wait a moment before trying again.'
        )
      );
    end if;

    -- record this failed attempt
    insert into public.mfa_failed_verification_attempts
      (
        user_id,
        factor_id,
        last_refreshed_at
      )
      values
      (
        event->'user_id',
        event->'factor_id',
        now()
      )
      on conflict do update
        set last_refreshed_at = now();

    -- finally let Supabase Auth do the default behavior for a failed attempt
    return jsonb_build_object('decision', 'continue');
  end;
$$;

-- Assign appropriate permissions and revoke access
grant all
  on table public.mfa_failed_verification_attempts
  to supabase_auth_admin;

revoke all
  on table public.mfa_failed_verification_attempts
  from authenticated, anon, public;
```

</TabPanel>
</Tabs>
</TabPanel>
</Tabs>
