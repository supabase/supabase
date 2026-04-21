---
id: 'customizing-email-templates'
title: 'Customizing email templates'
subtitle: 'Customize local email templates via the config file.'
---

You can customize the email templates for local development by [editing the `config.toml` file](/docs/guides/local-development/cli/config#auth-config).

## Configuring templates

You should provide a relative URL to the `content_path` parameter, pointing to an HTML file which contains the template. For example:

### Authentication email templates

<$CodeTabs>

```toml name=supabase/config.toml
[auth.email.template.invite]
subject = "You are invited to Acme Inc"
content_path = "./supabase/templates/invite.html"
```

```html name=supabase/templates/invite.html
<html>
  <body>
    <h2>Confirm your signup</h2>
    <p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
  </body>
</html>
```

</$CodeTabs>

### Security notification email templates

<$CodeTabs>

```toml name=supabase/config.toml
[auth.email.notification.password_changed]
enabled = true
subject = "Your password has been changed"
content_path = "./templates/password_changed_notification.html"
```

```html name=templates/password_changed_notification.html
<html>
  <body>
    <p>
      This is a confirmation that the password for your account {{ .Email }} has just been changed.
    </p>
    <p>If you did not make this change, please contact support.</p>
  </body>
</html>
```

</$CodeTabs>

## Available authentication email templates

There are several authentication-related email templates which can be configured. Each template serves a specific authentication flow:

### `auth.email.template.invite`

**Default subject**: "You have been invited"
**When sent**: When a user is invited to join your application via email invitation
**Purpose**: Invite users who don't yet have an account to sign up
**Content**: Contains a link for the invited user to accept the invitation and create their account

### `auth.email.template.confirmation`

**Default subject**: "Confirm Your Signup"
**When sent**: When a user signs up and needs to verify their email address
**Purpose**: Ask users to confirm their email address after signing up
**Content**: Contains a confirmation link to verify the user's email address

### `auth.email.template.recovery`

**Default subject**: "Reset Your Password"
**When sent**: When a user requests a password reset
**Purpose**: Allow users to reset their password if they forget it
**Content**: Contains a link to reset the user's password

### `auth.email.template.magic_link`

**Default subject**: "Your Magic Link"
**When sent**: When a user requests a magic link for passwordless authentication
**Purpose**: Allow users to sign in via a one-time link sent to their email
**Content**: Contains a secure link that automatically logs the user in when clicked

### `auth.email.template.email_change`

**Default subject**: "Confirm Email Change"
**When sent**: When a user requests to change their email address
**Purpose**: Ask users to verify their new email address after changing it
**Content**: Contains a confirmation link to verify the new email address

### `auth.email.template.reauthentication`

**Default subject**: "Confirm Reauthentication"
**When sent**: When a user needs to re-authenticate for sensitive operations
**Purpose**: Ask users to re-authenticate before performing a sensitive action
**Content**: Contains a 6-digit OTP code for verification

## Available security notification email templates

There are several security notification email templates which can be configured. These emails are only sent to users if the respective security notifications have been enabled at the project-level:

### `auth.email.notification.password_changed`

**Default subject**: "Your password has been changed"
**When sent**: When a user's password is changed
**Purpose**: Notify users when their password has changed
**Content**: Confirms that the password for the account has been changed

### `auth.email.notification.email_changed`

**Default subject**: "Your email address has been changed"
**When sent**: When a user's email address is changed
**Purpose**: Notify users when their email address has changed
**Content**: Confirms the change from the old email to the new email address

### `auth.email.notification.phone_changed`

**Default subject**: "Your phone number has been changed"
**When sent**: When a user's phone number is changed
**Purpose**: Notify users when their phone number has changed
**Content**: Confirms the change from the old phone number to the new phone number

### `auth.email.notification.mfa_factor_enrolled`

**Default subject**: "A new MFA factor has been enrolled"
**When sent**: When a new MFA factor is added to the user's account
**Purpose**: Notify users when a new multi-factor authentication method has been added to their account
**Content**: Confirms that a new MFA factor type has been enrolled

### `auth.email.notification.mfa_factor_unenrolled`

**Default subject**: "An MFA factor has been unenrolled"
**When sent**: When an MFA factor is removed from the user's account
**Purpose**: Notify users when a multi-factor authentication method has been removed from their account
**Content**: Confirms that an MFA factor type has been unenrolled

### `auth.email.notification.identity_linked`

**Default subject**: "A new identity has been linked"
**When sent**: When a new identity is linked to the account
**Purpose**: Notify users when a new identity has been linked to their account
**Content**: Confirms that a new identity has been linked

### `auth.email.notification.identity_unlinked`

**Default subject**: "An identity has been unlinked"
**When sent**: When an identity has been unlinked from the account
**Purpose**: Notify users when an identity has been unlinked from their account
**Content**: Confirms that an identity has been unlinked

## Template variables

The templating system provides the following variables for use:

### `ConfirmationURL`

Contains the confirmation URL. For example, a signup confirmation URL would look like:

```
https://project-ref.supabase.co/auth/v1/verify?token={{ .TokenHash }}&type=email&redirect_to=https://example.com/path
```

**Usage**

```html
<p>Click here to confirm: {{ .ConfirmationURL }}</p>
```

### `Token`

Contains a 6-digit One-Time-Password (OTP) that can be used instead of the `ConfirmationURL`.

**Usage**

```html
<p>Here is your one time password: {{ .Token }}</p>
```

### `TokenHash`

Contains a hashed version of the `Token`. This is useful for constructing your own email link in the email template.

**Usage**

```html
<p>Follow this link to confirm your user:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email"
    >Confirm your email</a
  >
</p>
```

### `SiteURL`

Contains your application's Site URL. This can be configured in your project's [authentication settings](/dashboard/project/_/auth/url-configuration).

**Usage**

```html
<p>Visit <a href="{{ .SiteURL }}">here</a> to log in.</p>
```

### `Email`

Contains the user's email address.

**Usage**

```html
<p>A recovery request was sent to {{ .Email }}.</p>
```

### `NewEmail`

Contains the new user's email address. This is only available in the `email_change` email template.

**Usage**

```html
<p>You are requesting to update your email address to {{ .NewEmail }}.</p>
```

### `OldEmail`

Contains the user's old email address. This is only available in the `email_changed_notification` email template.

**Usage**

```html
<p>The email address for your account has been changed from {{ .OldEmail }} to {{ .Email }}.</p>
```

### `Phone`

Contains the user's new phone number. This is only available in the `phone_changed_notification` email template.

**Usage**

```html
<p>The phone number for your account has been changed from {{ .OldPhone }} to {{ .Phone }}.</p>
```

### `OldPhone`

Contains the user's old phone number. This is only available in the `phone_changed_notification` email template.

**Usage**

```html
<p>The phone number for your account has been changed from {{ .OldPhone }} to {{ .Phone }}.</p>
```

### `Provider`

Contains the provider of the newly linked/unlinked identity. This is only available in the `identity_linked_notification` and `identity_unlinked_notification` email templates.

**Usage**

```html
<p>A new identity ({{ .Provider }}) has been linked to your account.</p>
```

### `FactorType`

Contains the type of the newly enrolled/unenrolled MFA factor. This is only available in the `mfa_factor_enrolled_notification` and `mfa_factor_unenrolled_notification` email templates.

**Usage**

```html
<p>A new factor ({{ .FactorType }}) has been enrolled for your account.</p>
```

## Deploying email templates

These settings are for local development. To apply the changes locally, stop and restart the Supabase containers:

```sh
supabase stop && supabase start
```

For hosted projects managed by Supabase, copy the templates into the [Email Templates](/dashboard/project/_/auth/templates) section of the Dashboard.
