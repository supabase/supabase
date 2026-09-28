'use client'

import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useSyncExternalStore, type FocusEvent, type KeyboardEvent } from 'react'
import { cn, singleThemes, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import MenuIconPicker from './MenuIconPicker'

interface HeaderUtilityLinksProps {
  className?: string
}

interface ThemeOptionProps {
  value: string
  label: string
  isVisible: boolean
  onThemeSelect: (value: string) => void
}

const EXTERNAL_LINKS = [
  { label: 'GitHub', icon: 'github', href: 'https://github.com/supabase/supabase' },
  { label: 'Support', icon: 'support', href: 'https://supabase.com/support' },
] as const

const THEME_ICONS: Record<string, LucideIcon> = { system: Monitor, dark: Moon, light: Sun }

const ICON_BUTTON_CLASS_NAME =
  'flex size-7.5 items-center justify-center rounded-md text-foreground-lighter transition-colors hover:bg-surface-200 hover:text-foreground focus-ring'

const subscribeToNothing = () => () => {}

const useIsHydrated = () =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false
  )

export const HeaderUtilityLinks = ({ className }: HeaderUtilityLinksProps) => {
  const { theme, setTheme } = useTheme()
  const isHydrated = useIsHydrated()
  const [isThemeOpen, setIsThemeOpen] = useState(false)

  const currentTheme = (isHydrated && theme) || 'system'
  const CurrentIcon = THEME_ICONS[currentTheme] ?? Monitor
  const otherThemes = singleThemes.filter((option) => option.value !== currentTheme)

  const handleThemeToggle = () => setIsThemeOpen((isOpen) => !isOpen)
  const handleThemeSelect = (value: string) => {
    setTheme(value)
    setIsThemeOpen(false)
  }
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setIsThemeOpen(false)
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') setIsThemeOpen(false)
  }

  return (
    <div
      data-theme-open={isThemeOpen}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={cn('relative flex items-center gap-1', className)}
    >
      <span
        aria-hidden
        className="theme-swap-track pointer-events-none absolute inset-0 rounded-md border bg-surface-100"
      />
      {EXTERNAL_LINKS.map((link, index) => {
        const option = otherThemes[index]
        const order = EXTERNAL_LINKS.length - 1 - index

        return (
          <div
            key={link.label}
            className="relative z-10 size-7.5"
            style={{ '--theme-swap-order': order } as React.CSSProperties}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={link.label}
                  // the tooltip repeats the label, so screen readers would read it twice
                  aria-describedby={undefined}
                  inert={isThemeOpen}
                  className={cn(ICON_BUTTON_CLASS_NAME, 'theme-swap-link')}
                >
                  <MenuIconPicker icon={link.icon} />
                </a>
              </TooltipTrigger>
              <TooltipContent side="bottom">{link.label}</TooltipContent>
            </Tooltip>
            {option ? (
              <ThemeOption
                value={option.value}
                label={option.name}
                isVisible={isThemeOpen}
                onThemeSelect={handleThemeSelect}
              />
            ) : null}
          </div>
        )
      })}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            tabIndex={0}
            aria-label={`Theme: ${currentTheme}. Change theme`}
            aria-describedby={undefined}
            aria-expanded={isThemeOpen}
            onClick={handleThemeToggle}
            className={cn(ICON_BUTTON_CLASS_NAME, 'theme-swap-current relative')}
          >
            <CurrentIcon size={16} strokeWidth={1.5} aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Change theme</TooltipContent>
      </Tooltip>
    </div>
  )
}

const ThemeOption = ({ value, label, isVisible, onThemeSelect }: ThemeOptionProps) => {
  const Icon = THEME_ICONS[value] ?? Monitor
  const handleClick = () => onThemeSelect(value)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          tabIndex={0}
          aria-label={`${label} theme`}
          aria-describedby={undefined}
          inert={!isVisible}
          onClick={handleClick}
          className={cn(ICON_BUTTON_CLASS_NAME, 'theme-swap-option absolute inset-0 z-10')}
        >
          <Icon size={16} strokeWidth={1.5} aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{`${label} theme`}</TooltipContent>
    </Tooltip>
  )
}
