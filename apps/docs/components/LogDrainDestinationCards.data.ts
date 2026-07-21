export type LogDrainDestinationOption = {
  title: string
  description: string
  href: string
  iconKind: 'braces' | 'otlp' | 'datadog' | 'grafana' | 'cloud' | 'sentry' | 'axiom' | 'last9' | 'server'
  iconColor: string
  iconBg: string
}

export const logDrainDestinationOptions: LogDrainDestinationOption[] = [
  {
    title: 'Custom Endpoint',
    description: 'Forward logs as a POST request to any custom HTTP endpoint.',
    href: '/guides/telemetry/log-drains#custom-endpoint',
    iconKind: 'braces',
    iconColor: '#3ECF8E',
    iconBg: 'rgba(62,207,142,0.1)',
  },
  {
    title: 'OpenTelemetry (OTLP)',
    description: 'Send logs to any OTLP-compatible endpoint using Protocol Buffers over HTTP.',
    href: '/guides/telemetry/log-drains#opentelemetry-otlp',
    iconKind: 'otlp',
    iconColor: '#F5A623',
    iconBg: 'rgba(245,166,35,0.1)',
  },
  {
    title: 'Datadog',
    description: 'Stream logs directly into Datadog for monitoring and analysis.',
    href: '/guides/telemetry/log-drains#datadog',
    iconKind: 'datadog',
    iconColor: '#632CA6',
    iconBg: 'rgba(99,44,166,0.1)',
  },
  {
    title: 'Loki',
    description: 'Ingest logs into Grafana Loki using the HTTP push API.',
    href: '/guides/telemetry/log-drains#loki',
    iconKind: 'grafana',
    iconColor: '#F05A28',
    iconBg: 'rgba(240,90,40,0.1)',
  },
  {
    title: 'Amazon S3',
    description: 'Write batched log files directly to an S3 bucket you own.',
    href: '/guides/telemetry/log-drains#amazon-s3',
    iconKind: 'cloud',
    iconColor: '#FF9900',
    iconBg: 'rgba(255,153,0,0.1)',
  },
  {
    title: 'Sentry',
    description: "Send logs to Sentry's Logging product for filtering and grouping.",
    href: '/guides/telemetry/log-drains#sentry',
    iconKind: 'sentry',
    iconColor: '#362D59',
    iconBg: 'rgba(54,45,89,0.1)',
  },
  {
    title: 'Axiom',
    description: 'Forward logs to an Axiom dataset for storage and analysis.',
    href: '/guides/telemetry/log-drains#axiom',
    iconKind: 'axiom',
    iconColor: '#6366F1',
    iconBg: 'rgba(99,102,241,0.1)',
  },
  {
    title: 'Last9',
    description: 'Stream logs to Last9 for OpenTelemetry-native observability.',
    href: '/guides/telemetry/log-drains#last9',
    iconKind: 'last9',
    iconColor: '#00B4A0',
    iconBg: 'rgba(0,180,160,0.1)',
  },
  {
    title: 'Syslog',
    description: 'Forward logs to a remote Syslog receiver over TCP or TLS (RFC 5424).',
    href: '/guides/telemetry/log-drains#syslog',
    iconKind: 'server',
    iconColor: '#64748B',
    iconBg: 'rgba(100,116,139,0.1)',
  },
]
