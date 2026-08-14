import type { ConnectMode, ConnectState } from './Connect.types'

type FieldValue = ConnectState[string]

/**
 * Resolves a content path template by replacing {{key}} placeholders with state values.
 * Empty segments are filtered out to handle optional state values like frameworkVariant.
 *
 * Examples:
 *   - '{{framework}}/{{frameworkVariant}}/{{library}}' with state {framework: 'nextjs', frameworkVariant: 'app', library: 'supabasejs'}
 *     → 'nextjs/app/supabasejs'
 *   - '{{orm}}' with state {orm: 'prisma'}
 *     → 'prisma'
 *   - 'steps/install' (no templates)
 *     → 'steps/install'
 */
export function resolveContentPath(template: string, state: ConnectState): string {
  return template
    .replace(/\{\{(\w+)\}\}/g, (_, key) => String(state[key] ?? ''))
    .split('/')
    .filter(Boolean)
    .join('/')
}

export function shouldShowIpv4AddonNotice({
  isPlatform,
  mode,
  connectionMethod,
  useSharedPooler,
  hasIpv4Addon,
}: {
  isPlatform: boolean
  mode: ConnectMode
  connectionMethod: FieldValue
  useSharedPooler: FieldValue
  hasIpv4Addon: boolean
}): boolean {
  if (!isPlatform || mode !== 'direct' || hasIpv4Addon) return false
  return connectionMethod === 'direct' || (connectionMethod === 'transaction' && !useSharedPooler)
}

export function shouldShowSessionPoolerNotice({
  isPlatform,
  mode,
  connectionMethod,
}: {
  isPlatform: boolean
  mode: ConnectMode
  connectionMethod: FieldValue
}): boolean {
  return isPlatform && mode === 'direct' && connectionMethod === 'session'
}

export function shouldShowSelfHostedMcpNotice({
  isSelfHosted,
  mode,
}: {
  isSelfHosted: boolean
  mode: ConnectMode
}): boolean {
  return isSelfHosted && mode === 'mcp'
}

export function shouldFetchDataApiConfig({ mode }: { mode: ConnectMode }): boolean {
  return mode === 'framework'
}

export function shouldShowDataApiDisabledWarning({
  mode,
  isDataApiEnabled,
  isPending,
  isError,
}: {
  mode: ConnectMode
  isDataApiEnabled: boolean
  isPending: boolean
  isError: boolean
}): boolean {
  if (isPending || isError || isDataApiEnabled) return false
  return shouldFetchDataApiConfig({ mode })
}
