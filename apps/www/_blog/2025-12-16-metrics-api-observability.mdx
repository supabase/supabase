---
title: 'Own Your Observability: Supabase Metrics API'
description: 'Stream your Supabase database telemetry into any Prometheus-compatible observability stack with the Metrics API. Full control over monitoring, visualization, and alerting.'
author: steven_eubank
imgSocial: 2025-12-16-metrics-api-observability/og.png
imgThumb: 2025-12-16-metrics-api-observability/thumb.png
categories:
  - product
tags:
  - observability
  - metrics
  - prometheus
  - monitoring
date: '2025-12-16'
toc_depth: 2
---

We've published [enhanced documentation for the Metrics API](https://supabase.com/docs/guides/telemetry/metrics) so that you can stream your Supabase database telemetry into any Prometheus-compatible observability stack. Whether you use Grafana Cloud, Datadog, AWS Managed Prometheus, or a self-hosted setup, the Metrics API gives you full control over how you monitor, visualize, and alert on your database infrastructure.

## Why export your metrics?

Supabase Studio includes built-in observability dashboards. They work well for quick health checks. But production systems rarely exist in isolation.

Your application probably already has an observability stack. APM traces flow into Datadog. Application logs land in Grafana Loki. Infrastructure metrics feed Prometheus. When your database metrics live in a separate silo, you lose context. You cannot correlate a spike in API latency with database connection saturation. You cannot overlay query performance against deployment events.

The Metrics API fixes this. It exposes roughly 200 Postgres performance and health metrics in Prometheus exposition format. One scrape job. One unified view of your entire stack.

## What the Metrics API exposes

Every Supabase project has a metrics endpoint:

```
https://<project-ref>.supabase.co/customer/v1/privileged/metrics
```

Authentication uses HTTP Basic Auth with your service role credentials. The endpoint emits metrics covering:

- **CPU and memory utilization.** Track resource pressure before it becomes a problem.

- **Disk I/O and WAL statistics.** Identify storage bottlenecks and replication lag.

- **Connection pool metrics.** Monitor Supavisor and Postgres connection saturation.

- **Query performance data.** Catch slow queries and index regressions.

The full metric set refreshes every minute. Scrape it once per minute to stay in sync.

## Prometheus native, vendor agnostic

We chose Prometheus exposition format deliberately. It is the lingua franca of cloud-native observability. This single decision unlocks compatibility with:

- **Grafana Cloud.** Their managed Prometheus instance scrapes your endpoint directly. Works on Free and Pro tiers.

- **Datadog.** Configure the Datadog Agent with OpenMetrics integration, or use Prometheus remote write.

- **AWS Managed Prometheus (AMP).** Native AWS integration for teams already in that ecosystem.

- **Grafana self-hosted.** For teams running their own metrics storage.

- **Any Prometheus-compatible backend.** If it speaks PromQL, it works with Supabase.

This is what playing well with open standards looks like. We do not lock your telemetry into a proprietary format. You own your data. You choose your tools.

## What to monitor

With 200 metrics available, where do you start? Here are the signals and [alerts](https://github.com/supabase/supabase-grafana/blob/main/docs/example-alerts.md) that matter most:

- **Connection saturation.** Monitor active connections against your pool limits. Alert before you hit the ceiling.

- **CPU and memory pressure.** Sustained high utilization indicates workload growth or inefficient queries. Correlate with slow query logs to find the culprit.

- **Disk I/O wait.** High I/O wait times suggest storage bottlenecks. This often points to missing indexes or queries that scan too much data.

- **Replication lag.** If you use read replicas, monitor lag to ensure consistency. Alert when lag exceeds acceptable thresholds.

- **Spikes in client connections.** If you see connection metrics crowding your limits or frequent saturation, review how your applications connect. Consider using the [dedicated pooler](https://supabase.com/docs/guides/database/connecting-to-postgres#dedicated-pooler) (PgBouncer) with sane pool sizes instead of many direct connections, especially for chatty or bursty workloads.

- **Spiky workloads.** You may find that you are running periodic jobs during peak traffic hours, use the charts to determine if these spikes are within acceptable bounds or if you could optimise your job scheduling.

- **Development and Maintenance.** Were you running an expensive query on every page load of your app? Use the time range filters to confirm if your optimisations have improved performance and reduced strain on your instance.

## Build alerting that matters

Metrics without alerts are just pretty graphs. The real value comes from automated detection.

- **Right-sizing alerts.** Trigger when CPU or memory consistently exceeds 80% utilization. This gives you time to upgrade before users notice degradation.

- **Saturation alerts.** Fire when connection pools approach capacity. A few minutes of warning lets you investigate before connections start failing.

- **Index regression alerts.** Monitor query performance metrics after deployments. Catch missing indexes before they slow down production traffic.

- **Anomaly detection.** Tools like Datadog can learn normal patterns and alert on deviations. This catches problems you did not anticipate.

- Some more example configurations for alerts on database down, replication lag, and database size can be found in our [GitHub repo](https://github.com/supabase/supabase-grafana/blob/main/docs/example-alerts.md).

## Open source all the way down

The Metrics API reflects how we think about infrastructure. Supabase is built on open source: Postgres, PostgREST, GoTrue, Realtime. Our observability follows the same philosophy.

Prometheus exposition format is an open standard. The `supabase-grafana` repository is MIT licensed. You can fork it, modify it, run it anywhere. No vendor lock-in. No proprietary agents. No data trapped in systems you do not control.

When you outgrow Grafana Cloud, migrate to self-hosted Mimir. When your team standardizes on Datadog, reconfigure the scrape target. Your metrics remain portable because we chose open standards from the start.

## Start monitoring today

The Metrics API is available now on all hosted Supabase projects. Check the [updated documentation](https://supabase.com/docs/guides/telemetry/metrics) for integration guides covering:

- Grafana Cloud setup

- Self-hosted Prometheus configuration

- Datadog Agent integration

- Vendor-agnostic options

You will also notice a new banner in Studio's Observability views. It surfaces these options directly in the interface, making it clear that built-in dashboards are just one choice among many.

Share your dashboards online and tag us on Twitter. We love the inspiration that comes from a cool dashboard layout.
