import { describe, expect, it } from 'vitest'

import {
  FAILOVER_SIMULATION_FAILOVER_AT_MS,
  FAILOVER_SIMULATION_HEALTHY_MS,
  getFailoverSimulationDelayMs,
  getFailoverSimulationPhase,
  getFailoverSimulationStatusLabel,
} from './simulateFailover.utils'

describe('getFailoverSimulationPhase', () => {
  it('is off when the simulation is disabled', () => {
    expect(getFailoverSimulationPhase({ enabled: false, elapsedMs: 0 })).toBe('off')
    expect(
      getFailoverSimulationPhase({ enabled: false, elapsedMs: FAILOVER_SIMULATION_HEALTHY_MS })
    ).toBe('off')
    expect(
      getFailoverSimulationPhase({
        enabled: false,
        elapsedMs: 0,
        prefersReducedMotion: true,
      })
    ).toBe('off')
  })

  it('skips to failover when reduced motion is preferred', () => {
    expect(
      getFailoverSimulationPhase({
        enabled: true,
        elapsedMs: 0,
        prefersReducedMotion: true,
      })
    ).toBe('failover')
  })

  it('plays healthy, then promoting, then failover without looping', () => {
    expect(getFailoverSimulationPhase({ enabled: true, elapsedMs: 0 })).toBe('healthy')
    expect(
      getFailoverSimulationPhase({ enabled: true, elapsedMs: FAILOVER_SIMULATION_HEALTHY_MS - 1 })
    ).toBe('healthy')
    expect(
      getFailoverSimulationPhase({ enabled: true, elapsedMs: FAILOVER_SIMULATION_HEALTHY_MS })
    ).toBe('promoting')
    expect(
      getFailoverSimulationPhase({
        enabled: true,
        elapsedMs: FAILOVER_SIMULATION_FAILOVER_AT_MS - 1,
      })
    ).toBe('promoting')
    expect(
      getFailoverSimulationPhase({ enabled: true, elapsedMs: FAILOVER_SIMULATION_FAILOVER_AT_MS })
    ).toBe('failover')
    expect(
      getFailoverSimulationPhase({
        enabled: true,
        elapsedMs: FAILOVER_SIMULATION_FAILOVER_AT_MS + 60_000,
      })
    ).toBe('failover')
  })

  it('treats non-finite and negative elapsed time as healthy', () => {
    expect(getFailoverSimulationPhase({ enabled: true, elapsedMs: Number.NaN })).toBe('healthy')
    expect(getFailoverSimulationPhase({ enabled: true, elapsedMs: Number.POSITIVE_INFINITY })).toBe(
      'healthy'
    )
    expect(getFailoverSimulationPhase({ enabled: true, elapsedMs: -1 })).toBe('healthy')
  })
})

describe('getFailoverSimulationDelayMs', () => {
  it('waits the remaining healthy window, then the promoting window, then stops', () => {
    expect(getFailoverSimulationDelayMs(0)).toBe(FAILOVER_SIMULATION_HEALTHY_MS)
    expect(getFailoverSimulationDelayMs(1)).toBe(FAILOVER_SIMULATION_HEALTHY_MS - 1)
    expect(getFailoverSimulationDelayMs(FAILOVER_SIMULATION_HEALTHY_MS)).toBe(
      FAILOVER_SIMULATION_FAILOVER_AT_MS - FAILOVER_SIMULATION_HEALTHY_MS
    )
    expect(getFailoverSimulationDelayMs(FAILOVER_SIMULATION_FAILOVER_AT_MS - 1)).toBe(1)
    expect(getFailoverSimulationDelayMs(FAILOVER_SIMULATION_FAILOVER_AT_MS)).toBeUndefined()
  })

  it('falls back to the healthy window for non-finite and negative elapsed time', () => {
    expect(getFailoverSimulationDelayMs(Number.NaN)).toBe(FAILOVER_SIMULATION_HEALTHY_MS)
    expect(getFailoverSimulationDelayMs(Number.NEGATIVE_INFINITY)).toBe(
      FAILOVER_SIMULATION_HEALTHY_MS
    )
    expect(getFailoverSimulationDelayMs(-10)).toBe(FAILOVER_SIMULATION_HEALTHY_MS)
  })
})

describe('getFailoverSimulationStatusLabel', () => {
  it('returns copy only for in-progress and completed failover', () => {
    expect(getFailoverSimulationStatusLabel('off')).toBeUndefined()
    expect(getFailoverSimulationStatusLabel('healthy')).toBeUndefined()
    expect(getFailoverSimulationStatusLabel('promoting')).toBe('Promoting replica')
    expect(getFailoverSimulationStatusLabel('failover')).toBe('Replica promoted')
  })
})
