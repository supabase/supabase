import { Palette } from 'lucide-react'
import { useTheme } from 'next-themes'

import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  sidebarMenuButtonVariants,
  singleThemes,
  Theme,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import {
  DEFAULT_SIDEBAR_BEHAVIOR,
  ICON_SIZE,
  ICON_STROKE_WIDTH,
  SidebarBehaviourType,
} from './Sidebar'

export const ThemeDropdown = () => {
  const { theme, setTheme } = useTheme()
  const [sidebarBehaviour] = useLocalStorageQuery<SidebarBehaviourType>(
    LOCAL_STORAGE_KEYS.SIDEBAR_BEHAVIOR,
    DEFAULT_SIDEBAR_BEHAVIOR
  )

  const button = (
    <button
      data-sidebar="menu-button"
      data-has-icon={true}
      className={cn(
        sidebarMenuButtonVariants({ variant: 'default', size: 'default', hasIcon: true })
      )}
    >
      <Palette size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />
      <span>Theme</span>
    </button>
  )

  return (
    <DropdownMenu>
      {sidebarBehaviour === 'closed' ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right" align="center">
            <span>Theme</span>
          </TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
      )}
      <DropdownMenuContent side="top" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value) => {
              setTheme(value)
            }}
          >
            {singleThemes.map((theme: Theme) => (
              <DropdownMenuRadioItem key={theme.value} value={theme.value}>
                {theme.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
