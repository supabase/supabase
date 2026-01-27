---
id: 'metrics-grafana-self-hosted'
title: 'Metrics API with Prometheus & Grafana (self-hosted)'
description: 'Deploy Prometheus and Grafana yourself to monitor Supabase metrics'
---

Self-hosting [Prometheus](https://prometheus.io/docs/prometheus/latest/installation/) and Grafana gives you full control over retention, alert routing, and dashboards. The Supabase Metrics API slots into any standard Prometheus scrape job, so you can run everything locally, on a VM, or inside Kubernetes.

<$Partial path="metrics_access.mdx" />

<Admonition type="note">

Grafana also documents a [Supabase integration reference](https://grafana.com/docs/grafana-cloud/monitor-infrastructure/integrations/integration-reference/integration-supabase/). While it targets Grafana Cloud, the scrape and agent settings apply equally to self-hosted clusters and offer a community-maintained companion to this guide.

</Admonition>

## Architecture

1. **Prometheus** scrapes `https://<project-ref>.supabase.co/customer/v1/privileged/metrics` every minute using HTTP Basic Auth.
2. **Grafana** reads from Prometheus and renders dashboards/alerts.
3. (Optional) **Alertmanager** or your preferred system sends notifications when Prometheus rules fire.

## 1. Deploy Prometheus

Install [Prometheus](https://prometheus.io/docs/prometheus/latest/installation/) using your preferred method (Docker, Helm, binaries). Then add a Supabase-specific job to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'supabase'
    scrape_interval: 60s
    metrics_path: /customer/v1/privileged/metrics
    scheme: https
    basic_auth:
      username: service_role
      password: '<secret API key (sb_secret_...)>'
    static_configs:
      - targets:
          - '<project-ref>.supabase.co:443'
        labels:
          project: '<project-ref>'
```

<Admonition type="tip">

- Keep the scrape interval at 60 seconds to match Supabase’s refresh cadence.
- If you run Prometheus behind a proxy, make sure it can establish outbound HTTPS connections to `*.supabase.co`.
- Store secrets (Secret API key) with your secret manager or inject them via environment variables.

</Admonition>

## 2. Deploy Grafana

Install Grafana (Docker image, Helm chart, or packages) and connect it to Prometheus:

1. In Grafana, go to **Connections → Data sources → Add data source**.
2. Choose **Prometheus**, set the URL to your Prometheus endpoint (for example `http://prometheus:9090`), and click **Save & test**.

## 3. Import Supabase dashboards

1. Go to **Dashboards → New → Import**.
2. Paste the contents of [`supabase-grafana/dashboard.json`](https://raw.githubusercontent.com/supabase/supabase-grafana/refs/heads/main/grafana/dashboard.json).
3. Select your Prometheus datasource when prompted.

You now have over 200 production-ready panels covering CPU, IO, WAL, replication, index bloat, and query throughput.

<img
  src="/docs/img/guides/platform/supabase-grafana-prometheus.png"
  alt="Supabase Grafana dashboard showcasing database metrics"
  className="mt-6 rounded-lg border border-foreground/10 shadow-sm"
/>

## 4. Configure alerting

- Import the sample rules from [`docs/example-alerts.md`](https://github.com/supabase/supabase-grafana/blob/main/docs/example-alerts.md) into Prometheus or Grafana Alerting.
- Tailor thresholds (for example, disk utilization, long-running transactions, connection saturation) to your project’s size.
- Route notifications via Alertmanager, Grafana OnCall, PagerDuty, or any other supported destination.

## 5. Operating tips

- **Multiple projects:** add one scrape job per project ref so you can separate metrics and labels cleanly.
- **Right-sizing guidance:** pair the dashboards with Supabase’s [Query Performance report](/dashboard/project/_/observability/query-performance) and [Advisors](/dashboard/project/_/observability/database) to decide when to optimize vs upgrade.
- **Security:** rotate Secret API keys on a regular cadence and update the Prometheus config accordingly.
