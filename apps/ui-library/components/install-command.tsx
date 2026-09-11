'use client'

import { CommandCopyButton } from './command-copy-button'
import { TerminalCode } from './terminal-code'

export function InstallCommand({ command }: { command: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-surface-75 p-4">
      <TerminalCode command={command} />
      <CommandCopyButton command={command} />
    </div>
  )
}
