---
id: 'auth-hooks'
title: 'Auth Hooks'
subtitle: 'Use HTTP or Postgres Functions to customize your authentication flow'
---

## What is a hook

A hook is an endpoint that allows you to alter the default Supabase Auth flow at specific execution points. Developers can use hooks to add custom behavior that's not supported natively.

Hooks help you:

- Track the origin of user signups by adding metadata
- Improve security by adding additional checks to password and multi-factor authentication
- Support legacy systems by integrating with identity credentials from external authentication systems
- Add additional custom claims to your JWT
- Send authentication emails or SMS messages through a custom provider

The following hooks are available:

| Hook                                                                                     | Available on Plan    |
| ---------------------------------------------------------------------------------------- | -------------------- |
| [Before User Created](/docs/guides/auth/auth-hooks/before-user-created-hook)             | Free, Pro            |
| [Custom Access Token](/docs/guides/auth/auth-hooks/custom-access-token-hook)             | Free, Pro            |
| [Send SMS](/docs/guides/auth/auth-hooks/send-sms-hook)                                   | Free, Pro            |
| [Send Email](/docs/guides/auth/auth-hooks/send-email-hook)                               | Free, Pro            |
| [MFA Verification Attempt](/docs/guides/auth/auth-hooks/mfa-verification-hook)           | Teams and Enterprise |
| [Password Verification Attempt](/docs/guides/auth/auth-hooks/password-verification-hook) | Teams and Enterprise |

Supabase supports 2 ways to [configure a hook](/dashboard/project/_/auth/hooks) in your project:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="postgres-function"
>
<TabPanel id="postgres-function" label="Postgres Function">

A [Postgres function](/docs/guides/database/functions) can be configured as a hook. The function should take in a single argument -- the event of type JSONB -- and return a JSONB object. Since the Postgres function runs on your database, the request does not leave your project's instance.

</TabPanel>
<TabPanel id="http" label="HTTP Endpoint">

An HTTP Hook is an endpoint which takes in a JSON event payload and returns a JSON response. You can use any HTTP endpoint as a Hook, including an endpoint in your application. The easiest way to create an HTTP hook is to create a [Supabase Edge Function](/docs/guides/functions/quickstart).

</TabPanel>
</Tabs>

## Security model

Sign the payload and grant permissions selectively in order to guard the integrity of the payload.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">

When you configure a Postgres function as a hook, Supabase will automatically apply the following grants to the function for these reasons:

- Allow the `supabase_auth_admin` role to execute the function. The `supabase_auth_admin` role is the Postgres role that is used by Supabase Auth to make requests to your database.
- Revoke permissions from other roles (e.g. `anon`, `authenticated`, `public`) to ensure the function is not accessible by Supabase Data APIs.

```sql
-- Grant access to function to supabase_auth_admin
grant execute
  on function public.custom_access_token_hook
  to supabase_auth_admin;

-- Grant access to schema to supabase_auth_admin
grant usage on schema public to supabase_auth_admin;

-- Revoke function permissions from authenticated, anon and public
revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon, public;
```

You will need to alter your row-level security (RLS) policies to allow the `supabase_auth_admin` role to access tables that you have RLS policies on. You can read more about RLS policies [here](/docs/guides/database/postgres/row-level-security).

Alternatively, you can create your Postgres function via the dashboard with the `security definer` tag. The `security definer` tag specifies that the function is to be executed with the privileges of the user that owns it.

Currently, functions created via the dashboard take on the `postgres` role. Read more about the `security definer` tag [in our database guide](/docs/guides/database/functions#security-definer-vs-invoker)

</TabPanel>
<TabPanel id="http" label="HTTP">

HTTP Hooks in Supabase follow the [Standard Webhooks Specification](https://www.standardwebhooks.com/), which is a set of guidelines aligning how hooks are implemented. The specification attaches three security headers to guarantee the integrity of the payload:

- `webhook-id`: the unique webhook identifier described in the preceding sections.
- `webhook-timestamp`: integer UNIX timestamp (seconds since epoch).
- `webhook-signature`: the signatures of this webhook. This is generated from body of the hook.

When the request is made to the HTTP hook, you should use the [Standard Webhooks libraries](https://github.com/standard-webhooks/standard-webhooks/tree/main/libraries) to verify these headers.

When an HTTP hook is created, the secret generated should be of the `v1,whsec_<base64-secret>` format:

- `v1` denotes the version of the hook
- `whsec_` signifies that the secret is symmetric
- `<base64-secret>` implies a Standard Base64 encoded secret which can contain the characters `+`, `/` and `=`

The secret is used to verify the payload received in your hook. Create an entry in your `.env.local` file to store the `<standard-base64-secret>` portion of the secret for each hook that you have. For example:

```ini
SEND_SMS_HOOK_SECRETS=v1,whsec_<base64-secret>
```

There field is expressed in plural rather than singular as there are plans to allow for asymmetric signing and multiple hook secrets for ease of secret rotation. For instance: `<standard-base-64-secret>|<another-standard-base-64-secret>`.

Use the secret in conjunction with the Standard Webhooks package to verify the payload before processing it:

```jsx
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

Deno.serve(async (req) => {
  const payload = await req.text()
  const hookSecret = Deno.env.get('SEND_SMS_HOOK_SECRETS').replace('v1,whsec_', '')
  // Extract headers and security specific fields
  const headers = Object.fromEntries(req.headers)
  const wh = new Webhook(hookSecret)
  const data = wh.verify(payload, headers)

  // Payload data is verified, continue with business logic here
  // ...
})
```

</TabPanel>
</Tabs>

## Using Hooks

### Developing

Let us develop a Hook locally and then deploy it to the cloud. As a recap, here’s a list of available Hooks

| Hook                          | Suggested Function Name         | When it is called                                  | What it Does                                                                                              |
| ----------------------------- | ------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Send SMS                      | `send_sms`                      | Each time an SMS is sent                           | Allows you to customize message content and SMS Provider                                                  |
| Send Email                    | `send_email`                    | Each time an Email is sent                         | Allows you to customize message content and Email Provider                                                |
| Custom Access Token           | `custom_access_token`           | Each time a new JWT is created                     | Returns the claims you wish to be present in the JWT.                                                     |
| MFA Verification Attempt      | `mfa_verification_attempt`      | Each time a user tries to verify an MFA factor.    | Returns a decision on whether to reject the attempt and future ones, or to allow the user to keep trying. |
| Password Verification Attempt | `password_verification_attempt` | Each time a user tries to sign in with a password. | Return a decision whether to allow the user to reject the attempt, or to allow the user to keep trying.   |

Edit `config.toml` to set up the Auth Hook locally.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">
Modify the `auth.hook.<hook_name>` field and set `uri` to a value of `pg-functions://postgres/<schema>/<function_name>`

```
[auth.hook.<hook_name>]
enabled = true
uri = "pg-functions://...."

```

You need to assign additional permissions so that Supabase Auth can access the hook as well as the tables it interacts with.

The `supabase_auth_admin` role does not have permissions to the `public` schema. You need to grant the role permission to execute your hook:

```sql
grant execute
  on function public.custom_access_token_hook
  to supabase_auth_admin;

```

You also need to grant usage to `supabase_auth_admin`:

```sql
grant usage on schema public to supabase_auth_admin;

```

Also revoke permissions from the `authenticated` and `anon` roles to ensure the function is not accessible by Supabase Serverless APIs.

```sql
revoke execute
  on function public.custom_access_token_hook
  from authenticated, anon;

```

For security, we recommend against the use the `security definer` tag. The `security definer` tag specifies that the function is to be executed with the privileges of the user that owns it. When a function is created via the Supabase dashboard with the tag, it will have the extensive permissions of the `postgres` role which make it easier for undesirable actions to occur.

We recommend that you do not use any tag and explicitly grant permissions to `supabase_auth_admin` as described above.

Read more about `security definer` tag [in our database guide](/docs/guides/database/functions#security-definer-vs-invoker).

Once done, save your Auth Hook as a migration in order to version the Auth Hook and share it with other team members. Run [`supabase migration new`](/docs/reference/cli/supabase-migration-new) to create a migration.

<Admonition type="caution">

If you're using the Supabase SQL Editor, there's an issue when using the `?` (_Does the string exist as a top-level key within the JSON value?_) operator. Use a direct connection to the database if you need to use it when defining a function.

</Admonition>

Here is an example hook signature:

```sql
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  -- Insert variables here
begin
  -- Insert logic here
  return event;
end;
$$;

```

You can visit `SQL Editor > Templates` for hook templates.

</TabPanel>
<TabPanel id="http" label="HTTP">
Modify the `auth.hook.<hook_name>` field and set `uri` to a valid HTTP URI. For example, the `send_sms` hook would take the following fields:

```toml
[auth.hook.send_sms]
enabled = true
uri = "http://host.docker.internal:54321/functions/v1/send_sms"
# Comma separated list of secrets
secrets = "env(SEND_SMS_HOOK_SECRETS)"
```

<Admonition type="note">

`host.docker.internal` is a special DNS name used in Docker to allow a container to access the host machine's network. This allows the Auth container to reach your HTTP function, no matter if it's a Supabase Edge Function or a custom endpoint.

</Admonition>

Fill in the Hook Secret in `supabase/functions/.env`

```ini
SEND_SMS_HOOK_SECRETS='v1,whsec_<base64-secret>'
```

Start the function locally:

```bash
supabase functions serve send-sms --no-verify-jwt
```

Disable JWT verification via the `--no-verify-jwt` to accommodate hooks which are run before a JWT is issued. Payload authenticity is instead protected via the appended security headers associated with the Standard Webhooks Standard.

Note that payloads are sent uncompressed in order to accurately track Content Length. In addition, there is a 20KB payload limit to guard against payload stuffing attacks.

</TabPanel>
</Tabs>

### Deploying

In the dashboard, navigate to [`Authentication > Hooks`](/dashboard/project/_/auth/hooks) and select the appropriate function type (SQL or HTTP) from the dropdown menu.

### Error handling

You should return an error when facing a runtime error. Runtime errors are specific to your application and arise from specific business rules rather than programmer errors.

Runtime errors could happen when:

- The user does not have appropriate permissions
- The event payload received does not have required claims.
- The user has performed an action which violates a business rule.
- The email or phone provider used in the webhook returned an error.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="sql"
  queryGroup="language"
>
<TabPanel id="sql" label="SQL">

The error is a JSON object and has the following properties:

- `error` An object that contains information about the error.
  - `http_code` A number indicating the HTTP code to be returned. If not set, the code is HTTP 500 Internal Server Error.
  - `message` A message to be returned in the HTTP response. Required.

Here's an example:

```json
{
  "error": {
    "http_code": 429,
    "message": "You can only verify a factor once every 10 seconds."
  }
}
```

Errors returned from a Postgres Hook are not retry-able. When an error is returned, the error is propagated from the hook to Supabase Auth and translated into an HTTP error which is returned to your application. Supabase Auth will only take into account the error and disregard the rest of the payload.

</TabPanel>

<TabPanel id="http" label="HTTP">
Hooks return status codes based on the nature of the response. These status codes help determine the next steps in the processing flow:

| HTTP Status Code | Description                                                   | Example Usage                                  |
| ---------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| 200, 202, 204    | Valid response, proceed                                       | Successful processing of the request           |
| 403, 400         | Treated as Internal Server Errors and return a 500 Error Code | Malformed requests or insufficient permissions |
| 429, 503         | Retry-able errors                                             | Temporary server overload or maintenance       |

<Admonition type="note">

`204` Status is not supported by the following hooks which require a response body:

- [Custom Access Token](/docs/guides/auth/auth-hooks/custom-access-token-hook)
- [MFA Verification Attempt](/docs/guides/auth/auth-hooks/mfa-verification-hook)
- [Password Verification Attempt](/docs/guides/auth/auth-hooks/password-verification-hook)

</Admonition>

Errors are responses which contain status codes 400 and above. On a retry-able error, such as an error with a `429` or `503` status code, HTTP Hooks will attempt up to three retries with a back-off of two seconds. We have a time budget of 5s for the entire webhook invocation, including retry requests.

Here's a sample HTTP retry schedule:

| Time Since Start (HH:MM:SS) | Event                 | Notes                                                                            |
| --------------------------- | --------------------- | -------------------------------------------------------------------------------- |
| 00:00:00                    | Initial Attempt       | Initial invocation begins.                                                       |
| 00:00:02                    | Initial Attempt Fails | Initial invocation returns `429` or `503` with non-empty `retry-after` header.   |
| 00:00:04                    | Retry Start #1        | After 2 sec delay, first retry begins.                                           |
| 00:00:05                    | Retry Timeout #1      | First retry times out, exceeded 5 second budget and invocation returns an error. |

Return a retry-able error by attaching a appropriate status code (`429`, `503`) and a non-empty `retry-after` header

<Admonition type="note">

`Retry-After` Supabase Auth does not fully support the `Retry-After` header as described in RFC7231, we only check if it is a non-empty value such as `true` or `10`. Setting this to your preferred value is fine as a future update may address this.

</Admonition>

```jsx
return new Response(
  JSON.stringify({
    error: `Failed to process the request: ${error}`,
  }),
  { status: 429, headers: { 'Content-Type': 'application/json', 'retry-after': 'true' } }
)
```

Note that all responses, including error responses, need a `Content-Type` of `application/json` - not specifying the appropriate `Content-Type` will result in the function returning an error response. Supabase Auth will in turn return an Internal Server Error.

</TabPanel>
</Tabs>

Outside of runtime errors, both HTTP Hooks and Postgres Hooks return timeout errors. Postgres Hooks have <SharedData data="config">auth.hook_timeouts.postgres_hooks</SharedData> seconds to complete processing while HTTP Hooks should complete in <SharedData data="config">auth.hook_timeouts.http_hooks</SharedData> seconds. Both HTTP Hooks and Postgres Hooks are run in a transaction do limit the duration of execution to avoid delays in authentication process.

## Available Hooks

Each Hook description contains an example JSON Schema which you can use in conjunction with [JSON Schema Faker](https://json-schema-faker.js.org/) in order to generate a mock payload. For HTTP Hooks, you can also use [the Standard Webhooks Testing Tool](https://www.standardwebhooks.com/simulate) to simulate a request.

<div className="grid md:grid-cols-12 gap-4 not-prose">
  {[
    {
      name: 'Custom Access Token',
      description: 'Customize the access token issued by Supabase Auth',
      href: '/guides/auth/auth-hooks/custom-access-token-hook',
    },
    {
      name: 'Send SMS',
      description: 'Use a custom SMS provider to send authentication messages',
      href: '/guides/auth/auth-hooks/send-sms-hook',
    },
    {
      name: 'Send Email',
      description: 'Use a custom email provider to send authentication messages',
      href: '/guides/auth/auth-hooks/send-email-hook',
    },
    {
      name: 'MFA Verification',
      description: 'Add additional checks to the MFA verification flow',
      href: '/guides/auth/auth-hooks/mfa-verification-hook',
    },
    {
      name: 'Password verification',
      description: 'Add additional checks to the password verification flow',
      href: '/guides/auth/auth-hooks/password-verification-hook',
    },
  ].map((x) => (
    <div className="col-span-4" key={x.href}>
      <Link href={x.href} passHref>
        <GlassPanel title={x.name}>{x.description}</GlassPanel>
      </Link>
    </div>
  ))}
</div>
