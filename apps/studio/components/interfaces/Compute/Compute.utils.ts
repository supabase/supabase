import { COMPUTE_INSTANCE_NAME_WORDS, RUNTIMES, type RuntimeMeta } from './Compute.constants'
import type {
  ComputeInstance,
  ComputeInstanceAccess,
  ComputeInstanceBuildState,
} from './Compute.types'
import { ResponseError } from '@/types'

export interface ComputeInstanceFilters {
  search: string
  state: ComputeInstanceBuildState | 'all'
  access: ComputeInstanceAccess | 'all'
}

export const filterComputeInstances = (
  instances: ComputeInstance[],
  filters: ComputeInstanceFilters
): ComputeInstance[] => {
  const search = filters.search.trim().toLowerCase()
  return instances.filter((instance) => {
    const matchesSearch = instance.name.toLowerCase().includes(search)
    const matchesState = filters.state === 'all' || instance.buildState === filters.state
    const matchesAccess = filters.access === 'all' || instance.access === filters.access
    return matchesSearch && matchesState && matchesAccess
  })
}

export interface Page<T> {
  items: T[]
  currentPage: number
  totalPages: number
  startIndex: number
}

// Clamps the requested page so filtering down to fewer results never strands an empty page.
export const getPage = <T>(items: T[], requestedPage: number, pageSize: number): Page<T> => {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages)
  const startIndex = (currentPage - 1) * pageSize
  return {
    items: items.slice(startIndex, startIndex + pageSize),
    currentPage,
    totalPages,
    startIndex,
  }
}

export const getRuntimeMeta = (runtime: string | undefined): RuntimeMeta | undefined =>
  runtime === undefined ? undefined : RUNTIMES[runtime]

export const formatRuntime = (runtime: string | undefined): string =>
  getRuntimeMeta(runtime)?.label ?? runtime ?? 'Custom'

// The API reports size as e.g. "2gb-1vcpu"; render the parts when they parse, the raw value if not.
export const formatSize = (size: string): string => {
  const match = size.match(/^(\d+)gb-(\d+)vcpu$/)
  if (!match) return size
  return `${match[1]} GB · ${match[2]} vCPU`
}

export const formatResources = (instance: ComputeInstance): string =>
  `${formatSize(instance.size)} · ${instance.declaredInstances} inst`

// Suggests a friendly, already-valid starting name so the deploy dialog isn't blank.
export const generateComputeInstanceName = (): string => {
  const word =
    COMPUTE_INSTANCE_NAME_WORDS[Math.floor(Math.random() * COMPUTE_INSTANCE_NAME_WORDS.length)]
  const number = Math.floor(Math.random() * 900000) + 100000
  return `compute-${word}-${number}`
}

// A project outside the alpha allow-list gets a 404, not a 403.
export const isComputeUnavailable = (error: Error | null): boolean =>
  error instanceof ResponseError && error.code === 404

// An enrolled project still answers 403 when the caller lacks the compute permission.
export const isComputeForbidden = (error: Error | null): boolean =>
  error instanceof ResponseError && error.code === 403
