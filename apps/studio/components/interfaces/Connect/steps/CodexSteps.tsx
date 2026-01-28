import { useMemo } from 'react'
import { CodeBlock } from 'ui'

import { IS_PLATFORM } from 'lib/constants'
import { FEATURE_GROUPS_NON_PLATFORM, FEATURE_GROUPS_PLATFORM } from 'ui-patterns/McpUrlBuilder'
import type { ConnectState, ProjectKeys } from '../Connect.types'

interface CodexStepProps {
  state: ConnectState
  projectKeys: ProjectKeys
}

/**
 * Builds the MCP URL with parameters
 */
function useMcpUrl(state: ConnectState, projectKeys: ProjectKeys): string {
  const readonly = Boolean(state.mcpReadonly)
  const selectedFeatures = Array.isArray(state.mcpFeatures) ? state.mcpFeatures : []
  const supportedFeatures = IS_PLATFORM ? FEATURE_GROUPS_PLATFORM : FEATURE_GROUPS_NON_PLATFORM

  return useMemo(() => {
    const baseUrl = IS_PLATFORM ? 'https://mcp.supabase.com' : (projectKeys.apiUrl ?? '')

    const params = new URLSearchParams()
    if (readonly) params.set('readonly', 'true')
    
    const validFeatures = selectedFeatures.filter((f) =>
      supportedFeatures.some((group) => group.id === f)
    )
    if (validFeatures.length > 0) {
      params.set('features', validFeatures.join(','))
    }

    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }, [readonly, selectedFeatures, projectKeys.apiUrl, supportedFeatures])
}

/**
 * Step 1: Add the Supabase MCP server to Codex
 */
export function CodexAddServerStep({ state, projectKeys }: CodexStepProps) {
  const mcpUrl = useMcpUrl(state, projectKeys)
  const command = `codex mcp add supabase --url ${mcpUrl}`

  return (
    <CodeBlock
      className="[&_code]:text-foreground"
      value={command}
      hideLineNumbers
      language="bash"
    />
  )
}

/**
 * Step 2: Enable remote MCP client support
 */
export function CodexEnableRemoteStep({}: CodexStepProps) {
  const configContent = `[mcp]
remote_mcp_client_enabled = true`

  return (
    <CodeBlock
      className="[&_code]:text-foreground"
      value={configContent}
      hideLineNumbers
      language="toml"
    />
  )
}

/**
 * Step 3: Authenticate
 */
export function CodexAuthenticateStep({}: CodexStepProps) {
  const command = 'codex mcp login supabase'

  return (
    <CodeBlock
      className="[&_code]:text-foreground"
      value={command}
      hideLineNumbers
      language="bash"
    />
  )
}

/**
 * Step 4: Verify authentication
 */
export function CodexVerifyStep({}: CodexStepProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground-light">
        Run <code className="text-xs bg-surface-300 px-1 py-0.5 rounded">/mcp</code> inside Codex to verify authentication.
      </p>
    </div>
  )
}
