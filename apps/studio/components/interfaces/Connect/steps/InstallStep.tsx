import { Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, copyToClipboard } from 'ui'

import type { ConnectState, ProjectKeys } from '../Connect.types'
import { FRAMEWORKS, MOBILES } from '../Connect.constants'
import { INSTALL_COMMANDS } from '../connect.schema'

interface InstallStepProps {
  state: ConnectState
  projectKeys: ProjectKeys
}

/**
 * Gets the install command for the current framework selection.
 */
function getInstallCommand(state: ConnectState): string | null {
  const { framework, frameworkVariant, library } = state

  if (!framework) return null

  // Try to find the library key to look up install command
  const allFrameworks = [...FRAMEWORKS, ...MOBILES]
  const selectedFramework = allFrameworks.find((f) => f.key === framework)

  if (!selectedFramework) return null

  // If there's a library selected, use that
  if (library && INSTALL_COMMANDS[String(library)]) {
    return INSTALL_COMMANDS[String(library)]
  }

  // Try to find the library from the framework structure
  let libraryKey: string | null = null

  if (selectedFramework.children?.length) {
    if (frameworkVariant) {
      // Has variants - look in the selected variant
      const variant = selectedFramework.children.find((c) => c.key === frameworkVariant)
      if (variant?.children?.length) {
        libraryKey = variant.children[0].key
      }
    } else {
      // No variants - look in first child
      const firstChild = selectedFramework.children[0]
      if (firstChild?.children?.length) {
        libraryKey = firstChild.children[0].key
      } else {
        libraryKey = firstChild.key
      }
    }
  }

  if (libraryKey && INSTALL_COMMANDS[libraryKey]) {
    return INSTALL_COMMANDS[libraryKey]
  }

  return null
}

export function InstallStep({ state }: InstallStepProps) {
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
      <div className="bg-surface-100 border rounded-lg p-3 pr-20 font-mono text-sm text-foreground-light overflow-x-auto">
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
