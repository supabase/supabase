import { Search } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { cn, KeyboardShortcut } from 'ui'

import { openKbSearch } from './KbSearch'

const subscribeToNothing = () => () => {}

const getIsMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent)

const getIsMacOnServer = () => false

export const HeroSearch = () => {
  const isMac = useSyncExternalStore(subscribeToNothing, getIsMac, getIsMacOnServer)

  return (
    <button
      type="button"
      aria-keyshortcuts="Meta+K Control+K"
      onClick={openKbSearch}
      className={cn(
        'relative flex h-12 w-full items-center gap-2.5 rounded-lg pl-3 pr-4',
        'border border-default bg-surface-75 text-left text-base text-foreground-lighter shadow-raised',
        'transition-colors hover:border-strong hover:text-foreground-light focus-ring'
      )}
    >
      <Search aria-hidden className="size-4.5 shrink-0" strokeWidth={2.25} />
      <span className="flex-1 truncate">Search guides</span>
      <KeyboardShortcut keys={[isMac ? '⌘' : 'Ctrl', 'K']} />
    </button>
  )
}
