import { CodeBlock } from 'ui'

import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'
import examples from '@/components/interfaces/ConnectSheet/DirectConnectionExamples'

/**
 * Step component for direct connection install commands.
 */
function DirectInstallContent({ state }: StepContentProps) {
  const connectionType = (state.connectionType as string) ?? 'uri'
  const example = examples[connectionType as keyof typeof examples]
  const exampleInstallCommands = example?.installCommands ?? []

  if (exampleInstallCommands.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      {exampleInstallCommands.map((cmd) => (
        <CodeBlock
          key={`example-install-command-${cmd}`}
          className="[&_code]:text-foreground"
          wrapperClassName="lg:col-span-2"
          value={cmd}
          hideLineNumbers
          language="bash"
        >
          {cmd}
        </CodeBlock>
      ))}
    </div>
  )
}

export default DirectInstallContent
