import grpc from '@grpc/grpc-js'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { vi } from 'vitest'

describe.each(['METRICS', 'TRACES'] as const)('OTLP %s headers', (signal) => {
  beforeEach(() => {
    vi.stubEnv(
      'OTEL_EXPORTER_OTLP_HEADERS',
      'authorization=Bearer%20default,x-common=common%20value'
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  test.each([
    {
      name: 'decodes keys and values once, preserving literal plus signs',
      headers:
        ' %61uthorization = Basic%20dXNlcjpwYXNz%3D%3D ,x%2Dtenant=tenant%2C1%3Dvalue,x-percent=%2520,x-plus=a+b',
      expected: {
        authorization: 'Basic dXNlcjpwYXNz==',
        'x-tenant': 'tenant,1=value',
        'x-percent': '%20',
        'x-plus': 'a+b',
      },
    },
    {
      name: 'preserves raw equals signs and lets later values win',
      headers: 'authorization=Basic dXNlcjpwYXNz==,x-token=first,x-token=part1=part2==',
      expected: { authorization: 'Basic dXNlcjpwYXNz==', 'x-token': 'part1=part2==' },
    },
    {
      name: 'ignores malformed and empty entries while retaining valid headers',
      headers: ',broken,=value,empty=,space=   ,bad=%ZZ,%ZZ=value,x-good=ok,',
      expected: { 'x-good': 'ok' },
    },
    {
      name: 'uses common headers when signal headers are unset',
      headers: undefined,
      expected: {},
    },
  ])('$name', async ({ headers, expected }) => {
    vi.stubEnv(`OTEL_EXPORTER_OTLP_${signal}_HEADERS`, headers)
    const setMetadata = vi.spyOn(grpc.Metadata.prototype, 'set')
    const exporter =
      signal === 'METRICS'
        ? new OTLPMetricExporter({ url: 'http://127.0.0.1:4317' })
        : new OTLPTraceExporter({ url: 'http://127.0.0.1:4317' })

    try {
      expect(Object.fromEntries(setMetadata.mock.calls)).toEqual({
        authorization: 'Bearer default',
        'x-common': 'common value',
        ...expected,
      })
    } finally {
      await exporter.shutdown()
    }
  })
})
