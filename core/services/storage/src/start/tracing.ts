import { getConfig } from '../config'

if (getConfig().tracingEnabled) {
  // biome-ignore lint/style/noCommonJs: tracing must register sync before app
  require('../internal/monitoring/otel-tracing')
}
