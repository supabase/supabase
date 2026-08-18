import type { Worker, WorkerAccess, WorkerState } from './Workers.types'

export interface WorkerFilters {
  search: string
  state: WorkerState | 'all'
  access: WorkerAccess | 'all'
}

export const filterWorkers = (workers: Worker[], filters: WorkerFilters): Worker[] => {
  const search = filters.search.trim().toLowerCase()
  return workers.filter((worker) => {
    const matchesSearch = worker.name.toLowerCase().includes(search)
    const matchesState = filters.state === 'all' || worker.state === filters.state
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
