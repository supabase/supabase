import { Command } from 'lucide-react'
import { ReactNode } from 'react'

import { detectOS } from 'lib/helpers'
import { cn } from 'ui'

interface CommandOptionProps {
  icon: ReactNode
  label: string
  shortcut: string
  onClick: () => void
}

export const CommandOption = ({ icon, label, shortcut, onClick }: CommandOptionProps) => {
  const os = detectOS()

  return (
    <div
      className="px-2 py-1 transition hover:bg-surface-100 flex items-center justify-between rounded cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-x-2">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <div
        className={cn(
          'flex items-center gap-1',
          'h-6 py-1.5 px-2 leading-none',
          'bg-surface-100 text-foreground-lighter',
          'border border-default rounded-md',
          'shadow-xs shadow-background-surface-100'
        )}
      >
        {/* Issue with `os` and hydration fail */}
        {os === 'macos' || true ? (
          <Command size={11.5} strokeWidth={1.5} />
        ) : (
          <p className="text-xs">CTRL</p>
        )}
        <p className="text-xs font-mono">{shortcut}</p>
      </div>
    </div>
  )
}
