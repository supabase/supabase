---
title: 'Log Drains: Now available on Pro'
description: 'Supabase Pro users can now send their Supabase logs to their own logging backend, enabling them to debug in the same place as the rest of their stack.'
author: steven_eubank
date: '2026-03-05'
categories:
  - product
tags:
  - log-drains
  - observability
  - logging
imgSocial: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=announcement&layout=horizontal&copy=Log+Drains%3A%0ANow+available+on+Pro&icon=supabase.svg'
imgThumb: 'https://zhfonblqamxferhoguzj.supabase.co/functions/v1/generate-og?template=ruler&layout=icon-only&copy=Log+Drains+on+Pro&icon=icon-columns.svg'
toc_depth: 3
---

Today, we are launching Supabase Log Drains on the Supabase Pro tier. Supabase Pro users can now send their Supabase logs to their own logging backend, enabling them to debug in the same place as the rest of their stack.

When something breaks, you go to your logs. But your application does not stop at your application code. Behind every request is a Postgres query, an auth check, a storage operation, or an Edge Function invocation. Until today, Supabase logs remained in Supabase, separate from the tools where you debug everything else.

This separation costs you time. During an incident, you switch between your logging dashboard and the Supabase console, trying to correlate timestamps and piece together what happened. You build dashboards in Datadog or Grafana, but they only show half the picture.

Log drains eliminate this context switching. Your Postgres query errors appear next to your application exceptions. Your auth failures show up in the same timeline as your API errors. You build one dashboard that covers your entire stack.

## What makes Supabase log drains different

Supabase captures logs from every layer of your infrastructure, not just your application code:

- **Postgres.** Query execution, connection events, errors, and replication status.
- **API Gateway.** Request and response logs from PostgREST and GraphQL.
- **Auth.** Login attempts, token operations, MFA events, and session management.
- **Storage.** File uploads, downloads, transformations, and access patterns.
- **Edge Functions.** Function invocations, execution traces, and error details.
- **Realtime.** WebSocket connections, broadcast events, and presence updates.

This full-stack visibility is rare. Most platforms only export application-level logs, leaving you blind to what happens in the database layer.

Supabase also batches logs intelligently to protect your destination from being overwhelmed. We send up to 250 logs per batch or flush every second, whichever comes first. Gzip compression reduces bandwidth costs when your destination supports it.

## Who should use log drains

**Growing startups with production traffic.** Once you have real users, you need real observability. Log drains let you set up alerts for database errors, track auth patterns, and investigate incidents without leaving your existing tools. If you are scaling from prototype to production, this is when centralized logging becomes essential.

**Teams already using Datadog, Grafana, or Sentry.** You have dashboards, alerts, and runbooks built around your current observability stack. Log drains bring Supabase into that workflow instead of forcing you to learn a new tool. Your on-call engineers can investigate database issues in the same interface they use for everything else.

**Developers building AI applications.** AI workloads generate unpredictable traffic patterns and complex debugging scenarios. When an embedding query times out or a vector search returns unexpected results, you need to correlate Edge Function logs with Postgres execution plans. Log drains make this correlation possible in tools like Axiom or Datadog that handle high-volume, bursty traffic well.

**Platform teams managing multiple projects.** If you run Supabase projects for multiple products or clients, centralized logging reduces context switching. One Grafana dashboard can show the health of all your databases. One set of alerts can catch problems across your entire portfolio.

**Organizations with compliance requirements.** Some industries require long-term log retention in systems you control. Sending logs to S3 gives you a compliance-friendly archive at minimal cost. You own the data, you control the retention, and you can query it with Athena when auditors come calling.

## Supported destinations

Supabase sends logs in small batches over HTTP. Each destination has its own configuration, but setup takes a few minutes in the dashboard.

### Sentry

Send logs to Sentry. Search and filter Supabase logs next to your application errors and traces. Every log field becomes a filterable attribute with no cardinality limits.

Sentry recently launched their Structured Logs product with trace-connected logging. When you send Supabase logs to Sentry, your database errors appear in the same trace as your frontend exceptions. You can follow a slow query from the user-facing error it caused all the way back to the Postgres execution. This is particularly valuable if you already use Sentry for error tracking and want a unified debugging experience.

[Sentry setup guide](/docs/guides/platform/log-drains#sentry)

### Grafana Loki

Send logs to Grafana Loki. Query them with LogQL in your existing Grafana dashboards. Build visualizations that show Postgres query logs alongside your application metrics and infrastructure telemetry.

Loki works well for teams running Grafana for infrastructure monitoring. You can create alerts on specific error patterns, build log-based metrics for SLOs, and correlate database events with system metrics like CPU and memory. Stream labels automatically include the log source, so filtering by Postgres, Auth, Storage, or Edge Functions requires no additional configuration.

[Loki setup guide](/docs/guides/platform/log-drains#grafana-loki)

### Datadog

Send logs to Datadog. Use Log Management for search and dashboards. Connect logs to APM traces to see database calls in the context of distributed transactions.

Datadog excels at anomaly detection and ML-powered alerting. You can configure monitors that trigger when Postgres error rates spike or when auth failures exceed normal patterns. The integration works especially well for teams that want to trace slow API calls from their frontend through Supabase and into the database, seeing exactly where latency accumulates.

[Datadog setup guide](/docs/guides/platform/log-drains#datadog)

### AWS S3

Send logs to S3 for low-cost archival. Query historical data with Athena when you need to investigate incidents from weeks or months ago.

S3 is the most economical option for long-term retention. Store years of logs for pennies per gigabyte. This destination is useful for compliance requirements, post-incident analysis, or organizations that want to own their log data without paying for real-time indexing they rarely use.

[S3 setup guide](/docs/guides/platform/log-drains#amazon-s3)

### Axiom

Send logs to Axiom for fast searches across high-volume data without expensive indexing costs.

Axiom handles bursty, high-volume workloads well. If you run many Edge Functions or have database traffic that spikes unpredictably, Axiom provides real-time search without the per-GB costs adding up as quickly as traditional SIEM tools.

[Axiom setup guide](/docs/guides/platform/log-drains#axiom)

### Generic HTTP endpoint

Send logs to any HTTP endpoint when you need full control or when we do not have a preset for your vendor.

You can point logs at your own Edge Function to transform, filter, or route them. Some teams use this to enrich logs with business context before forwarding to a final destination. Others use it to split logs between multiple tools based on severity or source type.

[Generic HTTP endpoint setup guide](/docs/guides/platform/log-drains#generic-http-endpoint)

## How it works

You create a log drain in the Supabase Dashboard:

1. Open your project.
2. Go to **Project Settings**.
3. Click **Log Drains**.
4. Select a destination.
5. Enter the configuration for that destination.
6. Save.

Supabase sends logs in small batches over HTTP. Your vendor stores and indexes them. You can create multiple drains to send logs to different destinations simultaneously.

## Pricing

- $60 per drain per project
- $0.20 per million events
- $0.09 per GB egress

For full billing details, see the [usage guide](/docs/guides/platform/log-drains#pricing).

## Getting started

Read the log drains documentation, select a destination, and set up your first drain:

- [Log drains documentation](/docs/guides/platform/log-drains)
- [Usage and billing guide](/docs/guides/platform/log-drains#pricing)
