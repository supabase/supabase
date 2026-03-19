import type { Scope } from '@supabase-dx/env-vars'

export type EnvironmentVariableSource = 'secret' | 'auth_config' | 'postgrest_config'
export type EnvironmentVariableCategory = 'user' | 'platform'

export interface EnvironmentVariable {
  name: string
  value: string
  isSecret: boolean
  category: EnvironmentVariableCategory
  source: EnvironmentVariableSource
  sourceKey: string
  scope: Scope | null
  branch?: string
  updatedAt?: string
  /** Debug: whether this var has a backing env server entry */
  hasEnvVar?: boolean
  /** Debug: whether this var has a backing platform config entry */
  hasConfig?: boolean
}

export type EnvironmentTab = 'production' | 'preview' | 'development'
