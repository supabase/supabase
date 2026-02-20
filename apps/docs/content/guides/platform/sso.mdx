---
title: 'Enable SSO for Your Organization'
description: 'General information about enabling single sign-on (SSO) for your organization'
---

<Admonition type="tip">

Looking for docs on how to add Single Sign-On support in your Supabase project? Head on over to [Single Sign-On with SAML 2.0 for Projects](/docs/guides/auth/enterprise-sso/auth-sso-saml).

</Admonition>

Supabase offers single sign-on (SSO) as a login option to provide additional account security for your team. This allows company administrators to enforce the use of an identity provider when logging into Supabase. SSO improves the onboarding and offboarding experience of the company as the employee only needs a single set of credentials to access third-party applications or tools which can also be revoked by an administrator.

<Admonition type="note">

Supabase currently provides SAML SSO for [Team and Enterprise Plan customers](/pricing). If you are an existing Team or Enterprise Plan customer, continue with the setup below.

</Admonition>

## Supported providers

Supabase supports practically all identity providers that support the SAML 2.0 SSO protocol. We've prepared these guides for commonly used identity providers to help you get started. If you use a different provider, our support stands ready to support you.

- [Google Workspaces (formerly G Suite)](/docs/guides/platform/sso/gsuite)
- [Azure Active Directory](/docs/guides/platform/sso/azure)
- [Okta](/docs/guides/platform/sso/okta)

Once configured, you can update your settings anytime via the [SSO tab](/dashboard/org/_/sso) under **Organization Settings**.

![SSO Example](/docs/img/sso-dashboard-enabled.png)

## Key configuration options

- **Multiple domains** - You can associate one or more email domains with your SSO provider. Users with email addresses matching these domains are eligible to sign in via SSO.
- **Auto-join** - Optionally allow users with a matching domain to be added to your organization automatically when they first sign in, without an invitation.
- **Default role for auto-joined users** - Choose the role (e.g., `Read-only`, `Developer`, `Administrator`, `Owner`) that automatically joined users receive. Refer to [access control](/docs/guides/platform/access-control) for more information about roles.

## How SSO works in Supabase

When SSO is enabled for an organization:

- Organization invites are restricted to company members belonging to the same identity provider.
- Every user has an organization created by default. They can create as many projects as they want.
- An SSO user will not be able to update or reset their password since the company administrator manages their access via the identity provider.
- If an SSO user with the following email of `alice@foocorp.com` attempts to sign in with a GitHub account that uses the same email, a separate Supabase account is created and will not be linked to the SSO user's account.
- SSO users will only see organizations/projects they've been invited to or auto-joined into. See [access control](/docs/guides/platform/access-control) for more details.

## Enabling SSO for an organization

- Review the steps above to configure your setup.
- Invite users to the organization and ensure they join with their SSO linked account.
- If a user is already a member of the organization under a non SSO account, they will need to be removed and invited again for them to join under their SSO account.

<Admonition type="note">

**No automatic linking:** Each user account verified using a SSO identity provider will not be automatically linked to existing user accounts in the system. That is, if a user `valid.email@supabase.io` had signed up with a password, and then uses their company SSO login with your project, there will be two `valid.email@supabase.io` user accounts in the system.

Users will need to ensure they are logged in with the correct account when accepting invites or accessing organizations/projects.

</Admonition>

## Disabling SSO for an organization

If you disable the SSO provider for an organization, **all SSO users will immediately be unable to sign in**. Before disabling SSO, ensure you have at least one non-SSO owner account to prevent being locked out.

## Removing an individual SSO user's access

To revoke access for a specific SSO user without disabling the provider entirely you may:

- Remove or disable the user's account in your identity provider
- Downgrade or remove their permissions for any organizations in Supabase.
