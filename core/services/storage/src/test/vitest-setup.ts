import { getConfig, setEnvPaths } from '../config'

setEnvPaths(['.env.test', '.env'])

interface OTelGlobalState {
  __otelMetricsShutdown?: () => Promise<void>
  __otelTracingShutdown?: () => Promise<void>
}

beforeEach(() => {
  getConfig({ reload: true })
})

afterAll(async () => {
  const otelGlobalState = globalThis as typeof globalThis & OTelGlobalState
  const shutdownOtelTracing = otelGlobalState.__otelTracingShutdown
  const shutdownOtelMetrics = otelGlobalState.__otelMetricsShutdown

  if (shutdownOtelTracing) {
    await shutdownOtelTracing()
  }

  if (shutdownOtelMetrics) {
    await shutdownOtelMetrics()
  }
})
