import { queryOptions } from '@tanstack/react-query'
import dayjs from 'dayjs'

import { computeKeys } from './keys'
import { getComputeUnitWeight } from '@/components/interfaces/Compute/ComputeUsage.constants'
import type {
  ComputeUsageByProject,
  ComputeUsagePoint,
} from '@/components/interfaces/Compute/ComputeUsage.utils'
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

/** Business-hours hump, so every series reads as a real daily cycle rather than noise. */
const diurnalWeight = (hour: number) =>
  0.4 + 0.6 * Math.max(0, Math.sin(((hour - 5) / 24) * Math.PI * 2) * 0.5 + 0.5)

interface GenerateUsageParams {
  seed: string
  days: number
  size: string
  instances: number
  /** Share of the day the instance is serving traffic rather than suspended. */
  dutyCycle: number
  requestsPerActiveHour: number
}

const generateUsagePoints = ({
  seed,
  days,
  size,
  instances,
  dutyCycle,
  requestsPerActiveHour,
}: GenerateUsageParams): ComputeUsagePoint[] => {
  const random = createRandom(hashSeed(seed))
  const weight = getComputeUnitWeight(size)
  const start = dayjs()
    .utc()
    .subtract(days - 1, 'day')
    .startOf('day')

  return Array.from({ length: days }, (_, index) => {
    const day = start.add(index, 'day')
    const variation = 0.75 + random() * 0.5
    const dailyDuty = Math.min(1, dutyCycle * variation * diurnalWeight(day.hour() + 12))
    const activeHours = Number((24 * dailyDuty * instances).toFixed(2))
    const liveInstances = Number((instances * Math.min(1, dailyDuty * 1.4)).toFixed(2))

    return {
      timestamp: day.toISOString(),
      activeHours,
      computeUnits: Number((activeHours * weight).toFixed(2)),
      instances: liveInstances,
      requests: Math.round(activeHours * requestsPerActiveHour * (0.7 + random() * 0.6)),
    }
  })
}

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
        requestsPerActiveHour: 820,
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

export interface ComputeProjectUsage {
  points: ComputeUsagePoint[]
  activeHours: number
  computeUnits: number
  requests: number
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
          requestsPerActiveHour: 820,
        })
      )

      const points: ComputeUsagePoint[] = Array.from({ length: days }, (_, index) => {
        const bucket = perInstance.map((series) => series[index]).filter(Boolean)
        return {
          timestamp: bucket[0]?.timestamp ?? dayjs().utc().toISOString(),
          activeHours: Number(bucket.reduce((sum, p) => sum + p.activeHours, 0).toFixed(2)),
          computeUnits: Number(bucket.reduce((sum, p) => sum + p.computeUnits, 0).toFixed(2)),
          instances: Number(bucket.reduce((sum, p) => sum + p.instances, 0).toFixed(2)),
          requests: bucket.reduce((sum, p) => sum + p.requests, 0),
        }
      })

      return {
        points,
        activeHours: Number(points.reduce((sum, p) => sum + p.activeHours, 0).toFixed(2)),
        computeUnits: Number(points.reduce((sum, p) => sum + p.computeUnits, 0).toFixed(2)),
        requests: points.reduce((sum, p) => sum + p.requests, 0),
      }
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
  /** Flattened instance rows, for the by-size breakdown. */
  instanceRows: { size: string; activeHours: number }[]
}

/** Stand-in project set until the rollup can report real per-project figures. */
const MOCK_PROJECTS = [
  {
    projectRef: 'prod-api',
    projectName: 'Production API',
    size: '4gb-2vcpu',
    instances: 3,
    dutyCycle: 0.92,
  },
  {
    projectRef: 'media-jobs',
    projectName: 'Media jobs',
    size: '4gb-2vcpu',
    instances: 2,
    dutyCycle: 0.35,
  },
  {
    projectRef: 'webhooks',
    projectName: 'Webhook relay',
    size: '2gb-1vcpu',
    instances: 2,
    dutyCycle: 0.68,
  },
  {
    projectRef: 'staging',
    projectName: 'Staging',
    size: '2gb-1vcpu',
    instances: 1,
    dutyCycle: 0.22,
  },
  {
    projectRef: 'sandbox',
    projectName: 'Sandbox',
    size: '2gb-1vcpu',
    instances: 1,
    dutyCycle: 0.08,
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
          requestsPerActiveHour: 640,
        }),
      }))

      // Collapse every project's daily series into one org-wide series.
      const points: ComputeUsagePoint[] = Array.from({ length: days }, (_, index) => {
        const bucket = perProject.map((entry) => entry.points[index]).filter(Boolean)
        return {
          timestamp: bucket[0]?.timestamp ?? dayjs().utc().toISOString(),
          activeHours: Number(bucket.reduce((sum, p) => sum + p.activeHours, 0).toFixed(2)),
          computeUnits: Number(bucket.reduce((sum, p) => sum + p.computeUnits, 0).toFixed(2)),
          instances: Number(bucket.reduce((sum, p) => sum + p.instances, 0).toFixed(2)),
          requests: bucket.reduce((sum, p) => sum + p.requests, 0),
        }
      })

      const byProject: ComputeUsageByProject[] = perProject
        .map(({ project, points: projectPoints }) => ({
          projectRef: project.projectRef,
          projectName: project.projectName,
          activeHours: Number(projectPoints.reduce((sum, p) => sum + p.activeHours, 0).toFixed(2)),
          computeUnits: Number(
            projectPoints.reduce((sum, p) => sum + p.computeUnits, 0).toFixed(2)
          ),
          instances: project.instances,
          requests: projectPoints.reduce((sum, p) => sum + p.requests, 0),
        }))
        .sort((a, b) => b.computeUnits - a.computeUnits)

      return {
        points,
        byProject,
        instanceRows: perProject.map(({ project, points: projectPoints }) => ({
          size: project.size,
          activeHours: Number(projectPoints.reduce((sum, p) => sum + p.activeHours, 0).toFixed(2)),
        })),
      }
    },
    enabled: IS_PLATFORM && orgSlug !== undefined,
    staleTime: Infinity,
  })
