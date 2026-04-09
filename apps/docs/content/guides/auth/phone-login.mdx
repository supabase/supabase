---
title: 'Phone Login'
description: 'Learn about logging in to your platform using SMS one-time passwords.'
---

Phone Login is a method of authentication that allows users to log in to a website or application without using a password. The user authenticates through a one-time password (OTP) sent via a channel (SMS or WhatsApp).

<Admonition type="note">

At this time, `WhatsApp` is only supported as a channel for the Twilio and Twilio Verify Providers.

</Admonition>

Users can also log in with their phones using Native Mobile Login with the built-in identity provider. For Native Mobile Login with Android and iOS, see the [Social Login guides](/docs/guides/auth/social-login).

Phone OTP login can:

- Improve the user experience by not requiring users to create and remember a password
- Increase security by reducing the risk of password-related security breaches
- Reduce support burden of dealing with password resets and other password-related flows

<CostWarning />

## Enabling phone login

Enable phone authentication on the [Auth Providers page](/dashboard/project/_/auth/providers) for hosted Supabase projects.

For self-hosted projects or local development, use the [configuration file](/docs/guides/cli/config#auth.sms.enable_signup). See the configuration variables namespaced under `auth.sms`.

You also need to set up an SMS provider. Each provider has its own configuration. Supported providers include MessageBird, Twilio, Vonage, and TextLocal (community-supported).

<AuthSmsProviderConfig />

By default, a user can only request an OTP once every <SharedData data="config">auth.rate_limits.otp.period</SharedData> and they expire after <SharedData data="config">auth.rate_limits.otp.validity</SharedData>.

## Signing in with phone OTP

With OTP, a user can sign in without setting a password on their account. They need to verify their phone number each time they sign in.

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('url', 'anonKey')

// ---cut---
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+13334445555',
})
```

</TabPanel>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
try await supabase.auth.signInWithOTP(
  phone: "+13334445555"
)
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

```kotlin
supabase.auth.signInWith(OTP) {
    phone = "+13334445555"
}
```

To send the OTP via WhatsApp instead of SMS (requires Twilio or Twilio Verify provider):

```kotlin
supabase.auth.signInWith(OTP) {
    phone = "+13334445555"
    channel = Phone.Channel.WHATSAPP
}
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
response = supabase.auth.sign_in_with_otp({
  'phone': '+13334445555',
})
```

</TabPanel>
</$Show>
<TabPanel id="http" label="HTTP">

```bash
curl -X POST 'https://cvwawazfelidkloqmbma.supabase.co/auth/v1/otp' \
-H "apikey: SUPABASE_KEY" \
-H "Content-Type: application/json" \
-d '{
  "phone": "+13334445555"
}'
```

</TabPanel>
</Tabs>

The user receives an SMS with a 6-digit pin that you must verify within 60 seconds.

## Verifying a phone OTP

To verify the one-time password (OTP) sent to the user's phone number, call [`verifyOtp()`](/docs/reference/javascript/auth-verifyotp) with the phone number and OTP:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

You should present a form to the user so they can input the 6 digit pin, then send it along with the phone number to `verifyOtp`:

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('url', 'anonKey')

// ---cut---
const {
  data: { session },
  error,
} = await supabase.auth.verifyOtp({
  phone: '13334445555',
  token: '123456',
  type: 'sms',
})
```

</TabPanel>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

You should present a form to the user so they can input the 6 digit pin, then send it along with the phone number to `verifyOTP`:

```swift
try await supabase.auth.verifyOTP(
  phone: "+13334445555",
  token: "123456",
  type: .sms
)
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

You should present a form to the user so they can input the 6 digit pin, then send it along with the phone number to `verifyPhoneOtp`:

```kotlin
supabase.auth.verifyPhoneOtp(
    type = OtpType.Phone.SMS,
    phone = "+13334445555",
    token = "123456"
)
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

You should present a form to the user so they can input the 6 digit pin, then send it along with the phone number to `verify_otp`:

```python
response = supabase.auth.verify_otp({
  'phone': '13334445555',
  'token': '123456',
  'type': 'sms',
})
```

</TabPanel>
</$Show>
<TabPanel id="http" label="HTTP">

```bash
curl -X POST 'https://<PROJECT_REF>.supabase.co/auth/v1/verify' \
-H "apikey: <SUPABASE_KEY>" \
-H "Content-Type: application/json" \
-d '{
  "type": "sms",
  "phone": "+13334445555",
  "token": "123456"
}'
```

</TabPanel>
</Tabs>

If successful the user will now be logged in and you should receive a valid session like:

```json
{
  "access_token": "<ACCESS_TOKEN>",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "<REFRESH_TOKEN>"
}
```

The access token can be sent in the Authorization header as a Bearer token for any CRUD operations on supabase-js. See our guide on [Row Level Security](/docs/guides/auth#row-level-security) for more info on restricting access on a user basis.

## Updating a phone number

To update a user's phone number, the user must be logged in. Call [`updateUser()`](/docs/reference/javascript/auth-updateuser) with their phone number:

<Tabs
  scrollable
  size="small"
  type="underlined"
  defaultActiveId="js"
  queryGroup="language"
>
<TabPanel id="js" label="JavaScript">

```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('url', 'anonKey')

// ---cut---
const { data, error } = await supabase.auth.updateUser({
  phone: '123456789',
})
```

</TabPanel>
<$Show if="sdk:swift">
<TabPanel id="swift" label="Swift">

```swift
try await supabase.auth.updateUser(
  user: UserAttributes(
    phone: "123456789"
  )
)
```

</TabPanel>
</$Show>
<$Show if="sdk:kotlin">
<TabPanel id="kotlin" label="Kotlin">

```kotlin
supabase.auth.updateUser {
    phone = "123456789"
}
```

</TabPanel>
</$Show>
<$Show if="sdk:python">
<TabPanel id="python" label="Python">

```python
response = supabase.auth.update_user({
  'phone': '123456789',
})
```

</TabPanel>
</$Show>
</Tabs>

The user receives an SMS with a 6-digit pin that you must [verify](#verifying-a-phone-otp) within 60 seconds.
Use the `phone_change` type when calling `verifyOTP` to update a user’s phone number.
