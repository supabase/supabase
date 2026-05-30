---
id: 'password-verification-hook'
title: 'Password Verification Hook'
---

Your company wishes to increase security beyond the requirements of the default password implementation in order to fulfill security or compliance requirements. You plan to track the status of a password sign-in attempt and take action via an email or a restriction on logins where necessary.

As this hook runs on unauthenticated requests, malicious users can abuse the hook by calling it multiple times. Pay extra care when using the hook as you can unintentionally block legitimate users from accessing your application.

Check if a password is valid prior to taking any additional action to ensure the user is legitimate. Where possible, send an email or notification instead of blocking the user.

**Inputs**

| Field     | Type      | Description                                                                                     |
| --------- | --------- | ----------------------------------------------------------------------------------------------- |
| `user_id` | `string`  | Unique identifier for the user attempting to sign in. Correlate this to the `auth.users` table. |
| `valid`   | `boolean` | Whether the password verification attempt was valid.                                            |

<Tabs
  scrollable
  size="small"
  type="underlined"
>
<TabPanel id="password-verification-attempt-json" label="JSON">

```json
{
  "user_id": "3919cb6e-4215-4478-a960-6d3454326cec",
  "valid": true
}
```

</TabPanel>
<TabPanel id="password-verification-attempt-json-schema" label="JSON Schema">

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

Return these only if your hook processed the input without errors.

| Field                | Type      | Description                                                                                                                                                                                                           |
| -------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `decision`           | `string`  | The decision on whether to allow authentication to move forward. Use `reject` to deny the verification attempt and log the user out of all active sessions. Use `continue` to use the default Supabase Auth behavior. |
| `message`            | `string`  | The message to show the user if the decision was `reject`.                                                                                                                                                            |
| `should_logout_user` | `boolean` | Whether to log out the user if a `reject` decision is issued. Has no effect when a `continue` decision is issued.                                                                                                     |

```json
{
  "decision": "reject",
  "message": "You have exceeded maximum number of password sign-in attempts.",
  "should_logout_user": "false"
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
  defaultActiveId="sql-limit-failed-password-verification-attempts"
>
<TabPanel id="sql-limit-failed-password-verification-attempts" label="Limit failed password verification attempts">

As part of new security measures within the company, users can only input an incorrect password every 10 seconds and not more than that. You want to write a hook to enforce this.

Create a table to record each user's last incorrect password verification attempt.

```sql
create table public.password_failed_verification_attempts (
  user_id uuid not null,
  last_failed_at timestamp not null default now(),
  primary key (user_id)
);
```

Create a hook to read and write information to this table. For example:

```sql
create function public.hook_password_verification_attempt(event jsonb)
returns jsonb
language plpgsql
as $$
  declare
    last_failed_at timestamp;
  begin
    if event->'valid' is true then
      -- password is valid, accept it
      return jsonb_build_object('decision', 'continue');
    end if;

    select last_failed_at into last_failed_at
      from public.password_failed_verification_attempts
      where
        user_id = event->'user_id';

    if last_failed_at is not null and now() - last_failed_at < interval '10 seconds' then
      -- last attempt was done too quickly
      return jsonb_build_object(
        'error', jsonb_build_object(
          'http_code', 429,
          'message',   'Please wait a moment before trying again.'
        )
      );
    end if;

    -- record this failed attempt
    insert into public.password_failed_verification_attempts
      (
        user_id,
        last_failed_at
      )
      values
      (
        event->'user_id',
        now()
      )
      on conflict do update
        set last_failed_at = now();

    -- finally let Supabase Auth do the default behavior for a failed attempt
    return jsonb_build_object('decision', 'continue');
  end;
$$;

-- Assign appropriate permissions
grant all
  on table public.password_failed_verification_attempts
  to supabase_auth_admin;

revoke all
  on table public.password_failed_verification_attempts
  from authenticated, anon, public;
```

</TabPanel>
<TabPanel id="sql-send-email-on-failed-password-attempt" label="Send email notification on failed password attempts">

You can notify a user via email instead of blocking the user. To do so, make use of [Supabase Vault](/docs/guides/database/vault) to store the API Key of our mail provider and use [`pg_net`](/docs/guides/database/extensions/pg_net) to send an HTTP request to our email provider to send the email. Ensure that you have configured a sender signature for the email account which you are sending emails from.

First, create a table to track sign in attempts.

```sql
create table public.password_sign_in_attempts (
  user_id uuid not null,
  attempt_id uuid not null,
  last_attempt_at timestamp not null default now(),
  attempt_successful boolean not null,
  primary key (user_id, attempt_id)
);
```

Next, store the API key of our email API provider:

```sql
select vault.create_secret('my_api_key', 'my_api_key_name', 'description_of_my_api_key');
```

Create the hook:

```sql
create or replace function public.hook_notify_user_on_failed_attempts(event jsonb)
returns jsonb
language plpgsql
as $$
  declare
    user_id uuid;
    server_token text;
    user_email_address text;
    email_body jsonb;
    response_id int; -- Variable to store the response ID
    http_code int;
    error_message jsonb;
    attempt_count int;
    max_attempts int := 5; -- Set the threshold for failed attempts
  begin
    user_id := (event->>'user_id')::uuid;

    -- Record the attempt
    insert into public.password_sign_in_attempts (user_id, attempt_id, last_attempt_at, attempt_successful)
    values (user_id, (event->>'attempt_id')::uuid, now(), (event->>'valid')::boolean)
    on conflict (user_id, attempt_id)
    do update set last_attempt_at = now(), attempt_successful = (event->>'valid')::boolean;

    -- Check failed attempts and fetch user email
    select count(*), u.email into attempt_count, user_email_address
    from public.password_sign_in_attempts a
    join auth.users u on a.user_id = u.id
    where a.user_id = user_id and attempt_successful = false and last_attempt_at > (now() - interval '1 day');

    -- Notify user if the number of failed attempts exceeds the threshold
    if attempt_count >= max_attempts then
      -- Fetch the server token
      select decrypted_secret into server_token from vault.decrypted_secrets where name = 'my_api_key_name';

      -- Prepare the email body
      email_body := format('{
        "from": "yoursenderemail@example.com",
        "to": "%s",
        "subject": "Security Alert: Repeated Login Attempts Detected",
        "textbody": "We have detected repeated login attempts for your account. If this was not you, please secure your account.",
        "htmlbody": "<html><body><strong>Security Alert:</strong> We have detected repeated login attempts for your account. If this was not you, please secure your account.</body></html>",
        "messagestream": "outbound"
      }', user_email_address)::jsonb;

      -- Perform the HTTP POST request using Postmark
      select id into response_id from net.http_post(
        'https://api.youremailprovider.com/email',
        email_body,
        'application/json',
        array['Accept: application/json', 'X-Postmark-Server-Token: ' || server_token]
      );

      -- Fetch the response from net._http_response using the obtained id
      select status_code, content into http_code, error_message from net._http_response where id = response_id;

      -- Handle email sending errors
      if http_code is null or (http_code < 200 or http_code >= 300) then
        return jsonb_build_object(
          'error', jsonb_build_object(
            'http_code', coalesce(http_code, 0),
            'message', coalesce(error_message ->> 'message', 'error sending email')
          )
        );
      end if;
    end if;

    -- Continue with default behavior
    return jsonb_build_object('decision', 'continue');
  end;
$$;

-- Assign appropriate permissions
grant execute
  on function public.hook_notify_user_on_failed_attempts
  to supabase_auth_admin;

revoke execute
  on function public.hook_notify_user_on_failed_attempts
  from authenticated, anon, public;

grant all
  on table public.password_sign_in_attempts
  to supabase_auth_admin;

revoke all
  on table public.password_sign_in_attempts
  from authenticated, anon, public;
```

</TabPanel>
</Tabs>
</TabPanel>
</Tabs>
