import { describe, expect, it } from 'vitest'
import { isOtelMetricsReaderEnabled } from './otel-metrics-config'

describe('isOtelMetricsReaderEnabled', () => {
  it('matches the OTel metric reader creation gate', () => {
    expect(
      isOtelMetricsReaderEnabled({
        otelMetricsEnabled: false,
        otlpMetricsEndpoint: 'http://otel-collector:4317',
        prometheusMetricsEnabled: true,
      })
    ).toBe(false)
    expect(
      isOtelMetricsReaderEnabled({
        otelMetricsEnabled: true,
        prometheusMetricsEnabled: false,
      })
    ).toBe(false)
    expect(
      isOtelMetricsReaderEnabled({
        otelMetricsEnabled: true,
        otlpMetricsEndpoint: 'http://otel-collector:4317',
        prometheusMetricsEnabled: false,
      })
    ).toBe(true)
    expect(
      isOtelMetricsReaderEnabled({
        otelMetricsEnabled: true,
        prometheusMetricsEnabled: true,
      })
    ).toBe(true)
  })
})
