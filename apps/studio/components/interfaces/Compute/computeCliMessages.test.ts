import { describe, expect, it } from 'vitest'

import {
  buildCapacityNotice,
  buildPlanGateNotice,
  buildQuotaNotice,
  buildUsageReport,
  formatCliNotice,
} from './computeCliMessages'

const QUOTA = {
  includedVcpuHours: 500 / 60,
  planName: 'Pro Plan',
  organizationSlug: 'northwind',
  isSpendCapEnabled: false,
}

describe('buildQuotaNotice', () => {
  it('says nothing below the threshold', () => {
    expect(buildQuotaNotice({ ...QUOTA, usedVcpuHours: 2 })).toBeNull()
  })

  it('warns without failing the command once past the threshold', () => {
    const result = buildQuotaNotice({ ...QUOTA, usedVcpuHours: 7.2 })

    expect(result).not.toBeNull()
    expect(result?.severity).toBe('warning')
    expect(result?.exitCode).toBe(0)
    expect(result?.stream).toBe('stderr')
    expect(formatCliNotice(result!)).toContain('1.1 vCPU-hrs left')
  })

  it('reports overage as a warning when the spend cap is off', () => {
    const result = buildQuotaNotice({ ...QUOTA, usedVcpuHours: 9.1 })

    expect(result?.severity).toBe('warning')
    expect(result?.exitCode).toBe(0)
    expect(formatCliNotice(result!)).toContain('Instances keep running')
  })

  it('costs the overage rather than only naming the rate', () => {
    const text = formatCliNotice(buildQuotaNotice({ ...QUOTA, usedVcpuHours: 9.1 })!)

    // 0.77 vCPU-hrs past an 8.33 allowance, billed on vCPU and the memory pinned to it.
    expect(text).toMatch(/0\.8 vCPU-hrs over quota, about \$\d+\.\d\d so far/)
    expect(text).toContain('Rates are experimental')
    expect(text).toContain('https://supabase.com/pricing')
  })

  it('fails the command when the spend cap makes the quota a hard stop', () => {
    const result = buildQuotaNotice({
      ...QUOTA,
      usedVcpuHours: 500 / 60,
      isSpendCapEnabled: true,
    })

    expect(result?.severity).toBe('error')
    expect(result?.exitCode).toBe(1)
  })
})

const CAPACITY = {
  concurrentInstances: 10,
  planName: 'Pro Plan',
  organizationSlug: 'northwind',
}

describe('buildCapacityNotice', () => {
  it('stays silent when the deploy leaves comfortable headroom', () => {
    expect(
      buildCapacityNotice({ ...CAPACITY, runningInstances: 2, requestedInstances: 1 })
    ).toBeNull()
  })

  it('mentions the headroom only when the deploy nearly fills the limit', () => {
    const result = buildCapacityNotice({
      ...CAPACITY,
      runningInstances: 7,
      requestedInstances: 2,
    })

    expect(result?.severity).toBe('info')
    expect(result?.exitCode).toBe(0)
    expect(formatCliNotice(result!)).toContain('1 of 10 concurrent instances will be free')
  })

  it('fails the deploy that does not fit, and says by how much', () => {
    const result = buildCapacityNotice({
      ...CAPACITY,
      runningInstances: 9,
      requestedInstances: 3,
    })

    expect(result?.severity).toBe('error')
    expect(result?.exitCode).toBe(1)
    expect(formatCliNotice(result!)).toContain('asked for 3, 1 available')
  })

  it('says nothing at all when the plan sets no cap', () => {
    expect(
      buildCapacityNotice({
        ...CAPACITY,
        concurrentInstances: null,
        runningInstances: 90,
        requestedInstances: 20,
      })
    ).toBeNull()
  })
})

describe('buildPlanGateNotice', () => {
  it('names the plan and the remedy for a size that is gated', () => {
    const text = formatCliNotice(
      buildPlanGateNotice({
        gate: 'size',
        planName: 'Free Plan',
        organizationSlug: 'northwind',
        requested: '4gb-2vcpu',
      })
    )

    expect(text).toContain('Size 4gb-2vcpu is not available on the Free Plan')
    expect(text).toContain('Compare plans')
  })

  it('offers the public-instance workaround before the upgrade', () => {
    const text = formatCliNotice(
      buildPlanGateNotice({
        gate: 'private',
        planName: 'Free Plan',
        organizationSlug: 'northwind',
        requested: 'private',
      })
    )

    expect(text.indexOf('--exposure public')).toBeLessThan(text.indexOf('Compare plans'))
  })
})

describe('buildUsageReport', () => {
  const report = buildUsageReport({
    organizationName: 'Northwind',
    planName: 'Pro Plan',
    usedVcpuHours: 7.2,
    includedVcpuHours: 500 / 60,
    cycleEndsOn: '1 December',
    projectedExhaustionOn: '22 November',
    concurrentInstances: 10,
    projects: [
      { name: 'checkout-api', vcpuHours: 4.47, runningInstances: 4 },
      { name: 'staging', vcpuHours: 0.33, runningInstances: 1 },
    ],
  })

  it('leads with the quota and the projection', () => {
    expect(report.join('\n')).toContain('7.2/8.3 vCPU-hrs')
    expect(report.join('\n')).toContain('projected to reach the quota on 22 November')
  })

  it('drops the projection line when usage is not on track to exhaust', () => {
    const steady = buildUsageReport({
      organizationName: 'Northwind',
      planName: 'Pro Plan',
      usedVcpuHours: 2,
      includedVcpuHours: 500 / 60,
      cycleEndsOn: '1 December',
      projectedExhaustionOn: null,
      concurrentInstances: 10,
      projects: [{ name: 'checkout-api', vcpuHours: 2, runningInstances: 2 }],
    })

    expect(steady.join('\n')).not.toContain('projected')
  })

  it('aligns the project table on the longest name', () => {
    const rows = report.filter((line) => /\d+%/.test(line))
    const shareColumns = rows.map((line) => line.indexOf('%'))

    expect(new Set(shareColumns).size).toBe(1)
  })
})
