'use client'

import { CommandCopyButton } from './command-copy-button'

export function InstallCommand({ command }: { command: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-surface-75 p-4">
      <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre-wrap break-words font-mono text-xs leading-6">
        <code>{command}</code>
      </pre>
      <CommandCopyButton command={command} />
    </div>
  )
}
