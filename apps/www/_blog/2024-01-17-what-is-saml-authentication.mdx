---
title: What is SAML? A practical guide to the authentication protocol
description: Learn what is SAML authentication, how it differentiates from SSO, SAML with Postgres, and more.
author: kangmingtay
imgSocial: what-is-saml/what-is-saml-og.png
imgThumb: what-is-saml/what-is-saml-thumb.png
categories:
  - engineering
tags:
  - supabase-engineering
date: '2024-01-17'
toc_depth: 3
---

In the digital landscape, ensuring secure access is paramount, and that's where Security Assertion Markup Language (SAML) steps in. In this post, we'll explore how SAML simplifies the complex process of verifying identities across different platforms.

## What is SAML?

As organizations scale, their HR and IT departments struggle to keep employee and identity records across various applications. Typically they use an identity provider, like GSuite, Microsoft Active Directory, or Okta, to consolidate all of their employee data and permissions in one place.

Using an **identity provider** allows them to easily automate the on-boarding and off-boarding processes for employees. Without an identity provider, adding or removing (typically called provisioning) access to 3rd-party applications for each employee can quickly turn into an administrative nightmare.

These 3rd-party applications, also known as **service providers,** have Single Sign On (SSO) integrated to allow users to sign into the app. For an identity provider to authenticate with a service provider, an authentication protocol needs to be established first. SAML (Security Assertion Markup Language) is one such protocol that helps to facilitate SSO between an identity provider and a service provider.

The SAML protocol uses the XML format to store encrypted data related to the authenticated user, also known as SAML assertions. Before the identity provider and the service provider can establish a successful SAML authorization flow, both providers need to exchange their public keys, which come in the form of an X.509 certificate. This allows the identity provider to verify the incoming SAML request and allows the service provider to verify the SAML response returned by the identity provider.

## SAML vs SSO

SAML and Single Sign-On (SSO) are integral components in the realm of authentication and access management, but each plays a distinct role.

SSO is a broader concept centered around simplifying user experiences by allowing access to multiple applications or services with a single set of credentials. Unlike SAML, SSO is not a protocol but a versatile approach that can be realized through various protocols, including SAML, OAuth, or OpenID Connect. Its scope extends beyond specific data exchange formats, aiming to streamline user logins across diverse systems. For example, a user signing into their Google account experiences SSO as they effortlessly access various Google services without the hassle of repeated logins. In essence, while SAML addresses secure data exchange for authentication, SSO encompasses a broader vision of user convenience and access management.

## How does SAML authentication work?

Here’s a story about how SAML is enabled between an application (Supabase) and its users (ACME Inc.).

Alice is a software engineer at ACME Inc. a Fortune 500 company that loves Postgres and Supabase. Recently, she joined the Innovation department to discover new avenues for growth. She sees this as an opportunity to build rapid prototypes with Supabase and persuades the management team to allow her team to use Supabase.

Management gives the green light and Alice reaches out to Supabase’s sales department and strikes a deal.

However, ACME Inc. has 1000 developers on payroll and a very demanding security team that mandates either SAML or OIDC Single Sign-On for all 3rd-party applications. They also use GSuite as their identity provider.

So Alice asks Supabase for this, and they help her set up SAML for ACME. But first, Supabase needs Alice to send over information about their identity provider. Alice chases down Bob, who’s in ACME’s IT department, and asks for help to enable Supabase.

Supabase and Bob need to exchange some information to establish a SAML Connection between Supabase and ACME’s GSuite system.

### What does Bob need from Supabase?

- An X.509 certificate that GSuite can use to identify SAML SSO requests as originating from Supabase.
- An Entity ID that uniquely identifies Supabase’s authentication system.
- An ACS URL, a callback API endpoint where GSuite will send SAML Responses for validation.
- A Site URL, where employees in GSuite can pick Supabase and get instant access to it.
- Supabase’s logo/icon so that the application shows up nicely in the list of 3rd-party apps approved by ACME.
- A list of mandatory attributes to be included in the SAML Assertion.
  - Usually email, name, department, phone, …

### What does Bob need from Alice?

The list of employees that should be able to access Supabase - so that Bob can get Supabase to show up to the correct people.

### What Supabase needs from Bob?

- An X.509 certificate that Supabase can use to identify SAML Responses as originating from ACME’s GSuite.
- An Entity ID that uniquely identifies ACME’s GSuite setup.
- ACME’s allowed email domains: acme.com, acme.org.
- A Redirect URL, where Supabase can redirect users attempting to sign in with `alice@acme.com` or `alice@acme.org` to log into GSuite.
- A Single Log-Out URL where Supabase can send log-out requests by ACME’s employees.
- A list of all attributes that ACME’s GSuite system will send to Supabase; specifically the attributes about the employee’s email, name, and groups (are they a developer or not).

### Summary

Both parties need to exchange almost the same information:

- X.509 certificates so that the systems trust each other.
- Entity IDs so that the systems know each other.
- URLs so that they can talk to each other.
- Information about the structure of data passing between them (attribute mappings).

## SAML Metadata XML

Since much of this information is tricky to communicate and requires manual input, there exists the SAML Metadata XML document which exposes _most_ but not all of the information. Both systems, the Identity Provider (GSuite) and the Service Provider (Supabase) each have their own SAML Metadata that needs to be exchanged.

Often this document is available publicly at a URL. Note though, that sometimes Identity Providers (typically Microsoft Active Directory) may not be accessible over the internet (as they’re behind a VPN) so a URL can’t be used and a file needs to be exchanged in that case. Service Providers may also be isolated in their network, so a file exchange is necessary here too, albeit uncommon.

Inside this XML document, you can find most of the information required by Bob and Supabase:

- X.509 certificate
- Entity ID
- ACS, SLO, Site URLs

However, both parties still need to agree over email about the email domains of ACME, and about the attributes that they have in their system.

First, Supabase and Bob exchange some of the information over email. Then Bob goes to GSuite and creates a new SAML Application.

Finally, once Bob registers ACME’s Identity Provider (GSuite), the connection is established and ACME employees can access Supabase — directly by visiting Supabase’s site (SP-initiated) or by picking it in the GSuite Applications menu (IdP-initiated).

This is how the SAML SP-initiated authorization flow looks like when Alice visits Supabase and enters her email to sign in with SAML SSO.

<Img
  src={{
    dark: '/images/blog/what-is-saml/saml-authentication-flow_dark.png',
    light: '/images/blog/what-is-saml/saml-authentication-flow_light.png',
  }}
  alt="How the SAML SP-initiated authorization flow looks like when Alice visits Supabase and enters her email to sign in with SAML SSO"
/>

In the IdP-initiated flow, the employee signs into GSuite first and selects the application to sign into from a list of allowed 3rd-party applications instead of being redirected from the service provider.

## SAML Authentication with Supabase

At Supabase, you can easily enable SAML for your project and use the signInWithSSO method to start the authentication flow. Both IdP-initiated and SP-initiated flows are supported. When a user signs in with SAML SSO, the JWT issued contains a unique ID to identify the identity provider. If you are already using Postgres on Supabase, this also ties in nicely with your existing row-level security (RLS) policies, since you can use that ID to restrict access to the data.

### SAML with Row Level Security

Combining SAML with Row-Level Security (RLS) allows for fine-grained control over data access, ensuring that users only interact with the specific data rows aligned with their roles or attributes. This improves security and helps meet regulatory requirements while allowing flexible adjustments to access permissions over time.

Since Supabase is “just Postgres”™, it enables us to easily leverage the power of RLS policies to restrict access to the data. You can access the user’s JWT claims by invoking the `auth.jwt()` function in your RLS policy. In the scenario provided above, this allows Supabase to restrict developers from ACME Inc. from inviting someone else outside of the company to join their Supabase organization.

For example, assuming we have a table to store all invited users in a Supabase organization:

```sql
create table invited_users (
  id uuid not null primary key,
  sso_provider_id uuid,
  email text,
  name text
);
```

We can create an RLS policy to enforce that a developer in ACME Inc. can only invite someone who is also a developer in the same company:

```sql
create policy "Can only invite developers in the same organization"
on invited_users
as restrictive
for insert
with check (
	sso_provider_id = (select auth.jwt()#>>'{amr,0,provider}')
);
```

## Conclusion

In this post, we took a deep dive into SAML, from understanding how organizations centralize employee data using identity providers to illustrating SAML integration through a real-world use case and a practical implementation of SAML in conjunction with Row-Level Security (RLS).

Supabase Auth currently supports [authenticating with SAML](https://supabase.com/docs/guides/auth/sso/auth-sso-saml) easily, setting it up takes less than an hour, so you can focus on shipping the core features of your product.

## More from the Auth team

- [Supabase Auth: Identity Linking, Hooks, and HaveIBeenPwned integration](https://supabase.com/blog/supabase-auth-identity-linking-hooks)
- [Supabase Auth: SSO, Mobile, and Server-side support](https://supabase.com/blog/supabase-auth-sso-pkce)
- [Supabase Auth docs](https://supabase.com/docs/guides/auth)

## More from Supabase engineering

- [Elixir clustering using Postgres](https://supabase.com/blog/elixir-clustering-using-postgres)
