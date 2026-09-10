---
title: 'Supabase Security Suite'
description: 'Learn how to use range columns in Postgres to simplify time-based queries and add constraints to prevent overlaps.'
author: paul_copplestone
imgSocial: security-suite/hardening-og.png
imgThumb: security-suite/hardening-thumb.png
categories:
  - product
tags:
  - security
date: '2024-07-11'
toc_depth: 3
---

Over the past 3 months, the team has been focused on **security**, **performance**, and **stability**. This is always part of our mandate, but for this period we have been _exclusively_ focused on this task.

And we haven't been alone with security. [@xyzeva](https://x.com/xyz3va/) (Eva), a rising star in the world of security, has been instrumental in the past 3 months - everything from discovering misconfigured projects to collaborating on fixes and features.

This post outlines the key initiatives that we have collaborated on and a few more in the pipeline.

## Learning from our peers

Eva and her colleagues are the authors of [Firewreck](https://env.fail/posts/firewreck-1/), which exposed the misconfiguration of Firebase instances. This [HN comment](https://news.ycombinator.com/item?id=39743225) highlights the key challenges for Firebase (paraphrased):

> .. First, security rules as implemented by Firebase are still a novel concept.

> .. Second, without the security of obscurity created by random in-house implementations of backends, scanning en masse becomes easier.

> .. Finally, security rules are just hard.

>

And then an important technical distinction:

> Technically there is nothing wrong with the Firebase approach but ... it opens itself up to misunderstanding, improper use, and issues like this.

## Supabase's approach

Security is a [Shared Responsibility Model](https://supabase.com/docs/guides/platform/shared-responsibility-model). The more control you are given with a technology, the more opportunity you have to make a mistake.

We believe that we can give developers full control of their tools, while _also_ being the most secure platform to develop with. How?

- By providing security tooling, baked deeply into our platform.
- By leaning into existing standards like Postgres Row Level Security (RLS), instead of using custom systems.

## Security tools and guides

This post consolidates the tools and guides that we have available for the community.

### Lunchcat

Eva has added support for Supabase in [Lunchcat](https://lunchcat.dev/), the AI-Powered security company she works for. Parts of this tooling is available for [self-hosting](https://github.com/lunchcat/sif) today, and will be available as an integration once their platform is publicly available.

### Security Advisor

We launched our [Security Advisor](https://supabase.com/blog/security-performance-advisor) in the last Launch Week. Eva was a big contributor to this, helping to set up a robust set of [security rules](https://supabase.com/docs/guides/database/database-advisors). These rules are available in [the Dashboard](https://supabase.com/dashboard/project/_/advisors/security), many with one-click solutions.

### Security emails and notifications

The security rules in our Security Advisor are run against all of your projects and project owners now receive weekly emails with a list of security issues that need to be solved. Since all of the advisories are [open source](https://github.com/supabase/splinter), you can also use them inside your CI/CD pipeline.

### Disabling the default Data API

We have made it even easier to turn off the Data API if you don’t plan to use it. When you launch a project you can choose whether you want to create it with _only_ Postgres connections, or if you also want the Data API. You can also turn off the Data API at any time in your [project settings](https://supabase.com/dashboard/project/_/settings/api).

### API hardening

We have made it simple to switch the default schema from `public` to `api` in the [API Settings page](https://supabase.com/dashboard/project/_/settings/api). We have also released a guide for [Hardening the Data API](https://supabase.com/docs/guides/database/hardening-data-api), outlining various approaches for using the Data API. It’s very likely that we will make this the default set up in the future to align with PostgREST’s [Schema Isolation](https://docs.postgrest.org/en/v12/explanations/schema_isolation.html) guide.

### Column level security

We’ve added [guides](https://supabase.com/docs/guides/database/postgres/column-level-security) and a [simple-to-use dashboard](https://supabase.com/dashboard/project/_/database/column-privileges) for column-level grants. This allows you to manage Postgres [grants](https://www.postgresql.org/docs/current/sql-grant.html) for every role (including the default Supabase `anon` and `service_role`). Combining this with RLS gives you extremely fine-grained control of your database.

### User impersonation

We have added [User/Role impersonation](https://supabase.com/blog/studio-introducing-assistant) to the Dashboard. You can use this to switch between anonymous and authenticated roles, or even go as deep as selecting an individual user (if you use Supabase Auth) to see the level of data that they use.

### RLS AI Assistant

RLS policies are even easier with our new GPT-4o powered [AI Assistant](https://github.com/orgs/supabase/discussions/21882). We want Row Level Security to be easier than any other security tool on the market. We have added a ton of [tests](https://github.com/supabase/supabase/blob/master/packages/ai-commands/src/sql/rls.test.ts) to ensure that we have the most accurate Postgres RLS assistant available, for free.

### Network Restrictions

You can [restrict access](https://supabase.com/docs/guides/platform/network-restrictions) to your database at the network level for any direct access to your database. This is especially useful when you’re getting started and only want to give direct access to your own IP address.

### And more

Our docs are full of best practices and useful info:

- [Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Shared responsibility model](https://supabase.com/docs/guides/platform/shared-responsibility-model)
- [Maturity model](https://supabase.com/docs/guides/platform/maturity-model)

## Misconceptions and bad practices

Since we see a few common complaints about Row Level Security, we figured we would address them.

- _“It’s unsafe to communicate from the browser directly to the database.”_

  The Database-centric approach is a three-tier architecture, the same as any other tool like NodeJs, Django, or RoR. The key difference is that you write your security rules in the SQL. It is also a different “workflow” from a three-tier approach, where traditionally you write authorization rules as part of your middleware rather than when you are setting up your database.

  Supabase is **agnostic** which approach you take. If SQL makes you uncomfortable, you can use the Postgres server we provide just like any other Postgres service.

<div>
  <Img
    alt="multi database"
    src={{
      light: '/images/blog/security-suite/traditional-vs-db-centric-architecture--light.png',
      dark: '/images/blog/security-suite/traditional-vs-db-centric-architecture--dark.png',
    }}
  />
</div>

- _“I turned off RLS while prototyping.”_

  By default, Supabase enables RLS for all tables created via the dashboard. Some developers disable this while they are prototyping which is not recommended. The best way to solve this is to use our [CLI for Local Development](https://supabase.com/docs/guides/cli). The CLI provides the entire Supabase stack, directly on your local development machine.

- _"I forgot to enable RLS."_

  Our dashboard has copious warnings when you have disabled RLS for any table. We also surface this in the Security Advisor, warnings via email and dashboard notifications.

That said, there are some legitimate difficulties with RLS - it’s not a silver bullet by any means. We are planning a lot more tooling to make this easier for Postgres and Supabase developers.

## Future developments

This is just the beginning of our tooling efforts, with many more ideas in the pipeline. We have hired dedicated security engineers to continue working on these initiatives, including:

- _Improved Security Advisor_

  As we continue to discover misconfigurations and potential vulnerabilities we will continue to improve the suite of security [rules](https://github.com/supabase/splinter) that we enable across our entire fleet of database.

- _Network restrictions 2.0_

  Networking should be as easy as using the database in Supabase. We’ve got a tonne of plans for this: network peering, [Tailscale](https://tailscale.com/) integration, better API Key management, fine-grained restrictions for each service and project scoped roles.

- _OpenAPI management_

  We will be giving developers the ability to control the visibility of the OpenAPI spec based on the Postgres roles and grants. This provides some level of security through obscurity.

- _Development on "Hard mode"_

  Not all projects are alike. While some require extremely strict levels of access, others can be a bit more relaxed. This is explained in our [Maturity Models](https://supabase.com/docs/guides/platform/maturity-model) framework. We are brainstorming ways to codify this, so that developers can “turn up” the enforced security levels on their projects, restricting what developers can and cannot do.

- _CI/CD warnings_

  We will be adding the [Security Advisories](https://github.com/supabase/splinter) into our CLI for first-class support within GitHub Actions and CI/CD pipelines. Combined with [Branching](https://supabase.com/docs/guides/platform/branching), this prevents security misconfigurations before they ever reach production.

- _Revamped API keys_

  Soon we will be replacing the `anon` and `service_role` API keys with a simpler `public` and `admin` key. This new setup will be conceptually similar, but will allow developers to create more fine-grained authorization rules and allow them to roll individual keys in case of a leak.

## Supabase Responsible Disclosure Program

Eva approached us during our last Launch Week. While she was helping us with the Security Advisor she discovered a misconfiguration in one of our own applications using Supabase with [Lunchcat](https://lunchcat.dev/). We were able to solve this quickly by toggling off read access to the `anon` role and scanning the [access logs](https://supabase.com/docs/guides/platform/logs) to ensure no malicious actors had accessed the data.

At the time, we didn’t have the Security Advisor to help the developer discover the misconfiguration before publishing. The Supabase Security suite is being developed to prevent this ever occurring again - for us and for our customers.

But no platform is infallible: when tooling doesn’t work, we rely on our community to help discover and responsibly disclose any vulnerabilities. We are launching a private Vulnerability Disclosure Program today with HackerOne. We commit to transitioning to a public disclosure program in a month, once we iron out the initial kinks. If you cannot wait till then, use our [secret link](https://hackerone.com/ca63b563-9661-4ac3-8d23-7581582ef451/embedded_submissions/new) submit a report.

If you find any misconfigured projects, please let us know. We will work with those customers to ensure that they know about the issue and can solve it. If you are a security professional, we welcome your help to secure the Supabase community.

## Security Resources

- [Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Shared responsibility model](https://supabase.com/docs/guides/platform/shared-responsibility-model)
- [Maturity Model](https://supabase.com/docs/guides/platform/maturity-model)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) & [Column Level Security](https://supabase.com/docs/guides/database/postgres/column-level-security)
- [Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api) & [Hardening the Data API](https://supabase.com/docs/guides/database/hardening-data-api)
- [Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)
