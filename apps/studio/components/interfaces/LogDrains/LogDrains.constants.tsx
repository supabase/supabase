import { components } from 'api-types'
import { Axiom, Datadog, Grafana, Last9, Otlp, Sentry } from 'icons'
import { BracesIcon, Cloud } from 'lucide-react'

const iconProps = {
  height: 24,
  width: 24,
  className: 'text-foreground-light',
}

export type LogDrainType = components['schemas']['CreateBackendParamsOpenapi']['type']

export const LOG_DRAIN_TYPES = [
  {
    value: 'webhook',
    name: 'Custom Endpoint',
    description: 'Forward logs as a POST request to a custom HTTP endpoint',
    icon: <BracesIcon {...iconProps} />,
  },
  {
    value: 'otlp',
    name: 'OpenTelemetry Protocol (OTLP)',
    description: 'Send logs to any OpenTelemetry Protocol (OTLP) compatible endpoint',
    icon: <Otlp {...iconProps} fill="currentColor" strokeWidth={0} />,
  },
  {
    value: 'datadog',
    name: 'Datadog',
    description: 'Datadog is a monitoring service for cloud-scale applications',
    icon: <Datadog {...iconProps} fill="currentColor" strokeWidth={0} />,
  },
  {
    value: 'loki',
    name: 'Loki',
    description:
      'Loki is an open-source log aggregation system designed to store and query logs from multiple sources',
    icon: <Grafana {...iconProps} fill="currentColor" strokeWidth={0} />,
  },
  {
    value: 's3',
    name: 'Amazon S3',
    description: 'Forward logs to an S3 bucket',
    icon: <Cloud {...iconProps} />,
  },
  {
    value: 'sentry',
    name: 'Sentry',
    description:
      'Sentry is an application monitoring service that helps developers identify and debug performance issues and errors',
    icon: <Sentry {...iconProps} fill="currentColor" strokeWidth={0} />,
  },
  {
    value: 'axiom',
    name: 'Axiom',
    description:
      'Axiom is a data platform designed to efficiently collect, store, and analyze event and telemetry data at massive scale.',
    icon: <Axiom {...iconProps} fill="currentColor" strokeWidth={0} />,
  },
  {
    value: 'last9',
    name: 'Last9',
    description: 'Last9 is an observability platform for monitoring and telemetry data',
    icon: <Last9 {...iconProps} fill="currentColor" strokeWidth={0} />,
  },
] as const

export const LOG_DRAIN_SOURCE_VALUES = LOG_DRAIN_TYPES.map((source) => source.value)

export const DATADOG_REGIONS = [
  {
    label: 'AP1',
    value: 'AP1',
  },
  {
    label: 'AP2',
    value: 'AP2',
  },
  {
    label: 'EU',
    value: 'EU',
  },
  {
    label: 'US1',
    value: 'US1',
  },
  {
    label: 'US1-FED',
    value: 'US1-FED',
  },
  {
    label: 'US3',
    value: 'US3',
  },
  {
    label: 'US5',
    value: 'US5',
  },
] as const

export const LAST9_REGIONS = [
  {
    label: 'US West 1',
    value: 'US-WEST-1',
  },
  {
    label: 'AP South 1',
    value: 'AP-SOUTH-1',
  },
] as const

export type LogDrainDatadogConfig = {
  api_key: string
  region: string
}

export type LogDrainWebhookConfig = {
  url: string
}

export const OTLP_PROTOCOLS = [{ label: 'HTTP/Protobuf', value: 'http/protobuf' }] as const

export type LogDrainOtlpConfig = {
  endpoint: string
  protocol?: string
  gzip?: boolean
  headers?: Record<string, string>
}
