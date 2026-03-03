import { CodeBlock } from 'ui'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'
import { useMcpUrl } from '@/components/interfaces/ConnectSheet/useMcpUrl'

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
