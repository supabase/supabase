import { CodeBlock } from 'ui'

import type { StepContentProps } from '../../../../../Connect.types'

function CodexAuthenticateContent(_props: StepContentProps) {
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

export default CodexAuthenticateContent
