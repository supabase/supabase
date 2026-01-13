import { type Table as TTable } from '@tanstack/react-table'

import { LEVELS } from 'components/ui/DataTable/DataTable.constants'
import { cn } from 'ui'
import { FacetMetadataSchema } from './UnifiedLogs.schema'

export const logEventBus = {
  listeners: new Map<string, Set<(...args: any[]) => void>>(),

  on(event: 'selectTraceTab', callback: (rowId: string) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(callback)
    return () => this.listeners.get(event)?.delete(callback)
  },

  emit(event: 'selectTraceTab', rowId: string) {
    this.listeners.get(event)?.forEach((callback) => callback(rowId))
  },
}

export const getFacetedUniqueValues = <TData>(facets?: Record<string, FacetMetadataSchema>) => {
  return (table: TTable<TData>, columnId: string) => {
    return new Map(facets?.[columnId]?.rows?.map(({ value, total }) => [value, total]) || [])
  }
}

export const getFacetedMinMaxValues = <TData>(facets?: Record<string, FacetMetadataSchema>) => {
  return (table: TTable<TData>, columnId: string) => {
    const min = facets?.[columnId]?.min
    const max = facets?.[columnId]?.max
    if (typeof min === 'number' && typeof max === 'number') return [min, max]
    if (typeof min === 'number') return [min, min]
    if (typeof max === 'number') return [max, max]
    return undefined
  }
}

export const getLevelLabel = (value: (typeof LEVELS)[number]): string => {
  switch (value) {
    case 'success':
      return '2xx'
    case 'warning':
      return '4xx'
    case 'error':
      return '5xx'
  }
}

// Helper function to determine level from HTTP status code
export const getStatusLevel = (status?: number | string): string => {
  if (!status) return 'success'
  const statusNum = Number(status)
  if (statusNum >= 500) return 'error'
  if (statusNum >= 400) return 'warning'
  if (statusNum >= 300) return 'info' // 3xx redirects are informational
  if (statusNum >= 200) return 'success'
  if (statusNum >= 100) return 'info'
  return 'success'
}

export function getLevelRowClassName(value: (typeof LEVELS)[number]): string {
  switch (value) {
    case 'success':
      return ''
    case 'warning':
      return cn(
        'bg-warning/5 hover:bg-warning/10 data-[state=selected]:bg-warning/20 focus-visible:bg-warning/10',
        'dark:bg-warning/10 dark:hover:bg-warning/20 dark:data-[state=selected]:bg-warning/30 dark:focus-visible:bg-warning/20'
      )
    case 'error':
      return cn(
        'bg-destructive/5 hover:bg-destructive/10 data-[state=selected]:bg-destructive/20 focus-visible:bg-destructive/10',
        'dark:bg-error/10 dark:hover:bg-destructive/20 dark:data-[state=selected]:bg-destructive/30 dark:focus-visible:bg-destructive/20'
      )
    default:
      return ''
  }
}

/**
 * Formats service type strings for display purposes
 * Handles special cases like "edge function" -> "Edge Function"
 * and applies proper capitalization to other service types
 */
export function formatServiceTypeForDisplay(serviceType: string): string {
  if (!serviceType) return ''

  // Handle special cases
  const specialCases: Record<string, string> = {
    'edge function': 'Edge Function',
    postgrest: 'PostgREST',
    postgres: 'Postgres',
    auth: 'Auth',
    storage: 'Storage',
  }

  return specialCases[serviceType.toLowerCase()] || serviceType
}
