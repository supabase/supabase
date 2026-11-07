import { CodeBlock } from 'ui-patterns/CodeBlock'
import { getCodexAuthenticateCommand } from 'ui-patterns/McpUrlBuilder/clients.data'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

function CodexAuthenticateContent({ state }: StepContentProps) {
  const command = getCodexAuthenticateCommand(Boolean(state.mcpReadonly))

  return (
    <CodeBlock
      className="[&_code]:text-foreground"
      value={command}
      hideLineNumbers
      language="bash"
    />
  )
}

export default CodexAuthenticateContent
