import { CodeBlock } from 'ui'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

function CodexAuthenticateContent(_props: StepContentProps) {
  return (
    <CodeBlock
      className="[&_code]:text-foreground"
      value="codex mcp login supabase"
      hideLineNumbers
      language="bash"
    />
  )
}

export default CodexAuthenticateContent
