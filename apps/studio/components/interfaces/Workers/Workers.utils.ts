import { RUNTIMES, type RuntimeMeta } from './Workers.constants'
import type { Worker, WorkerAccess, WorkerBuildState } from './Workers.types'
import { ResponseError } from '@/types'

export interface WorkerFilters {
  search: string
  state: WorkerBuildState | 'all'
  access: WorkerAccess | 'all'
}

export const filterWorkers = (workers: Worker[], filters: WorkerFilters): Worker[] => {
  const search = filters.search.trim().toLowerCase()
  return workers.filter((worker) => {
    const matchesSearch = worker.name.toLowerCase().includes(search)
    const matchesState = filters.state === 'all' || worker.buildState === filters.state
    const matchesAccess = filters.access === 'all' || worker.access === filters.access
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
  getRuntimeMeta(runtime)?.label ?? runtime ?? 'Unknown'

// The API reports size as e.g. "2gb-1vcpu"; render the parts when they parse, the raw value if not.
export const formatSize = (size: string): string => {
  const match = size.match(/^(\d+)gb-(\d+)vcpu$/)
  if (!match) return size
  return `${match[1]} GB · ${match[2]} vCPU`
}

export const formatResources = (worker: Worker): string =>
  `${formatSize(worker.size)} · ${worker.declaredInstances} inst`

// The Workers API is allowlisted per project (FUNC-795), so a project can hold the
// dashboard flag and still be refused by the endpoint.
export const isWorkersAccessDenied = (error: Error | null): boolean => {
  if (!(error instanceof ResponseError)) return false
  return error.code === 403 || error.code === 404
}
