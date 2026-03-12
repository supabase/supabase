import { CodeBlock } from 'ui'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'

function CodexEnableRemoteContent(_props: StepContentProps) {
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

export default CodexEnableRemoteContent
