---
title: 'Configure Phone Login & MFA'
description: 'Set up phone login SMS providers, OTP settings, and multi-factor authentication for self-hosted Supabase with Docker.'
subtitle: 'Set up phone login SMS providers, OTP settings, and multi-factor authentication for self-hosted Supabase with Docker.'
---

This guide covers the **server-side configuration** for phone login and multi-factor authentication (MFA) on a self-hosted Supabase instance running with Docker Compose.

For client-side implementation, see [Phone Login](/docs/guides/auth/phone-login) and [Multi-Factor Authentication](/docs/guides/auth/auth-mfa).

## Before you begin

You need:

- A working self-hosted Supabase installation. See [Self-Hosting with Docker](/docs/guides/self-hosting/docker).
- An account with an SMS provider (e.g., Twilio)

Phone auth is **enabled by default** in the Docker setup (`ENABLE_PHONE_SIGNUP=true` in `.env`). However, without an SMS provider configured, the Auth service has no way to deliver OTP codes.

## SMS provider configuration

The default `.env.example` and `docker-compose.yml` include commented-out SMS provider placeholders. The example below uses Twilio - you'll need a Twilio account with an account SID, auth token, and message service SID. See [Twilio's documentation](https://www.twilio.com/docs/messaging) for how to obtain these credentials.

To enable SMS delivery:

### Step 1: Uncomment and configure the settings in `.env`

```
SMS_PROVIDER=twilio
SMS_OTP_EXP=60
SMS_OTP_LENGTH=6
SMS_MAX_FREQUENCY=60s
SMS_TEMPLATE=Your code is {{ .Code }}

## Twilio credentials
SMS_TWILIO_ACCOUNT_SID=your-account-sid
SMS_TWILIO_AUTH_TOKEN=your-auth-token
SMS_TWILIO_MESSAGE_SERVICE_SID=your-message-service-sid
```

### Step 2: Uncomment the matching lines in `docker-compose.yml`

Uncomment the `GOTRUE_SMS_*` lines in the `auth` service's `environment` block:

```yaml
auth:
  environment:
    # ... existing variables ...
    GOTRUE_SMS_PROVIDER: ${SMS_PROVIDER}
    GOTRUE_SMS_OTP_EXP: ${SMS_OTP_EXP}
    GOTRUE_SMS_OTP_LENGTH: ${SMS_OTP_LENGTH}
    GOTRUE_SMS_MAX_FREQUENCY: ${SMS_MAX_FREQUENCY}
    GOTRUE_SMS_TEMPLATE: ${SMS_TEMPLATE}
    GOTRUE_SMS_TWILIO_ACCOUNT_SID: ${SMS_TWILIO_ACCOUNT_SID}
    GOTRUE_SMS_TWILIO_AUTH_TOKEN: ${SMS_TWILIO_AUTH_TOKEN}
    GOTRUE_SMS_TWILIO_MESSAGE_SERVICE_SID: ${SMS_TWILIO_MESSAGE_SERVICE_SID}
```

### Step 3: Restart the auth service

```sh
docker compose up -d --force-recreate --no-deps auth
```

### Step 4: Verify

```sh
docker compose exec auth env | grep GOTRUE_SMS
```

Confirm your provider and credentials appear in the output.

<Admonition type="note">

For providers other than Twilio, add the provider-specific `GOTRUE_SMS_*` lines manually to `docker-compose.yml`.

</Admonition>

## OTP settings

### Expiration

<Admonition type="caution">

The default OTP expiration is **60 seconds**. This is often too short for production use, consider increasing it.

</Admonition>

Set `SMS_OTP_EXP` in `.env` (value is in seconds):

```
# Set expiration to 5 minutes
SMS_OTP_EXP=300
```

And ensure `GOTRUE_SMS_OTP_EXP: ${SMS_OTP_EXP}` is uncommented in `docker-compose.yml`.

### Length

The default OTP length is 6 digits. You can set it to any value between 6 and 10:

```
SMS_OTP_LENGTH=8
```

### Rate limiting

`SMS_MAX_FREQUENCY` controls the minimum interval between SMS sends to the same phone number. The default is 60 seconds:

```
## Allow one SMS every 30 seconds
SMS_MAX_FREQUENCY=30s
```

## Test OTPs for development

To avoid sending real SMS during development, use `SMS_TEST_OTP` to map phone numbers to fixed OTP codes:

```
SMS_TEST_OTP=16505551234:123456,16505555678:654321
```

And uncomment `GOTRUE_SMS_TEST_OTP: ${SMS_TEST_OTP}` in `docker-compose.yml`.

When a test phone number requests an OTP, the Auth service skips SMS delivery and accepts only the mapped code. Other phone numbers continue to use the real SMS provider.

<Admonition type="caution">

Remove test OTPs before deploying to production. You can also set an expiration with `SMS_TEST_OTP_VALID_UNTIL` (ISO 8601 datetime, e.g., `2026-12-31T23:59:59Z`) so they stop working automatically.

</Admonition>

## Multi-factor authentication (MFA)

The Auth service supports three MFA factor types. Configure them by uncommenting variables in `.env` and the matching `GOTRUE_MFA_*` lines in `docker-compose.yml`.

### App authenticator (TOTP)

TOTP is **enabled by default** - users can enroll with apps like Google Authenticator or Authy without any additional configuration.

To disable TOTP:

```
MFA_TOTP_ENROLL_ENABLED=false
MFA_TOTP_VERIFY_ENABLED=false
```

### Phone MFA

Phone MFA is **disabled by default** (opt-in). It uses the same SMS provider configuration as phone login.

To enable:

```
MFA_PHONE_ENROLL_ENABLED=true
MFA_PHONE_VERIFY_ENABLED=true
```

### Maximum enrolled factors

By default, a user can enroll up to 10 MFA factors. To change this:

```
MFA_MAX_ENROLLED_FACTORS=5
```

## Troubleshooting

### OTP expires too quickly

The default `SMS_OTP_EXP` is 60 seconds. Increase it in `.env`:

```
SMS_OTP_EXP=300
```

Ensure `GOTRUE_SMS_OTP_EXP: ${SMS_OTP_EXP}` is uncommented in `docker-compose.yml`, then restart:

```sh
docker compose up -d --force-recreate --no-deps auth
```

### SMS not being delivered

Check the auth container logs for errors:

```sh
docker compose logs auth --tail 50
```

Verify provider credentials reach the container:

```sh
docker compose exec auth env | grep GOTRUE_SMS
```

Common causes:

- Provider credentials are in `.env` but the matching `GOTRUE_SMS_*` line is still commented out in `docker-compose.yml`
- Provider credentials are wrong
- Phone number format is wrong (use E.164 format: `+1234567890`)

### Variables are configured in `.env` but not working

Configuration variables from `.env` are **not** automatically available inside the container unless there's a matching passthrough definition in `docker-compose.yml`. Check, e.g., for:

```sh
docker compose exec auth env | grep -E 'GOTRUE_SMS|GOTRUE_MFA'
```

After changing the configuration environment variables, recreate the Auth service container:

```sh
docker compose up -d --force-recreate --no-deps auth
```

### Rate limit errors

If users see "rate limit exceeded" errors, check `SMS_MAX_FREQUENCY` (minimum interval between sends) and the global rate limit `GOTRUE_RATE_LIMIT_SMS_SENT` (default: 30 per hour).

### Additional resources

- [Multi-Factor Authentication (Phone)](/docs/guides/auth/auth-mfa/phone)
- [Multi-Factor Authentication (TOTP)](/docs/guides/auth/auth-mfa/totp)
- [Auth server on GitHub](https://github.com/supabase/auth) (check README and `example.env`)
