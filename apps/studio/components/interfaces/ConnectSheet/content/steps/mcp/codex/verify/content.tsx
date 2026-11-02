import { CodeBlock } from 'ui-patterns/CodeBlock'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

function CodexVerifyContent(_props: StepContentProps) {
  return (
    <div className="space-y-2">
      <CodeBlock
        className="[&_code]:text-foreground"
        value="/mcp"
        hideLineNumbers
        language="bash"
      />
      <p className="text-sm text-foreground-lighter">
        Run this inside Codex to verify authentication.
      </p>
    </div>
  )
}

export default CodexVerifyContent
