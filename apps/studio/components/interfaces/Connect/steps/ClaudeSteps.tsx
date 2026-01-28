import { useMemo } from 'react'
import { CodeBlock } from 'ui'

import { IS_PLATFORM } from 'lib/constants'
import { FEATURE_GROUPS_NON_PLATFORM, FEATURE_GROUPS_PLATFORM } from 'ui-patterns/McpUrlBuilder'
import type { ConnectState, ProjectKeys } from '../Connect.types'

interface ClaudeStepProps {
  state: ConnectState
  projectKeys: ProjectKeys
}

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

export function ClaudeAddServerStep({ state, projectKeys }: ClaudeStepProps) {
  const mcpUrl = useMcpUrl(state, projectKeys)
  const command = `claude mcp add --scope project --transport http supabase "${mcpUrl}"`

  return (
    <CodeBlock
      className="[&_code]:text-foreground"
      value={command}
      hideLineNumbers
      language="bash"
    />
  )
}

export function ClaudeAuthenticateStep({}: ClaudeStepProps) {
  return (
    <div className="space-y-2">
      <CodeBlock
        className="[&_code]:text-foreground"
        value="claude /mcp"
        hideLineNumbers
        language="bash"
      />
      <p className="text-sm text-foreground-light">
        Select the <code className="text-xs bg-surface-300 px-1 py-0.5 rounded">supabase</code>{' '}
        server, then <span className="font-medium">Authenticate</span> to begin the flow.
      </p>
    </div>
  )
}
