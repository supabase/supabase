import { InstrumentationBase, InstrumentationConfig } from '@opentelemetry/instrumentation'
import { CollectorConfig, MetricCollector } from './base-collector'
import { CgroupCpuCollector } from './cgroup-cpu-collector'
import { CpuCollector } from './cpu-collector'
import { FileDescriptorCollector } from './file-descriptor-collector'
import { HandlesCollector } from './handles-collector'
import { ExternalMemoryCollector } from './memory-collector'
import { ProcessStartCollector } from './process-start-collector'

export interface StorageNodeInstrumentationConfig extends InstrumentationConfig, CollectorConfig {}

const DEFAULT_CONFIG: StorageNodeInstrumentationConfig = {
  prefix: '',
  labels: {},
}

/**
 * Custom Node.js runtime instrumentation that provides metrics
 * not covered by @opentelemetry/instrumentation-runtime-node:
 * - Event loop lag (setImmediate measurement)
 * - CPU usage (user, system, total)
 * - Active handles and requests
 * - Process start time
 * - External memory, ArrayBuffers, RSS
 * - File descriptors (open and max, Linux only)
 *
 * Use alongside RuntimeNodeInstrumentation for complete coverage.
 */
export class StorageNodeInstrumentation extends InstrumentationBase<StorageNodeInstrumentationConfig> {
  private _collectors: MetricCollector[] = []

  constructor(config: StorageNodeInstrumentationConfig = {}) {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config }
    super('@storage/instrumentation-node', '1.0.0', mergedConfig)

    const collectorConfig: CollectorConfig = {
      prefix: mergedConfig.prefix,
      labels: mergedConfig.labels,
    }

    this._collectors = [
      new CpuCollector(collectorConfig),
      new HandlesCollector(collectorConfig),
      new ProcessStartCollector(collectorConfig),
      new ExternalMemoryCollector(collectorConfig),
      new FileDescriptorCollector(collectorConfig),
      new CgroupCpuCollector(collectorConfig),
    ]

    // Enable collectors if instrumentation is enabled (matches RuntimeNodeInstrumentation pattern)
    if (this._config.enabled) {
      for (const collector of this._collectors) {
        collector.enable()
      }
    }
  }

  init() {
    // Not instrumenting or patching a Node.js module
  }

  // Called when a new MeterProvider is set
  override _updateMetricInstruments() {
    if (!this._collectors) return
    for (const collector of this._collectors) {
      collector.updateMetricInstruments(this.meter)
    }
  }

  override enable() {
    super.enable()
    if (!this._collectors) return
    for (const collector of this._collectors) {
      collector.enable()
    }
  }

  override disable() {
    super.disable()
    for (const collector of this._collectors) {
      collector.disable()
    }
  }
}
