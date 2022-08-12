---
id: about
title: GoTrue Auth Server
description: An SWT based API for managing users and issuing SWT tokens
---

GoTrue is a small open-source API written in golang, that can act as a self-standing
API service for handling user registration and authentication for JAM projects.

It's based on OAuth2 and JWT and will handle user signup, authentication and custom
user data.

## Configuration

You may configure GoTrue using either a configuration file named `.env`,
environment variables, or a combination of both. Environment variables are prefixed with `GOTRUE_`, and will always have precedence over values provided via file.

### Top-Level

```
GOTRUE_SITE_URL=https://example.netlify.com/
```

`SITE_URL` - `string` **required**

The base URL your site is located at. Currently used in combination with other settings to construct URLs used in emails.

`OPERATOR_TOKEN` - `string` _Multi-instance mode only_

The shared secret with an operator (usually Netlify) for this microservice. Used to verify requests have been proxied through the operator and
the payload values can be trusted.

`DISABLE_SIGNUP` - `bool`

When signup is disabled the only way to create new users is through invites. Defaults to `false`, all signups enabled.

`GOTRUE_RATE_LIMIT_HEADER` - `string`

Header on which to rate limit the `/token` endpoint.

### API

```
GOTRUE_API_HOST=localhost
PORT=9999
```

`API_HOST` - `string`

Hostname to listen on.

`PORT` (no prefix) / `API_PORT` - `number`

Port number to listen on. Defaults to `8081`.

`API_ENDPOINT` - `string` _Multi-instance mode only_

Controls what endpoint Netlify can access this API on.

`REQUEST_ID_HEADER` - `string`

If you wish to inherit a request ID from the incoming request, specify the name in this value.

### Database

```
GOTRUE_DB_DRIVER=mysql
DATABASE_URL=root@localhost/gotrue
```

`DB_DRIVER` - `string` **required**

Chooses what dialect of database you want. Must be `mysql`.

`DATABASE_URL` (no prefix) / `DB_DATABASE_URL` - `string` **required**

Connection string for the database.

`DB_NAMESPACE` - `string`

Adds a prefix to all table names.

**Migrations Note**

Migrations are not applied automatically, so you will need to run them after
you've built gotrue.

- If built locally: `./gotrue migrate`
- Using Docker: `docker run --rm gotrue gotrue migrate`

### Logging

```
LOG_LEVEL=debug # available without GOTRUE prefix (exception)
GOTRUE_LOG_FILE=/var/log/go/gotrue.log
```

`LOG_LEVEL` - `string`

Controls what log levels are output. Choose from `panic`, `fatal`, `error`, `warn`, `info`, or `debug`. Defaults to `info`.

`LOG_FILE` - `string`

If you wish logs to be written to a file, set `log_file` to a valid file path.

### JSON Web Tokens (JWT)

```
GOTRUE_JWT_SECRET=supersecretvalue
GOTRUE_JWT_EXP=3600
GOTRUE_JWT_AUD=netlify
```

`JWT_SECRET` - `string` **required**

The secret used to sign JWT tokens with.

`JWT_EXP` - `number`

How long tokens are valid for, in seconds. Defaults to 3600 (1 hour).

`JWT_AUD` - `string`

The default JWT audience. Use audiences to group users.

`JWT_ADMIN_GROUP_NAME` - `string`

The name of the admin group (if enabled). Defaults to `admin`.

`JWT_DEFAULT_GROUP_NAME` - `string`

The default group to assign all new users to.

### External Authentication Providers

We support `bitbucket`, `github`, `gitlab`, and `google` for external authentication.
Use the names as the keys underneath `external` to configure each separately.

```
GOTRUE_EXTERNAL_GITHUB_CLIENT_ID=myappclientid
GOTRUE_EXTERNAL_GITHUB_SECRET=clientsecretvaluessssh
```

No external providers are required, but you must provide the required values if you choose to enable any.

`EXTERNAL_X_ENABLED` - `bool`

Whether this external provider is enabled or not

`EXTERNAL_X_CLIENT_ID` - `string` **required**

The OAuth2 Client ID registered with the external provider.

`EXTERNAL_X_SECRET` - `string` **required**

The OAuth2 Client Secret provided by the external provider when you registered.

`EXTERNAL_X_REDIRECT_URI` - `string` **required for gitlab**

The URI a OAuth2 provider will redirect to with the `code` and `state` values.

`EXTERNAL_X_URL` - `string`

The base URL used for constructing the URLs to request authorization and access tokens. Used by `gitlab` only. Defaults to `https://gitlab.com`.

### E-Mail

Sending email is not required, but highly recommended for password recovery.
If enabled, you must provide the required values below.

```
GOTRUE_SMTP_HOST=smtp.mandrillapp.com
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=smtp-delivery@example.com
GOTRUE_SMTP_PASS=correcthorsebatterystaple
GOTRUE_SMTP_ADMIN_EMAIL=support@example.com
GOTRUE_MAILER_SUBJECTS_CONFIRMATION="Please confirm"
```

`SMTP_ADMIN_EMAIL` - `string` **required**

The `From` email address for all emails sent.

`SMTP_HOST` - `string` **required**

The mail server hostname to send emails through.

`SMTP_PORT` - `number` **required**

The port number to connect to the mail server on.

`SMTP_USER` - `string`

If the mail server requires authentication, the username to use.

`SMTP_PASS` - `string`

If the mail server requires authentication, the password to use.

`SMTP_MAX_FREQUENCY` - `number`

Controls the minimum amount of time that must pass before sending another signup confirmation or password reset email. The value is the number of seconds. Defaults to 900 (15 minutes).

`MAILER_AUTOCONFIRM` - `bool`

If you do not require email confirmation, you may set this to `true`. Defaults to `false`.

`MAILER_SECURE_EMAIL_CHANGE_ENABLED` - `bool`

If `true`, send an email to both the user's current and new email with a confirmation link, otherwise send an email with confirmation link only to new email. Defaults to `true`.

`MAILER_URLPATHS_INVITE` - `string`

URL path to use in the user invite email. Defaults to `/`.

`MAILER_URLPATHS_CONFIRMATION` - `string`

URL path to use in the signup confirmation email. Defaults to `/`.

`MAILER_URLPATHS_RECOVERY` - `string`

URL path to use in the password reset email. Defaults to `/`.

`MAILER_URLPATHS_EMAIL_CHANGE` - `string`

URL path to use in the email change confirmation email. Defaults to `/`.

`MAILER_SUBJECTS_INVITE` - `string`

Email subject to use for user invite. Defaults to `You have been invited`.

`MAILER_SUBJECTS_CONFIRMATION` - `string`

Email subject to use for signup confirmation. Defaults to `Confirm Your Signup`.

`MAILER_SUBJECTS_RECOVERY` - `string`

Email subject to use for password reset. Defaults to `Reset Your Password`.

`MAILER_SUBJECTS_MAGIC_LINK` - `string`

Email subject to use for magic link email. Defaults to `Your Magic Link`.

`MAILER_SUBJECTS_EMAIL_CHANGE` - `string`

Email subject to use for email change confirmation. Defaults to `Confirm Email Change`.

`MAILER_TEMPLATES_INVITE` - `string`

URL path to an email template to use when inviting a user.
`SiteURL`, `Email`, and `ConfirmationURL` variables are available.

Default Content (if template is unavailable):

```html
<h2>You have been invited</h2>

<p>
  You have been invited to create a user on {{ .SiteURL }}. Follow this link to
  accept the invite:
</p>
<p><a href="{{ .ConfirmationURL }}">Accept the invite</a></p>
```

`MAILER_TEMPLATES_CONFIRMATION` - `string`

URL path to an email template to use when confirming a signup.
`SiteURL`, `Email`, and `ConfirmationURL` variables are available.

Default Content (if template is unavailable):

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

`MAILER_TEMPLATES_RECOVERY` - `string`

URL path to an email template to use when resetting a password.
`SiteURL`, `Email`, and `ConfirmationURL` variables are available.

Default Content (if template is unavailable):

```html
<h2>Reset Password</h2>

<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
```

`MAILER_TEMPLATES_MAGIC_LINK` - `string`

URL path to an email template to use when sending magic link.
`SiteURL`, `Email`, and `ConfirmationURL` variables are available.

Default Content (if template is unavailable):

```html
<h2>Magic Link</h2>

<p>Follow this link to login:</p>
<p><a href="{{ .ConfirmationURL }}">Log In</a></p>
```

`MAILER_TEMPLATES_EMAIL_CHANGE` - `string`

URL path to an email template to use when confirming the change of an email address.
`SiteURL`, `Email`, `NewEmail`, and `ConfirmationURL` variables are available.

Default Content (if template is unavailable):

```html
<h2>Confirm Change of Email</h2>

<p>
  Follow this link to confirm the update of your email from {{ .Email }} to {{
  .NewEmail }}:
</p>
<p><a href="{{ .ConfirmationURL }}">Change Email</a></p>
```

## Endpoints

GoTrue exposes the following endpoints:

### **GET /settings**

Returns the publicly available settings for this gotrue instance.

```json
{
  "external": {
    "bitbucket": true,
    "github": true,
    "gitlab": true,
    "google": true
  },
  "disable_signup": false,
  "autoconfirm": false
}
```

### **POST /signup**

Register a new user with an email and password.

```json
{
  "email": "email@example.com",
  "password": "secret"
}
```

Returns:

```json
{
  "id": "11111111-2222-3333-4444-5555555555555",
  "email": "email@example.com",
  "confirmation_sent_at": "2016-05-15T20:49:40.882805774-07:00",
  "created_at": "2016-05-15T19:53:12.368652374-07:00",
  "updated_at": "2016-05-15T19:53:12.368652374-07:00"
}
```

### **POST /invite**

Invites a new user with an email.
This endpoint requires the `service_role` or `supabase_admin` JWT set as an Auth Bearer header:

e.g.

```json
headers: {
  "Authorization" : "Bearer eyJhbGciOiJI...M3A90LCkxxtX9oNP9KZO"
}
```

```json
{
  "email": "email@example.com"
}
```

Returns:

```json
{
  "id": "11111111-2222-3333-4444-5555555555555",
  "email": "email@example.com",
  "confirmation_sent_at": "2016-05-15T20:49:40.882805774-07:00",
  "created_at": "2016-05-15T19:53:12.368652374-07:00",
  "updated_at": "2016-05-15T19:53:12.368652374-07:00",
  "invited_at": "2016-05-15T19:53:12.368652374-07:00"
}
```

### **POST /verify**

Verify a registration or a password recovery. Type can be `signup` or `recovery` or `invite`
and the `token` is a token returned from either `/signup` or `/recover`.

```json
{
  "type": "signup",
  "token": "confirmation-code-delivered-in-email"
}
```

`password` is required for signup verification if no existing password exists.

Returns:

```json
{
  "access_token": "jwt-token-representing-the-user",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "a-refresh-token",
  "type": "signup | recovery | invite"
}
```

### **GET /verify**

Verify a registration or a password recovery. Type can be `signup` or `recovery` or `magiclink` or `invite`
and the `token` is a token returned from either `/signup` or `/recover` or `/magiclink`.

query params:

```json
{
  "type": "signup",
  "token": "confirmation-code-delivered-in-email"
}
```

User will be logged in and redirected to:

```json
SITE_URL/#access_token=jwt-token-representing-the-user&token_type=bearer&expires_in=3600&refresh_token=a-refresh-token&type=invite
```

Your app should detect the query params in the fragment and use them to set the session (supabase-js does this automatically)

You can use the `type` param to redirect the user to a password set form in the case of `invite` or `recovery`,
or show an account confirmed/welcome message in the case of `signup`, or direct them to some additional onboarding flow

### **POST /magiclink**

Magic Link. Will deliver a link (e.g. `/verify?type=magiclink&token=fgtyuf68ddqdaDd`) to the user based on
email address which they can use to redeem an access_token.

By default Magic Links can only be sent once every 60 seconds

```json
{
  "email": "email@example.com"
}
```

Returns:

```json
{}
```

when clicked the magic link will redirect the user to `<SITE_URL>#access_token=x&refresh_token=y&expires_in=z&token_type=bearer&type=magiclink` (see `/verify` above)

### **POST /recover**

Password recovery. Will deliver a password recovery mail to the user based on
email address.

By default recovery links can only be sent once every 60 seconds

```json
{
  "email": "email@example.com"
}
```

Returns:

```json
{}
```

### **POST /token**

This is an OAuth2 endpoint that currently implements
the password and refresh_token grant types

query params:

```
?grant_type=password
```

body:

```json
{
  "email": "name@domain.com",
  "password": "somepassword"
}
```

or

query params:

```
grant_type=refresh_token
```

body:

```json
{
  "refresh_token": "a-refresh-token"
}
```

Once you have an access token, you can access the methods requiring authentication
by settings the `Authorization: Bearer YOUR_ACCESS_TOKEN_HERE` header.

Returns:

```json
{
  "access_token": "jwt-token-representing-the-user",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "a-refresh-token"
}
```

### **GET /user**

Get the JSON object for the logged in user (requires authentication)

Returns:

```json
{
  "id": "11111111-2222-3333-4444-5555555555555",
  "email": "email@example.com",
  "confirmation_sent_at": "2016-05-15T20:49:40.882805774-07:00",
  "created_at": "2016-05-15T19:53:12.368652374-07:00",
  "updated_at": "2016-05-15T19:53:12.368652374-07:00"
}
```

### **PUT /user**

Update a user (Requires authentication). Apart from changing email/password, this
method can be used to set custom user data.

```json
{
  "email": "new-email@example.com",
  "password": "new-password",
  "data": {
    "key": "value",
    "number": 10,
    "admin": false
  }
}
```

Returns:

```json
{
  "id": "11111111-2222-3333-4444-5555555555555",
  "email": "email@example.com",
  "confirmation_sent_at": "2016-05-15T20:49:40.882805774-07:00",
  "created_at": "2016-05-15T19:53:12.368652374-07:00",
  "updated_at": "2016-05-15T19:53:12.368652374-07:00"
}
```

### **POST /admin/users**

Creates a new user. Requires your `service_role` API key and thus should only be
used in secure server-side environments.

```json
{
  "email": "new-email@example.com",
  "password": "new-password",
  "data": {
    "key": "value",
    "number": 10,
    "admin": false
  }
}
```

Returns:

```json
{
  "id": "11111111-2222-3333-4444-5555555555555",
  "aud": "authenticated",
  "role": "authenticated",
  "email": "email@example.com",
  "app_metadata": {
    "provider": "email"
  },
  "user_metadata": null,
  "created_at": "2016-05-15T19:53:12.368652374-07:00",
  "updated_at": "2016-05-15T19:53:12.368652374-07:00"
}
```

### **GET /admin/users/{user_id}**

Gets a user. Requires your `service_role` API key and thus should only be used
in secure server-side environments.

Returns:

```json
{
  "id": "11111111-2222-3333-4444-5555555555555",
  "aud": "authenticated",
  "role": "authenticated",
  "email": "email@example.com",
  "app_metadata": {
    "provider": "email"
  },
  "user_metadata": {},
  "created_at": "2016-05-15T19:53:12.368652374-07:00",
  "updated_at": "2016-05-15T19:53:12.368652374-07:00"
}
```

### **PUT /admin/users/{user_id}**

Updates a user. Requires your `service_role` API key and thus should only be
used in secure server-side environments.

```json
{
  "email": "email@example.com",
  "password": "updated-password",
  "data": {
    "key": "updated-value",
    "number": 10,
    "admin": false
  }
}
```

Returns:

```json
{
  "id": "11111111-2222-3333-4444-5555555555555",
  "aud": "authenticated",
  "role": "authenticated",
  "email": "email@example.com",
  "app_metadata": {
    "provider": "email"
  },
  "user_metadata": {},
  "created_at": "2016-05-15T19:53:12.368652374-07:00",
  "updated_at": "2016-05-15T19:53:12.368652374-07:00"
}
```

### **DELETE /admin/users/{user_id}**

Deletes a user. Requires your `service_role` API key and thus should only be
used in secure server-side environments.

### **POST /logout**

Logout a user (Requires authentication).

This will revoke all refresh tokens for the user. Remember that the JWT tokens
will still be valid for stateless auth until they expires.

### **GET /authorize**

Get access_token from external oauth provider

query params:

```
provider=google | bitbucket | github | gitlab
```

Redirects to provider and then to `/callback`

### **GET /callback**

External provider should redirect to here

Redirects to `<GOTRUE_SITE_URL>#access_token=<access_token>&refresh_token=<refresh_token>&expires_in=3600&provider=<provider_name>`

## Pre-built

- [Docker](https://hub.docker.com/repository/docker/supabase/gotrue)
