import { LOCAL_STORAGE_KEYS, useBreakpoint } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import type { ReactNode } from 'react'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { cn, KeyboardShortcut } from 'ui'

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
  const isMobile = useBreakpoint()
  const [isHotkeyEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.HOTKEY_SIDEBAR(sidebarKey),
    true
  )

  const isOpen = activeSidebar?.id === sidebarKey

  const handleClick = () => {
    toggleSidebar(sidebarKey)
  }

  const shouldShowShortcut = showKeyboardShortcut && isHotkeyEnabled && keyboardShortcut
  const renderedIcon = typeof icon === 'function' ? icon(isOpen) : icon

  return (
    <div className="relative">
      <ButtonTooltip
        type="outline"
        size="tiny"
        id={id}
        className={cn(
          'rounded-full w-[32px] h-[32px] flex items-center justify-center p-0 text-foreground-light hover:text-foreground group',
          'border-transparent',
          isOpen && 'bg-foreground text-background hover:text-background'
        )}
        onClick={handleClick}
        tooltip={{
          content: {
            className: shouldShowShortcut ? 'p-1 pl-2.5' : 'py-1.5 px-2.5',
            side: isMobile ? 'top' : 'left',
            text: shouldShowShortcut ? (
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
