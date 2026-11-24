import { CodeBlock } from 'ui-patterns/CodeBlock'

import { INSTALL_COMMANDS } from '@/components/interfaces/ConnectSheet/connect.schema'

const command = [
  INSTALL_COMMANDS.supabasedotnet,
  'dotnet add package Supabase.Extensions.DependencyInjection',
].join('\n')

const InstallContent = () => {
  return (
    <CodeBlock className="[&_code]:text-foreground" value={command} hideLineNumbers language="bash">
      {command}
    </CodeBlock>
  )
}

// Used as a dynamic import
export default InstallContent
