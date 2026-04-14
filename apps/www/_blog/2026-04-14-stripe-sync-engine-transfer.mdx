---
title: "We're Transferring the Stripe Sync Engine to Stripe"
description: "We're transferring the Stripe Sync Engine from supabase/stripe-sync-engine to stripe/sync-engine"
author: raminder_singh, matt_linkous, gregor_vand, ana_mogul
imgSocial: stripe-sync-engine-transfer/og.png
imgThumb: stripe-sync-engine-transfer/thumb.png
categories:
  - company
tags:
  - stripe
  - postgres
  - open-source
date: '2026-04-14'
toc_depth: 2
---

In 2021, we open-sourced the Stripe Sync Engine repo to solve a problem we had ourselves. Billing data lived in Stripe, product data lived in Postgres, and there was no good way to join them. We built a tool to sync Stripe data into a `stripe` schema in Postgres, kept building it in the open, and it grew into something bigger than we expected.

Today, the repo moves from [`supabase/stripe-sync-engine`](https://github.com/supabase/stripe-sync-engine) to [`stripe/sync-engine`](https://github.com/stripe/sync-engine).

## How we got here

In December 2025, we announced a one-click integration that brought the Stripe Sync Engine directly into the Supabase dashboard. That launch came from close collaboration with Stripe's engineering team.

Stripe engineers contributed directly to the repo: incremental sync using cursor-based pagination, JSONB storage with generated columns, multi-account support for [Stripe Connect](https://stripe.com/connect) platforms, and a new CLI with proper event ordering.

A key part of that collaboration was Stripe's work on automatic, incremental backfilling using Supabase Cron and Queue. This is what made it possible to ingest all of your existing Stripe data into Postgres reliably and at scale, and what unlocked the dashboard integration.

Both teams kept iterating after launch on reliability, install flows, and expanded Stripe object support. The result is a more stable, more capable integration than either team would have shipped alone.

Moving the repo to `stripe/sync-engine` is the next step in that collaboration, and both teams will keep building it together. All our changes going forward will be made to the new `stripe/sync-engine` repo.

## What changes for you

The Stripe Sync Engine stays open source under the Apache 2.0 license. The `supabase/stripe-sync-engine` repo will redirect to `stripe/sync-engine`. Nothing breaks for existing users. The one-click integration in the Supabase dashboard continues to work as before.

This is how Supabase has always worked. We build in the open, support the tools and communities around us, and contribute back as things grow. We are proud to collaborate with companies like Stripe to deliver the best tech for builders.

## What's new

Alongside the transfer, the latest release includes improvements to reliability and day-to-day management.

New capabilities:

- Coupons sync, one of the most requested additions
- Branching support, so you can install the engine on a branch for safer dev workflows
- Data starts syncing immediately on install, no need to wait for the first cron cycle

Better management:

- One-click upgrades for existing installations
- SSL enforcement now supported (previously a blocker for projects with SSL enforcement turned on)
- Install and uninstall controls restricted to Admins and Owners to prevent partial installs

Reliability and UX:

- Smarter install flow: buttons auto-reset if a process gets stuck
- Clearer, more actionable error messages
- Edge Function source code now visible directly in the dashboard

## Get started

With your Stripe data in Postgres, you can join it directly with your application data. Useful for operational decisions like feature gating and subscription checks, and analytical queries like calculating MRR or understanding churn. For a full walkthrough with SQL examples, see [Sync Stripe Data to Your Supabase Database in One Click](https://supabase.com/blog/stripe-sync-engine-integration).

The Stripe Sync Engine is available from the [Integrations section of your Supabase dashboard](https://supabase.com/dashboard/project/_/integrations/stripe_sync_engine/overview). The repo is at [github.com/stripe/sync-engine](https://github.com/stripe/sync-engine).
