import { ProfileImage } from 'components/ui/ProfileImage'
import { Command, FlaskConical } from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  singleThemes,
  Theme,
} from 'ui'
import { useSetCommandMenuOpen } from 'ui-patterns'

import { useFeaturePreviewModal } from './App/FeaturePreview/FeaturePreviewContext'

export const LocalDropdown = () => {
  const { theme, setTheme } = useTheme()
  const setCommandMenuOpen = useSetCommandMenuOpen()
  const { toggleFeaturePreviewModal } = useFeaturePreviewModal()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="border flex-shrink-0 px-3" asChild>
        <Button
          type="default"
          className="[&>span]:flex px-0 py-0 rounded-full overflow-hidden h-8 w-8"
        >
          <ProfileImage className="w-8 h-8 rounded-md" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-44">
        <DropdownMenuItem
          className="flex gap-2"
          onClick={() => toggleFeaturePreviewModal(true)}
          onSelect={() => toggleFeaturePreviewModal(true)}
        >
          <FlaskConical size={14} strokeWidth={1.5} className="text-foreground-lighter" />
          Feature previews
        </DropdownMenuItem>
        <DropdownMenuItem className="flex gap-2" onClick={() => setCommandMenuOpen(true)}>
          <Command size={14} strokeWidth={1.5} className="text-foreground-lighter" />
          Command menu
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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
