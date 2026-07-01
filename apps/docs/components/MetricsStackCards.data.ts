export type MetricsStackOption = {
  title: string
  description: string
  href: string
  iconKind: 'grafana' | 'datadog' | 'flame'
  iconColor: string
  iconBg: string
  badges: { label: string; variant: 'default' | 'community' }[]
}

export const metricsStackOptions: MetricsStackOption[] = [
  {
    title: 'Grafana Cloud (SaaS)',
    description:
      'Use Grafana Cloud’s managed Prometheus (works on Free + Pro tiers) and import the Supabase dashboard without running any infrastructure.',
    href: '/guides/telemetry/metrics/grafana-cloud',
    iconKind: 'grafana',
    iconColor: '#F05A28',
    iconBg: 'rgba(240,90,40,0.1)',
    badges: [{ label: 'Supabase guide', variant: 'default' }],
  },
  {
    title: 'Grafana + self-hosted Prometheus',
    description:
      'Run Prometheus yourself following the official installation guidance and pair it with Grafana plus our dashboard JSON and alert pack.',
    href: '/guides/telemetry/metrics/grafana-self-hosted',
    iconKind: 'grafana',
    iconColor: '#F05A28',
    iconBg: 'rgba(240,90,40,0.1)',
    badges: [{ label: 'Supabase guide', variant: 'default' }],
  },
  {
    title: 'Datadog',
    description:
      'Scrape the Metrics API with the Datadog Agent or Prometheus remote write and monitor Supabase alongside your app telemetry.',
    href: 'https://docs.datadoghq.com/integrations/supabase/',
    iconKind: 'datadog',
    iconColor: '#632CA6',
    iconBg: 'rgba(99,44,166,0.1)',
    badges: [{ label: 'Community', variant: 'community' }],
  },
  {
    title: 'Vendor-agnostic / BYO Prometheus',
    description:
      'Connect AWS AMP, Grafana Mimir, VictoriaMetrics, or any Prometheus-compatible SaaS with the same scrape job pattern.',
    href: '/guides/telemetry/metrics/vendor-agnostic',
    iconKind: 'flame',
    iconColor: '#0BA678',
    iconBg: 'rgba(11,166,120,0.1)',
    badges: [{ label: 'Supabase guide', variant: 'default' }],
  },
]
