import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { beforeAll, describe, expect, it } from 'vitest'

import { computeOrgUsageQueryOptions } from './compute-usage-query'
import { sumBy } from '@/components/interfaces/Compute/ComputeUsage.utils'

beforeAll(() => dayjs.extend(utc))

const orgUsage = async (projects: { ref: string; name: string }[] = []) => {
  const options = computeOrgUsageQueryOptions({ orgSlug: 'acme', projects, days: 30 })
  if (typeof options.queryFn !== 'function') throw new Error('expected a queryFn')
  return options.queryFn({} as never)
}

/**
 * The figures are mock, but they still have to agree with each other: a reader who divides
 * reserved vCPU-hours by runtime should land on a plausible mean instance size, and anyone
 * adding up the project table should reach the org total. These guard the mock against
 * drifting into numbers that don't reconcile.
 */
describe('computeOrgUsageQueryOptions', () => {
  it('reserves between one and two vCPU per instance-hour, matching the deployable sizes', async () => {
    const usage = await orgUsage()
    const runtime = sumBy(usage.points, (point) => point.runningHours)
    const reserved = sumBy(usage.points, (point) => point.reservedVcpuHours)

    // 1 vCPU and 2 vCPU are the only sizes, so the weighted mean has to sit between them.
    expect(reserved / runtime).toBeGreaterThanOrEqual(1)
    expect(reserved / runtime).toBeLessThanOrEqual(2)
  })

  it('holds memory at exactly 2 GB per vCPU, which is why GB-hours is not a second quota', async () => {
    const usage = await orgUsage()
    const reserved = sumBy(usage.points, (point) => point.reservedVcpuHours)
    const gbHours = sumBy(usage.points, (point) => point.gbHours)

    expect(gbHours / reserved).toBeCloseTo(2, 10)
  })

  it('adds the project rows up to the org totals', async () => {
    const usage = await orgUsage()
    const orgReserved = sumBy(usage.points, (point) => point.reservedVcpuHours)
    const projectReserved = sumBy(usage.byProject, (row) => row.reservedVcpuHours)

    expect(projectReserved).toBeCloseTo(orgReserved, 6)
  })

  it('generates against the projects it is given, not a fixed set', async () => {
    const usage = await orgUsage([
      { ref: 'alpha', name: 'Alpha' },
      { ref: 'beta', name: 'Beta' },
    ])

    expect(usage.byProject.map((row) => row.projectName).sort()).toEqual(['Alpha', 'Beta'])
  })

  it('returns the same figures for the same projects, so a re-render does not move them', async () => {
    const projects = [{ ref: 'alpha', name: 'Alpha' }]
    const [first, second] = await Promise.all([orgUsage(projects), orgUsage(projects)])

    expect(sumBy(second.points, (point) => point.reservedVcpuHours)).toBe(
      sumBy(first.points, (point) => point.reservedVcpuHours)
    )
  })
})
