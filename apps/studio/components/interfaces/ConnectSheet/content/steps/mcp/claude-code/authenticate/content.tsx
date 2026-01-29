import { CodeBlock } from 'ui'

import type { StepContentProps } from '../../../../../Connect.types'

function ClaudeAuthenticateContent(_props: StepContentProps) {
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

export default ClaudeAuthenticateContent
