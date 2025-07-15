import type { PostgresColumn } from '@supabase/postgres-meta'
import { ProjectLogStatsVariables } from 'data/analytics/project-log-stats-query'
import { PlanId } from 'data/subscriptions/types'

export interface Notification {
  category: 'info' | 'error' | 'success' | 'loading'
  message: string // Readable message for users to understand
  description?: string
  id?: string
  error?: any // Optional: Any other errors that needs to be logged out in the console
  progress?: number // Optional: For loading messages to show a progress bar (Out of 100)
  duration?: number // Optional: How long to show the message for (ms)
  metadata?: NotificationMetadata
}

interface NotificationMetadata {
  [key: string]: any
}

export interface ChartIntervals {
  key: Exclude<ProjectLogStatsVariables['interval'], undefined>
  label: string
  startValue: number
  startUnit: 'minute' | 'hour' | 'day'
  format?: 'MMM D, h:mm:ssa' | 'MMM D, h:mma' | 'MMM D, ha' | 'MMM D'
  availableIn?: PlanId[]
}

export interface VaultSecret {
  id: string
  name: string
  description: string
  secret: string
  decryptedSecret?: string
  created_at: string
  updated_at: string
}

export interface SchemaView {
  id: number
  name: string
  schema: string
  is_updatable: boolean
  comment?: string
  columns: PostgresColumn[]
}
