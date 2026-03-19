import { useQuery } from '@tanstack/react-query'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { SENTINEL_KEYS, type Scope } from '@supabase-dx/env-vars'

import {
  AUTH_CONFIG_ENV_VAR_MAP,
  POSTGREST_CONFIG_ENV_VAR_MAP,
} from './EnvironmentVariables.constants'
import type { EnvironmentVariable } from './EnvironmentVariables.types'

const ENV_SERVER = 'http://localhost:3457'

interface EnvServerVar {
  key: string
  scope: string
  value: string
  secret: boolean
}

async function fetchEnvVars(projectRef: string): Promise<EnvServerVar[]> {
  const res = await fetch(`${ENV_SERVER}/projects/${projectRef}/env`)
  if (!res.ok) throw new Error(`env-server error: ${res.status}`)
  return res.json()
}

export function useEnvironmentVariables() {
  const { data: project } = useSelectedProjectQuery()
  const projectRef = project?.parentRef

  const {
    data: envVars = [],
    isPending: isEnvPending,
    isError: isEnvError,
    error: envError,
  } = useQuery({
    queryKey: ['env-server', projectRef],
    queryFn: () => fetchEnvVars(projectRef!),
    enabled: !!projectRef,
  })

  const {
    data: authConfig,
    isPending: isAuthPending,
    isError: isAuthError,
    error: authError,
  } = useAuthConfigQuery({ projectRef }, { enabled: IS_PLATFORM })

  const {
    data: postgrestConfig,
    isPending: isPostgrestPending,
    isError: isPostgrestError,
    error: postgrestError,
  } = useProjectPostgrestConfigQuery({ projectRef }, { enabled: IS_PLATFORM })

  // Build a set of env var names from the env server for pairing lookups
  const envVarNames = new Set(
    envVars.filter((v) => !SENTINEL_KEYS.has(v.key) && v.scope !== 'config').map((v) => v.key)
  )

  // Build a set of platform config env names for pairing lookups
  const platformEnvNames = new Set([
    ...Object.values(AUTH_CONFIG_ENV_VAR_MAP).map((m) => m.envName),
    ...Object.values(POSTGREST_CONFIG_ENV_VAR_MAP).map((m) => m.envName),
  ])

  // 1. User vars from env server (filter sentinels)
  const userVariables: EnvironmentVariable[] = envVars
    .filter((v) => !SENTINEL_KEYS.has(v.key) && v.scope !== 'config')
    .map((v) => ({
      name: v.key,
      value: v.value,
      isSecret: v.secret,
      category: 'user' as const,
      source: 'secret' as const,
      sourceKey: `${v.key}__${v.scope}`,
      scope: v.scope as Scope,
      hasEnvVar: true,
      hasConfig: platformEnvNames.has(v.key),
    }))

  // 2. Auth config platform variables
  const authVariables: EnvironmentVariable[] = []
  if (authConfig) {
    for (const [key, mapping] of Object.entries(AUTH_CONFIG_ENV_VAR_MAP)) {
      const rawValue = (authConfig as Record<string, unknown>)[key]
      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        authVariables.push({
          name: mapping.envName,
          value: mapping.isSecret ? '••••••••' : String(rawValue),
          isSecret: mapping.isSecret,
          category: 'platform',
          source: 'auth_config',
          sourceKey: key,
          scope: null,
          hasEnvVar: envVarNames.has(mapping.envName),
          hasConfig: true,
        })
      }
    }
  }

  // 3. PostgREST config platform variables
  const postgrestVariables: EnvironmentVariable[] = []
  if (postgrestConfig) {
    for (const [key, mapping] of Object.entries(POSTGREST_CONFIG_ENV_VAR_MAP)) {
      const rawValue = (postgrestConfig as Record<string, unknown>)[key]
      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        postgrestVariables.push({
          name: mapping.envName,
          value: String(rawValue),
          isSecret: mapping.isSecret,
          category: 'platform',
          source: 'postgrest_config',
          sourceKey: key,
          scope: null,
          hasEnvVar: envVarNames.has(mapping.envName),
          hasConfig: true,
        })
      }
    }
  }

  const variables = [
    ...userVariables.sort((a, b) => a.name.localeCompare(b.name)),
    ...authVariables.sort((a, b) => a.name.localeCompare(b.name)),
    ...postgrestVariables.sort((a, b) => a.name.localeCompare(b.name)),
  ]

  const isPending = isEnvPending || (IS_PLATFORM && (isAuthPending || isPostgrestPending))
  const isError = isEnvError || isAuthError || isPostgrestError
  const errors = [
    isEnvError ? envError : null,
    isAuthError ? authError : null,
    isPostgrestError ? postgrestError : null,
  ].filter(Boolean)

  return { variables, isPending, isError, errors }
}
