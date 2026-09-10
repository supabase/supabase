---
title: 'Build "Sign in with Your App" using Supabase Auth'
description: 'Supabase Auth now supports OAuth 2.1 and OpenID Connect server capabilities, turning your project into a full-fledged identity provider for AI agents, third-party developers, and enterprise SSO.'
author: cemal_kilic
imgSocial: 2025-12-04-oauth2-provider/og.png
imgThumb: 2025-12-04-oauth2-provider/thumb.png
categories:
  - product
tags:
  - auth
  - oauth
  - security
  - launch-week
date: '2025-12-04'
toc_depth: 2
---

You've used "Sign in with Google" and "Sign in with GitHub" countless times. But what if your Supabase project could be the identity provider? Today, we're adding OAuth 2.1 and OpenID Connect server capabilities to Supabase Auth, turning your project into a full-fledged identity provider.

This opens up powerful new possibilities: AI agents authenticating through your app via the Model Context Protocol (MCP), third-party developers building on your platform, partner integrations accessing your APIs securely, and enterprise single sign-on. All using the same battle-tested auth infrastructure you already rely on.

## Why We Built This

The immediate catalyst? **Model Context Protocol (MCP) authentication**. As AI agents and LLM tools become ubiquitous, they need a standardized way to authenticate with services. MCP has emerged as that standard, and it's built on OAuth 2.1. Your Supabase project can now be the identity provider these AI tools authenticate against.

But the applications extend far beyond AI:

- **Third-party developer ecosystems** - Let partners build apps that integrate with your platform
- **Partner API access** - Grant secure access to external services
- **"Powered by [Your App]"** - Enable users to use their existing account on your platform to sign into partner applications
- **Enterprise SSO** - Full OpenID Connect support with ID tokens, UserInfo endpoint, and organizational single sign-on

If you're building a platform where other developers or services need secure access to user data, OAuth 2.1 server capabilities are now baked into your Supabase project.

## What You Can Build

With Supabase Auth as an OAuth 2.1 provider, you can:

**For AI and Automation:**

- MCP servers that authenticate users through your Supabase project
- AI agents that securely access user data with proper authorization
- LLM tools integrated into your application ecosystem

**For Developer Platforms:**

- Third-party apps offering "Sign in with [Your App]"
- Partner integrations with granular access control
- Developer API access with OAuth tokens
- Marketplace apps built on your platform

**For Enterprise:**

- OpenID Connect single sign-on (SSO) with ID tokens and UserInfo endpoint
- Centralized identity management across services
- Standards-compliant enterprise authentication
- Compliance-friendly audit trails

## How It Works: The Big Picture

Supabase Auth implements **OAuth 2.1 with OpenID Connect** (OIDC), the modern, secure standards for authentication and identity. At its core is the authorization code flow with PKCE (Proof Key for Code Exchange).

The implementation uses the authorization code flow, the most secure OAuth flow for server-side apps and native applications. PKCE protects against authorization code interception attacks. Access tokens are JWTs containing standard Supabase claims (`user_id`, `role`) plus OAuth-specific claims like `client_id`. For OpenID Connect flows, clients also receive ID tokens, standardized identity tokens with user profile information, and can access the UserInfo endpoint to retrieve user data. Refresh tokens enable long-lived sessions without re-authentication, while the JWKS endpoint provides public key infrastructure for third parties to validate tokens.

The best part? Your existing Supabase security model extends naturally to OAuth: **Row Level Security (RLS) policies apply to OAuth access tokens** just like they do to regular session tokens.

## Works with Your Existing Auth Stack

One of the most powerful aspects of this implementation is how seamlessly it integrates with Supabase Auth features you're already using. When users authenticate through the OAuth flow, you can use all of Supabase Auth's existing methods: password authentication, magic links, social providers (Google, GitHub, etc.), multi-factor authentication (MFA), and phone authentication. Your third-party integrations get the benefit of your existing authentication security without you having to rebuild anything.

Already using [Custom Access Token Hooks](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook) to add custom claims to user tokens? They work with OAuth tokens too. You can inject client-specific claims, add custom permissions, or implement any token customization logic you need. The flexibility you have with regular auth tokens extends to OAuth.

Your RLS policies automatically apply to OAuth access tokens. The tokens include the standard `user_id` and `role` claims you're used to, plus a `client_id` claim that identifies which OAuth client is making the request.

This means you can grant different OAuth clients access to different subsets of user data:

```sql
-- Grant your mobile app access to user profiles
CREATE POLICY "Mobile app can read profiles"
ON profiles FOR SELECT
USING (
  (auth.uid() = user_id)
  AND
  ((auth.jwt() ->> 'client_id') = 'mobile-app-client-id')
);

-- Grant a third-party analytics dashboard read-only access to metrics
CREATE POLICY "Analytics dashboard can read metrics"
ON user_metrics FOR SELECT
USING (
  (auth.uid() = user_id)
  AND
  ((auth.jwt() ->> 'client_id') = 'analytics-dashboard-client-id')
);
```

## MCP Authentication

Supabase Auth fully complies with the Model Context Protocol's OAuth 2.1 authentication spec. Your Supabase project exposes standard OAuth authorization server metadata at `/.well-known/oauth-authorization-server`, enabling automatic discovery of your authorization endpoints, token endpoints, and capabilities. MCP clients can register themselves dynamically using OAuth 2.1 dynamic client registration (no manual configuration required).

Here's what this means in practice: point an MCP-compatible AI tool at your Supabase project's auth URL, and it handles the rest. The tool discovers your endpoints, registers itself as a client, initiates the OAuth flow, and obtains tokens. The AI agent authenticates as the user, with all your RLS policies enforced automatically. Users see your consent screen, approve access, and the AI tool operates on their behalf, with exactly the permissions you've defined. No passwords exposed, no custom API wrappers needed.

We're just getting started with MCP. **We're working on making it even easier to build MCP servers directly in Supabase**, bringing the same developer experience you love to AI agent integrations.

## Getting Started

Setting up OAuth 2.1 in your Supabase project starts with registering OAuth clients through the Supabase dashboard or Management API. You'll configure their allowed redirect URIs and receive a `client_id`. Then you'll build your authorization flow, an endpoint that receives OAuth authorization requests, authenticates users (using existing Supabase Auth methods), presents a consent UI, and confirms approvals with Supabase Auth.

Update your Row Level Security policies to handle OAuth clients appropriately, deciding which data third-party apps can access and what remains user-only. Third-party apps validate tokens using your public JWKS endpoint, no shared secrets required. They can verify tokens asymmetrically using standard OAuth 2.1 libraries.

Complete documentation with code examples is available in our [OAuth 2.1 guide](https://supabase.com/docs/guides/auth/oauth-server).

## OpenID Connect Support

Beyond OAuth 2.1, Supabase Auth now includes full OpenID Connect (OIDC) support, making it perfect for enterprise single sign-on and standardized identity integrations.

When authenticating with OIDC, clients receive an ID token alongside the access token. This standardized JWT contains user profile information and is signed by your Supabase project, allowing third parties to verify user identity without additional API calls. Your project also exposes the standard OIDC UserInfo endpoint, providing a secure way for clients to retrieve user profile information using their access token, enabling seamless integration with enterprise identity systems and standard OIDC libraries.

Your project automatically exposes an OIDC discovery endpoint at `/.well-known/openid-configuration`, making integration with enterprise tools and standard OIDC clients straightforward. Point an enterprise SSO system at your Supabase project, and it discovers everything it needs to integrate. This makes Supabase Auth a complete identity provider solution, compatible with any OIDC-compliant application or service.

## What's Next

We're continuing to expand OAuth capabilities. Granular scopes are coming soon, allowing clients to request specific permissions rather than full user access (`scope=read:profile read:metrics`). We're making it even easier to build and deploy MCP servers directly in Supabase, bringing AI agent authentication into the same seamless developer experience you already know.

We're building this in the open. The [GitHub discussion](https://github.com/orgs/supabase/discussions/38022) is active, share your use cases and help shape the roadmap.

## Try It Today

OAuth 2.1 and OpenID Connect capabilities are now available in Supabase Auth. Get started:

- [Read the documentation](https://supabase.com/docs/guides/auth/oauth-server)
- [View the GitHub discussion](https://github.com/orgs/supabase/discussions/38022)
- [Join the Discord](https://discord.supabase.com/) to share what you're building

Whether you're building an MCP server for AI agents, implementing enterprise SSO with OpenID Connect, creating a developer platform, or just want to offer "Sign in with [Your App]", Supabase Auth now has you covered.

<div className="video-container">
  <iframe
    className="w-full"
    src="https://www.youtube-nocookie.com/embed/tXpk8XUSguE"
    title="Supabase Auth OAuth 2.1 Provider"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  />
</div>
