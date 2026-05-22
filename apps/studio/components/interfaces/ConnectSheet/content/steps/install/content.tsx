import { Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, copyToClipboard } from 'ui'

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
  const [copyLabel, setCopyLabel] = useState('Copy')

  if (!installCommand) {
    return null
  }

  const handleCopy = () => {
    copyToClipboard(installCommand, () => {
      setCopyLabel('Copied')
      setTimeout(() => setCopyLabel('Copy'), 2000)
    })
  }

  return (
    <div className="relative group">
      <div className="bg-surface-75 border rounded-lg p-3 pr-20 font-mono text-sm text-foreground-light overflow-x-auto">
        <code>{installCommand}</code>
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2">
        <Button
          type="default"
          size="tiny"
          icon={<Copy size={14} />}
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copyLabel}
        </Button>
      </div>
    </div>
  )
}

export default InstallContent
