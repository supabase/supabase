import { useMemo } from 'react'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import {
  EXTRA_PACKAGES,
  INSTALL_COMMANDS,
} from '@/components/interfaces/ConnectSheet/connect.schema'
import type { StepContentProps } from '@/components/interfaces/ConnectSheet/Connect.types'
import { resolveFrameworkLibraryKey } from '@/components/interfaces/ConnectSheet/Connect.utils'

/**
 * Gets the install command for the current framework selection.
 * Appends any framework-specific extra packages from EXTRA_PACKAGES,
 * checking the most specific key first (framework/variant), then framework-only.
 */
function getInstallCommand(state: StepContentProps['state']): string | null {
  const libraryKey = resolveFrameworkLibraryKey(state)
  if (!libraryKey || !INSTALL_COMMANDS[libraryKey]) return null

  let command = INSTALL_COMMANDS[libraryKey]

  const { framework, frameworkVariant } = state
  if (framework) {
    const extraMap = EXTRA_PACKAGES[libraryKey]
    const extras =
      (frameworkVariant && extraMap?.[`${framework}/${frameworkVariant}`]) ||
      extraMap?.[String(framework)]
    if (extras?.length) {
      command += ' ' + extras.join(' ')
    }
  }

  return command
}

function InstallContent({ state }: StepContentProps) {
  const installCommand = useMemo(() => getInstallCommand(state), [state])

  if (!installCommand) {
    return null
  }

  return (
    <CodeBlock
      className="[&_code]:text-foreground"
      wrapperClassName="lg:col-span-2"
      value={installCommand}
      hideLineNumbers
      language="bash"
    >
      {installCommand}
    </CodeBlock>
  )
}

export default InstallContent
