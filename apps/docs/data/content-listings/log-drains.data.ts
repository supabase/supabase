import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const logDrainsDestinations: ContentListingGroup = {
  id: 'log-drains-destinations',
  heading: 'Choose your destination',
  type: 'grid',
  columns: 3,
  items: [
    {
      title: 'Custom Endpoint',
      description: 'Forward logs as a POST request to any custom HTTP endpoint.',
      href: '/guides/telemetry/log-drains#custom-endpoint',
      icon: { kind: 'braces', color: '#3ECF8E', bg: 'rgba(62,207,142,0.1)' },
    },
    {
      title: 'OpenTelemetry (OTLP)',
      description: 'Send logs to any OTLP-compatible endpoint using Protocol Buffers over HTTP.',
      href: '/guides/telemetry/log-drains#opentelemetry-otlp',
      icon: { kind: 'otlp', color: '#F5A623', bg: 'rgba(245,166,35,0.1)' },
    },
    {
      title: 'Datadog',
      description: 'Stream logs directly into Datadog for monitoring and analysis.',
      href: '/guides/telemetry/log-drains#datadog',
      icon: { kind: 'datadog', color: '#632CA6', bg: 'rgba(99,44,166,0.1)' },
    },
    {
      title: 'Loki',
      description: 'Ingest logs into Grafana Loki using the HTTP push API.',
      href: '/guides/telemetry/log-drains#loki',
      icon: { kind: 'grafana', color: '#F05A28', bg: 'rgba(240,90,40,0.1)' },
    },
    {
      title: 'Amazon S3',
      description: 'Write batched log files directly to an S3 bucket you own.',
      href: '/guides/telemetry/log-drains#amazon-s3',
      icon: { kind: 'cloud', color: '#FF9900', bg: 'rgba(255,153,0,0.1)' },
    },
    {
      title: 'Sentry',
      description: "Send logs to Sentry's Logging product for filtering and grouping.",
      href: '/guides/telemetry/log-drains#sentry',
      icon: { kind: 'sentry', color: '#362D59', bg: 'rgba(54,45,89,0.1)' },
    },
    {
      title: 'Axiom',
      description: 'Forward logs to an Axiom dataset for storage and analysis.',
      href: '/guides/telemetry/log-drains#axiom',
      icon: { kind: 'axiom', color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
    },
    {
      title: 'Last9',
      description: 'Stream logs to Last9 for OpenTelemetry-native observability.',
      href: '/guides/telemetry/log-drains#last9',
      icon: { kind: 'last9', color: '#00B4A0', bg: 'rgba(0,180,160,0.1)' },
    },
    {
      title: 'Syslog',
      description: 'Forward logs to a remote Syslog receiver over TCP or TLS (RFC 5424).',
      href: '/guides/telemetry/log-drains#syslog',
      icon: { kind: 'server', color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
    },
  ],
}
