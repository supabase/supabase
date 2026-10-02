interface OTelMetricsReaderConfig {
  otelMetricsEnabled: boolean
  otlpMetricsEndpoint?: string
  prometheusMetricsEnabled: boolean
}

export function isOtelMetricsReaderEnabled(config: OTelMetricsReaderConfig): boolean {
  return (
    config.otelMetricsEnabled &&
    (config.prometheusMetricsEnabled || Boolean(config.otlpMetricsEndpoint))
  )
}
