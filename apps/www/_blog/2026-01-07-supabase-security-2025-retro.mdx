---
title: 'Supabase Security Retro: 2025'
description: 'A summary of Supabase platform security changes made in 2025 and the security defaults planned for 2026.'
categories:
  - product
tags:
  - security
date: '2026-01-07'
toc_depth: 3
author: bilharmer,paul_copplestone
imgSocial: 2026/security-retro/social.png
imgThumb: 2026/security-retro/thumb.png
---

This post covers security changes made to the Supabase platform in 2025 and what to expect in 2026. Some changes may be breaking.

Postgres Row Level Security (RLS) is powerful but can be complex for developers new to the pattern. Most of the changes in 2025 focused on safer defaults and better tooling to make security more accessible.

We'll cover what shipped in 2025 and outline planned improvements for 2026.

## Disabling the Data API when creating a project

<Img
  alt="Disabling Data API on project creation"
  src="/images/blog/2026/security-retro/disable-data-api-create.png"
  captionAlign="bottom"
  zoomable={true}
/>

New projects can disable the Data API entirely or change the default schema from `public` to a custom schema like `api`. This gives you control over what's exposed via the auto-generated REST and GraphQL APIs.

## Disabling the Data API on existing projects

<Img
  alt="Disabling Data API in project settings"
  src="/images/blog/2026/security-retro/disable-data-api-settings.png"
  captionAlign="bottom"
  zoomable={true}
/>

Existing projects can disable the Data API in project settings. Once disabled, you can continue to use the database like standard Postgres (similar to RDS), connecting directly or through the connection pooler.

## New API keys

<Img
  alt="New API key management interface"
  src="/images/blog/2026/security-retro/api-keys.png"
  captionAlign="bottom"
  zoomable={true}
/>

The new API key model replaces long-lived JWT-based anon and service_role keys. Projects now use `publishable` keys for low-privilege access and multiple revocable `secret` keys for elevated access. Keys can be rotated instantly, audited, and scoped more granularly. This improves key management workflows, particularly around rotation and auditing. Legacy keys remain available during migration but will be removed in late 2026.

## Asymmetric JWTs

<Img
  alt="Asymmetric JWT signing flow"
  src="/images/blog/2026/security-retro/asymmetric-jwt.png"
  captionAlign="bottom"
  zoomable={true}
/>

The new API key system supports asymmetric JWTs (signed with private keys, verified with public keys). This enables safer key distribution and rotation compared to shared secrets. It also reduces the impact if a signing key is compromised.

## Revoking leaked keys via GitHub Secret Scanning

<Img
  alt="GitHub secret scanning and key revocation"
  src="/images/blog/2026/security-retro/github-scanning.png"
  captionAlign="bottom"
  zoomable={true}
/>

With the new API key formats, Supabase automatically revokes secret keys that are detected in public GitHub repositories. When a leak is detected, we immediately revoke the key and notify the project owner with instructions to rotate it.

## RLS by default for new tables

<Img
  alt="RLS enabled by default for new tables"
  src="/images/blog/2026/security-retro/rls-default.png"
  captionAlign="bottom"
  zoomable={true}
/>

For tables created via the dashboard, RLS is enabled by default. Tables are protected from the moment they're created, following the principle of secure by default.

## Automatically enable RLS when tables are created

<Img
  alt="Event trigger configuration for automatic RLS"
  src="/images/blog/2026/security-retro/auto-enable-rls.png"
  captionAlign="bottom"
  zoomable={true}
/>

If you create tables using external tools or migrations that don't enable RLS, you can use Postgres Event Triggers to enforce RLS automatically. We added Event Triggers to the platform in 2025, [documented](/docs/guides/database/postgres/event-triggers#example-trigger-function---auto-enable-row-level-security) how to set up automatic RLS enforcement for any table creation method, and added a one-click setup in the dashboard.

## Clear labels when tables are exposed

<Img
  alt="Clear labels when tables are exposed"
  src="/images/blog/2026/security-retro/unrestricted-tables.png"
  captionAlign="bottom"
  zoomable={true}
/>

The Table Editor now shows a clear warning label for any table that has RLS disabled. This makes it immediately obvious which tables are exposed via the API without row-level security policies.

## Security alerts for tables without RLS

<Img
  alt="Security alert for tables without RLS"
  src="/images/blog/2026/security-retro/security-alerts.png"
  captionAlign="bottom"
  zoomable={true}
/>

If you create any tables with RLS disabled, Supabase sends email alerts to project owners. These alerts also appear in the dashboard, making it easy to identify and secure tables before deploying to production.

## Security Advisors

<Img
  alt="Security Advisors weekly report"
  src="/images/blog/2026/security-retro/security-advisors.png"
  captionAlign="bottom"
  zoomable={true}
/>

Security Advisors scan your project for misconfigurations using [Splinter](https://supabase.github.io/splinter/), an open-source security linter for Postgres. Advisors check for common patterns like tables without RLS, policies that could be more restrictive, and exposed sensitive columns. Organization owners receive weekly security emails summarizing any findings. All detected issues are also visible in the dashboard with recommended fixes.

## Fixing security issues with AI

<Img
  alt="AI-powered security issue fixes"
  src="/images/blog/2026/security-retro/ai-security-fixes.png"
  captionAlign="bottom"
  zoomable={true}
/>

The dashboard includes an Assistant that helps fix security issues detected by Security Advisors. When viewing alerts, you can ask the Assistant to generate and apply RLS policies. Describe your security requirements in plain text and the Assistant will generate the corresponding policy SQL. The Assistant can also suggest improvements for policies and configurations. This helps developers write correct RLS policies more quickly.

Security Advisors are also available through our MCP server, allowing developers to scan and fix all security issues from their development environment with a simple command. This integrates security checks directly into your workflow.

## Column-level security

<Img
  alt="Column-level privilege configuration"
  src="/images/blog/2026/security-retro/column-security.png"
  captionAlign="bottom"
  zoomable={true}
/>

Postgres supports column-level privileges that restrict access to specific columns in a table. This is useful for sensitive data like social security numbers, salaries, or other PII. You can grant SELECT access to a table while excluding specific columns, and those columns won't appear in API responses or queries unless the user has explicit column access.

Column-level security works independently from RLS. You can use both together: RLS controls which rows a user can access, while column privileges control which columns they can see within those rows.

## Custom Claims and RBAC

<Img
  alt="Custom claims for RBAC"
  src="/images/blog/2026/security-retro/custom-claims.png"
  captionAlign="bottom"
  zoomable={true}
/>

[Custom claims](/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) let you add metadata to JWTs for role-based access control (RBAC). Instead of writing RLS policies for each table, you can embed role information in the authentication token and check it in your policies. This works well if you're migrating from traditional RBAC systems or prefer centralized role management.

## VPC / Private Link on AWS

<Img
  alt="AWS PrivateLink configuration"
  src="/images/blog/2026/security-retro/privatelink.png"
  captionAlign="bottom"
  zoomable={true}
/>

[PrivateLink](/docs/guides/platform/privatelink) connects your VPC directly to Supabase infrastructure without traversing the public internet. This reduces attack surface and improves latency. Enable it from the project settings in the dashboard.

## Restricting direct access to your Postgres database

<Img
  alt="IP allowlist configuration"
  src="/images/blog/2026/security-retro/ip-allowlist.png"
  captionAlign="bottom"
  zoomable={true}
/>

All Supabase databases run fail2ban to automatically block IPs after failed login attempts. You can also [configure IP allowlists](https://supabase.com/docs/guides/platform/network-restrictions) to restrict database access to specific trusted addresses.

## OpenAPI spec restricted with publishable keys

The OpenAPI spec is no longer publicly visible when using the new `publishable` keys. Previously, anyone with an anon key could view your complete API schema, including all tables and columns. With publishable keys, the OpenAPI spec requires elevated permissions. This prevents unauthorized schema enumeration and reduces information disclosure.

## Continuous Researcher Engagement: HackerOne VDP

Supabase runs continuous security testing using external researchers in both red team and purple team engagements. Red team testing is adversarial and unannounced. Purple team testing is collaborative and focuses on validating controls and isolation boundaries.

In addition to scheduled testing, we operate an active vulnerability disclosure program on HackerOne. Since launch, we have resolved 139 reports from 96 researchers. In the last 90 days, we received 42 reports. The most recent resolution was 13 days ago. This program runs continuously.

Response targets

- First response: 2 business days (median 8 hours)
- Triage: 5 business days (median 10 hours)
- Resolution: severity-dependent (median 2 days)

We prioritize fast responses because slow acknowledgment reduces researcher participation.

### Scope

The VDP covers Supabase platform infrastructure, including PostgREST exposure, authentication flows, service role isolation, Realtime subscriptions, Storage access controls, Edge Functions, and network segmentation. Researchers may only test their own projects. Automated scanning requires prior notice to security@supabase.io.

### Recognition and bounties

The program is currently recognition-only. Paid bounties will launch in 2026, scaled by severity and impact.

### Use of findings

Validated issues are not only patched. They feed into platform hardening, detection rules, and architectural reviews. For example, an auth bypass report triggers audits for similar patterns and often results in new automated checks.

This program complements scheduled testing by providing continuous external validation of the platform security boundaries. Supabase secures the platform. Application-level security remains the responsibility of each customer.

## What's next for 2026

Several security improvements are planned for this year:

#### Grant toggles for exposed schemas

A new UI control will allow you to toggle API access for individual tables directly from the dashboard. Instead of manually managing Postgres grants, you'll be able to enable or disable table access with a single click. This makes it easier to control exactly which tables are accessible via the Data API without needing to write SQL grant statements. This feature is currently in staging and undergoing extensive testing before production release.

<Img
  alt="Grant toggles for controlling table access"
  src="/images/blog/2026/security-retro/simplified-grants.png"
  captionAlign="bottom"
  zoomable={true}
/>

#### Alternative authorization patterns

We're exploring integrations with authorization systems like OpenFGA and Zanzibar for developers who need fine-grained permissions beyond RLS. Like everything else in Supabase, we're taking a Postgres-native approach. Community developers have already built Postgres extensions for alternative security models, like [supabase_rbac](https://database.dev/pointsource/supabase_rbac), which simplifies role-based access control. We're planning improved extension documentation and tighter dashboard integration to make these patterns more accessible.

#### GitHub push protection

Our leaked key detection currently uses GitHub's secret scanning API for post-commit detection. We're working with GitHub to add push protection, which will block commits containing secret keys before they reach the repository.

#### GraphQL disabled by default

pg_graphql will be disabled by default on new projects. You can still enable it manually if needed, but it won't be exposed automatically to reduce the attack surface.

#### Expanded Security Advisor lints

New security checks will be added to Splinter to detect more misconfigurations. This includes detecting weak password policies, excessive function privileges, and insecure extension configurations.

#### Hardened project configurations

New project configuration options will allow developers to choose extremely hardened security environments. This includes strict defaults for all security settings and mandatory security policies. Bring Your Own Cloud will be available to more customers beyond Supabase for Platforms.

#### Security-focused test harness

A dedicated test harness for security will help developers validate RLS policies, test authorization logic, and ensure security configurations are correct before deploying to production.

#### Assistant everywhere

The dashboard Assistant will be available in more locations. You'll be able to fix security issues directly from GitHub, Slack, and email recommendations, rather than needing to go to the dashboard. The Assistant will be integrated into your existing workflows.

#### Enhanced security alerts

Security alerts and recommendations will be enhanced with more detailed explanations of impact, step-by-step remediation guidance, and inline code examples to help developers resolve issues faster.
