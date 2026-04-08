import { LOCAL_STORAGE_KEYS, useBreakpoint } from 'common'
import type { ReactNode } from 'react'
import { cn, KeyboardShortcut } from 'ui'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

export interface ToolbarButtonConfig {
  id: string
  sidebarKey: string
  icon: ReactNode | ((isOpen: boolean) => ReactNode)
  tooltipText: string
  keyboardShortcut?: string[]
  showKeyboardShortcut?: boolean
  badge?: ReactNode
}

export const ToolbarButton = ({
  id,
  sidebarKey,
  icon,
  tooltipText,
  keyboardShortcut,
  showKeyboardShortcut = true,
  badge,
}: ToolbarButtonConfig) => {
  const { activeSidebar, toggleSidebar } = useSidebarManagerSnapshot()
  const isMobile = useBreakpoint('md')
  const [isHotkeyEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_SIDEBAR(sidebarKey),
    true
  )

  const isOpen = activeSidebar?.id === sidebarKey

  const handleClick = () => {
    toggleSidebar(sidebarKey)
  }

  const shouldShowShortcut = Boolean(
    showKeyboardShortcut && isHotkeyEnabled && keyboardShortcut?.length
  )
  const renderedIcon = typeof icon === 'function' ? icon(isOpen) : icon

  return (
    <div className="relative">
      <ButtonTooltip
        type={isOpen ? 'secondary' : 'outline'}
        size="tiny"
        id={id}
        aria-label={tooltipText}
        className={cn(
          'group flex h-8 w-8 shrink-0 items-center justify-center rounded-full p-0',
          !isOpen &&
            'border-transparent text-foreground-light hover:text-foreground [&_svg]:text-current'
        )}
        onClick={handleClick}
        tooltip={{
          content: {
            className: shouldShowShortcut ? 'p-1 pl-2.5' : 'py-1.5 px-2.5',
            side: isMobile ? 'top' : 'left',
            text:
              shouldShowShortcut && keyboardShortcut ? (
                <div className="flex items-center gap-2.5">
                  <span>{tooltipText}</span>
                  <KeyboardShortcut keys={keyboardShortcut} />
                </div>
              ) : (
                tooltipText
              ),
          },
        }}
      >
        {renderedIcon}
      </ButtonTooltip>
      {badge}
    </div>
  )
}
