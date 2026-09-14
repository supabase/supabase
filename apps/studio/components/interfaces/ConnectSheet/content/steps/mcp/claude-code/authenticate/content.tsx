import { CodeBlock } from 'ui-patterns/CodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

function ClaudeAuthenticateContent(_props: StepContentProps) {
  return (
    <div className="space-y-2">
      <CodeBlock
        className="[&_code]:text-foreground"
        value="claude /mcp"
        hideLineNumbers
        language="bash"
      />
      <p className="text-sm text-foreground-lighter">
        Select the <code className="text-code-inline">supabase</code> server, then{' '}
        <code className="text-code-inline">Authenticate</code> to begin the flow.
      </p>
    </div>
  )
}

export default ClaudeAuthenticateContent
