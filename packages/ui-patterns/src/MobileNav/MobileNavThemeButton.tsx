'use client'

import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { buttonVariants, cn, singleThemes } from 'ui'

export interface MobileNavThemeButtonProps {
  value: string | undefined
  onValueChange: (value: string) => void
  className?: string
}

export const MobileNavThemeButton = ({
  value,
  onValueChange,
  className,
}: MobileNavThemeButtonProps) => {
  // the stored theme is unknown on the server, so the first render shows system
  const isHydrated = useSyncExternalStore(subscribeToNothing, getTrue, getFalse)
  const index = Math.max(
    singleThemes.findIndex((theme) => theme.value === (isHydrated ? value : 'system')),
    0
  )
  const current = singleThemes[index]
  const next = singleThemes[(index + 1) % singleThemes.length]
  const Icon = THEME_ICONS[current.value] ?? Monitor

  const handleThemeCycle = () => onValueChange(next.value)

  return (
    <button
      type="button"
      aria-label={`Theme: ${current.name}. Switch to ${next.name}`}
      onClick={handleThemeCycle}
      className={cn(
        buttonVariants({ variant: 'default' }),
        'relative size-7.5 min-w-7.5 shrink-0 rounded-md border-default bg-surface-100/75 px-0',
        'text-foreground-light',
        "before:absolute before:-inset-y-2 before:-left-3 before:right-0 before:content-['']",
        className
      )}
    >
      <Icon aria-hidden strokeWidth={1} className="size-4.5" />
    </button>
  )
}

const subscribeToNothing = () => () => {}
const getTrue = () => true
const getFalse = () => false

const THEME_ICONS: Record<string, LucideIcon> = {
  system: Monitor,
  dark: Moon,
  light: Sun,
}
