import { queryOptions } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { computeKeys } from './keys'
import type {
  ComputeUsageByProject,
  ComputeUsagePoint,
} from '@/components/interfaces/Compute/ComputeUsage.utils'
import { sumBy, toGbHours, toVcpuHours } from '@/components/interfaces/Compute/ComputeUsage.utils'
import { IS_PLATFORM } from '@/lib/constants'

/**
 * Compute does not emit usage telemetry yet — there is no metering rollup behind
 * `/v2/projects/{ref}/compute`. These surfaces run on generated figures so the shape of the
 * usage story can be reviewed ahead of the backend.
 *
 * The generator is seeded off the identifiers it is given, so a given instance or project
 * always renders the same numbers. Swapping in the real endpoint means replacing the two
 * `queryFn`s below; nothing in the components changes.
 */

/** Deterministic hash, so the same name always produces the same series. */
const hashSeed = (...parts: (string | number)[]): number => {
  let hash = 2166136261
  for (const part of parts) {
    const value = String(part)
    for (let index = 0; index < value.length; index++) {
      hash ^= value.charCodeAt(index)
      hash = Math.imul(hash, 16777619)
    }
  }
  return hash >>> 0
}

/** mulberry32 — small, stable, and never calls Math.random(). */
const createRandom = (seed: number) => {
  let state = seed >>> 0 || 1
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Weekends run quieter than weekdays. A daily bucket has no hour-of-day to shape, so this
 * is the only cycle that actually shows up at this granularity.
 */
const WEEKEND_WEIGHT = 0.65
const dayOfWeekWeight = (day: dayjs.Dayjs) =>
  day.day() === 0 || day.day() === 6 ? WEEKEND_WEIGHT : 1

interface GenerateUsageParams {
  seed: string
  days: number
  size: string
  instances: number
  /** Share of the day the instance is running rather than suspended. */
  dutyCycle: number
  requestsPerRunningHour: number
}

const MIN_CPU_UTILIZATION = 0.1
const MAX_CPU_UTILIZATION = 0.6

const generateUsagePoints = ({
  seed,
  days,
  size,
  instances,
  dutyCycle,
  requestsPerRunningHour,
}: GenerateUsageParams): ComputeUsagePoint[] => {
  const random = createRandom(hashSeed(seed))
  const baseUtilization =
    MIN_CPU_UTILIZATION + random() * (MAX_CPU_UTILIZATION - MIN_CPU_UTILIZATION)
  const start = dayjs()
    .utc()
    .subtract(days - 1, 'day')
    .startOf('day')

  return Array.from({ length: days }, (_, index) => {
    const day = start.add(index, 'day')
    const variation = 0.75 + random() * 0.5
    const dailyDuty = Math.min(1, dutyCycle * variation * dayOfWeekWeight(day))
    const runningHours = Number((24 * dailyDuty * instances).toFixed(2))
    const liveInstances = Number((instances * Math.min(1, dailyDuty * 1.4)).toFixed(2))
    const reservedVcpuHours = toVcpuHours(runningHours, size)
    const utilization = Math.min(
      MAX_CPU_UTILIZATION,
      Math.max(MIN_CPU_UTILIZATION, baseUtilization * (0.8 + random() * 0.4))
    )

    return {
      timestamp: day.toISOString(),
      runningHours,
      reservedVcpuHours: Number(reservedVcpuHours.toFixed(2)),
      usedVcpuHours: Number((reservedVcpuHours * utilization).toFixed(2)),
      gbHours: Number(toGbHours(runningHours, size).toFixed(2)),
      instances: liveInstances,
      requests: Math.round(runningHours * requestsPerRunningHour * (0.7 + random() * 0.6)),
    }
  })
}

const round2 = (value: number) => Number(value.toFixed(2))

type ComputeUsageTotals = Omit<ComputeUsagePoint, 'timestamp' | 'instances'>

const sumUsage = (points: ComputeUsagePoint[]): ComputeUsageTotals => ({
  runningHours: round2(sumBy(points, (point) => point.runningHours)),
  reservedVcpuHours: round2(sumBy(points, (point) => point.reservedVcpuHours)),
  usedVcpuHours: round2(sumBy(points, (point) => point.usedVcpuHours)),
  gbHours: round2(sumBy(points, (point) => point.gbHours)),
  requests: sumBy(points, (point) => point.requests),
})

const mergeSeries = (series: ComputeUsagePoint[][], days: number): ComputeUsagePoint[] =>
  Array.from({ length: days }, (_, index) => {
    const bucket = series.map((points) => points[index]).filter(Boolean)
    return {
      timestamp: bucket[0]?.timestamp ?? dayjs().utc().toISOString(),
      instances: round2(sumBy(bucket, (point) => point.instances)),
      ...sumUsage(bucket),
    }
  })

/* ------------------------------------------------------------------ *
 * Per-instance usage                                                  *
 * ------------------------------------------------------------------ */

export interface ComputeInstanceUsageVariables {
  projectRef?: string
  name?: string
  size?: string
  instances?: number
  days?: number
}

export interface ComputeInstanceUsage {
  points: ComputeUsagePoint[]
  size: string
}

export const computeInstanceUsageQueryOptions = ({
  projectRef,
  name,
  size = '2gb-1vcpu',
  instances = 1,
  days = 30,
}: ComputeInstanceUsageVariables) =>
  queryOptions({
    queryKey: computeKeys.usage(projectRef, name, { size, instances, days }),
    queryFn: async (): Promise<ComputeInstanceUsage> => ({
      size,
      points: generateUsagePoints({
        seed: `${projectRef}:${name}`,
        days,
        size,
        instances,
        // Private instances never suspend, but exposure isn't known here; a high duty
        // cycle keeps the series representative of a steadily-used instance.
        dutyCycle: 0.55,
        requestsPerRunningHour: 820,
      }),
    }),
    enabled: IS_PLATFORM && projectRef !== undefined && name !== undefined,
    staleTime: Infinity,
  })

/* ------------------------------------------------------------------ *
 * Project-wide usage                                                  *
 * ------------------------------------------------------------------ */

export interface ComputeProjectUsageVariables {
  projectRef?: string
  /** The project's instances, so usage reflects what is actually deployed. */
  instances?: { name: string; size: string; declaredInstances: number }[]
  days?: number
}

export interface ComputeProjectUsage extends ComputeUsageTotals {
  points: ComputeUsagePoint[]
}

/** Sums each instance's generated series into one project-level total. */
export const computeProjectUsageQueryOptions = ({
  projectRef,
  instances = [],
  days = 30,
}: ComputeProjectUsageVariables) =>
  queryOptions({
    queryKey: computeKeys.projectUsage(projectRef, instances, days),
    queryFn: async (): Promise<ComputeProjectUsage> => {
      const perInstance = instances.map((instance) =>
        generateUsagePoints({
          seed: `${projectRef}:${instance.name}`,
          days,
          size: instance.size,
          instances: instance.declaredInstances,
          dutyCycle: 0.55,
          requestsPerRunningHour: 820,
        })
      )

      const points = mergeSeries(perInstance, days)
      return { points, ...sumUsage(points) }
    },
    enabled: IS_PLATFORM && projectRef !== undefined && instances.length > 0,
    staleTime: Infinity,
  })

/* ------------------------------------------------------------------ *
 * Org-wide usage                                                      *
 * ------------------------------------------------------------------ */

export interface ComputeOrgUsageVariables {
  orgSlug?: string
  projectRef?: string | null
  days?: number
}

export interface ComputeOrgUsage {
  points: ComputeUsagePoint[]
  byProject: ComputeUsageByProject[]
  instanceRows: { size: string; runningHours: number }[]
  deployments: number
  instances: number
}

/** Stand-in project set until the rollup can report real per-project figures. */
/**
 * Sized against the RFC's 500-minute included quota. Workers here are invocation-shaped —
 * running for minutes at a time, not held open — which is the workload the quota and the
 * per-invocation duration cap describe. The org lands a few times over the quota so the
 * overage path is visible without the figures reading as absurd.
 */
const MOCK_PROJECTS = [
  {
    projectRef: 'prod-api',
    projectName: 'Production API',
    size: '4gb-2vcpu',
    deployments: 1,
    instances: 2,
    dutyCycle: 0.012,
  },
  {
    projectRef: 'media-jobs',
    projectName: 'Media jobs',
    size: '4gb-2vcpu',
    deployments: 1,
    instances: 1,
    dutyCycle: 0.008,
  },
  {
    projectRef: 'webhooks',
    projectName: 'Webhook relay',
    size: '2gb-1vcpu',
    deployments: 1,
    instances: 1,
    dutyCycle: 0.006,
  },
  {
    projectRef: 'staging',
    projectName: 'Staging',
    size: '2gb-1vcpu',
    deployments: 1,
    instances: 1,
    dutyCycle: 0.004,
  },
  {
    projectRef: 'sandbox',
    projectName: 'Sandbox',
    size: '2gb-1vcpu',
    deployments: 1,
    instances: 1,
    dutyCycle: 0.001,
  },
]

export const computeOrgUsageQueryOptions = ({
  orgSlug,
  projectRef,
  days = 30,
}: ComputeOrgUsageVariables) =>
  queryOptions({
    queryKey: computeKeys.orgUsage(orgSlug, projectRef, days),
    queryFn: async (): Promise<ComputeOrgUsage> => {
      const projects = projectRef
        ? MOCK_PROJECTS.filter((project) => project.projectRef === projectRef)
        : MOCK_PROJECTS

      const perProject = projects.map((project) => ({
        project,
        points: generateUsagePoints({
          seed: `${orgSlug}:${project.projectRef}`,
          days,
          size: project.size,
          instances: project.instances,
          dutyCycle: project.dutyCycle,
          requestsPerRunningHour: 640,
        }),
      }))

      const points = mergeSeries(
        perProject.map((entry) => entry.points),
        days
      )

      const projectRows = perProject.map(({ project, points: projectPoints }) => ({
        size: project.size,
        usage: {
          projectRef: project.projectRef,
          projectName: project.projectName,
          deployments: project.deployments,
          instances: project.instances,
          ...sumUsage(projectPoints),
        } satisfies ComputeUsageByProject,
      }))

      const byProject = projectRows
        .map((row) => row.usage)
        .sort((a, b) => b.reservedVcpuHours - a.reservedVcpuHours)

      return {
        points,
        byProject,
        deployments: sumBy(byProject, (row) => row.deployments),
        instances: sumBy(byProject, (row) => row.instances),
        instanceRows: projectRows.map((row) => ({
          size: row.size,
          runningHours: row.usage.runningHours,
        })),
      }
    },
    enabled: IS_PLATFORM && orgSlug !== undefined,
    staleTime: Infinity,
  })
