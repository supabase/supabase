import { useMemo } from 'react'
import { CodeBlock } from 'ui'

import { IS_PLATFORM } from 'lib/constants'
import { FEATURE_GROUPS_NON_PLATFORM, FEATURE_GROUPS_PLATFORM } from 'ui-patterns/McpUrlBuilder'
import type { StepContentProps } from '../../../../../Connect.types'

function useMcpUrl(
  state: StepContentProps['state'],
  projectKeys: StepContentProps['projectKeys']
): string {
  const readonly = Boolean(state.mcpReadonly)
  const selectedFeatures = Array.isArray(state.mcpFeatures) ? state.mcpFeatures : []
  const baseUrl = IS_PLATFORM ? 'https://mcp.supabase.com' : projectKeys.apiUrl ?? ''

  return useMemo(() => {
    const params = new URLSearchParams()
    if (readonly) params.set('readonly', 'true')

    const supportedFeatures = IS_PLATFORM ? FEATURE_GROUPS_PLATFORM : FEATURE_GROUPS_NON_PLATFORM
    const validFeatures = selectedFeatures.filter((f) =>
      supportedFeatures.some((group) => group.id === f)
    )
    if (validFeatures.length > 0) {
      params.set('features', validFeatures.join(','))
    }

    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }, [baseUrl, readonly, selectedFeatures])
}

function ClaudeAddServerContent({ state, projectKeys }: StepContentProps) {
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

export default ClaudeAddServerContent
