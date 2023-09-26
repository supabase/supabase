import { useTheme } from 'next-themes'
import { useState } from 'react'
import {
  DropdownMenuGroup_Shadcn_,
  DropdownMenuRadioGroup_Shadcn_,
  DropdownMenuRadioItem_Shadcn_,
  DropdownMenu_Shadcn_,
  DropdownMenuContent_Shadcn_,
  IconMoon,
  IconSun,
  DropdownMenuTrigger_Shadcn_,
} from 'ui'

interface ThemeToggleProps {
  forceDark?: boolean
}

const ThemeToggle = ({ forceDark = false }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  // Conditionally force the theme to 'dark' when disabled is true
  const currentTheme = forceDark ? 'dark' : theme

  return (
    <DropdownMenu_Shadcn_ open={open} onOpenChange={() => setOpen(!open)} modal={false}>
      <DropdownMenuTrigger_Shadcn_ asChild disabled={forceDark}>
        <button
          id="user-settings-dropdown"
          className="flex items-center justify-center h-7 w-7 text"
        >
          <IconSun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <IconMoon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuTrigger_Shadcn_>
      <DropdownMenuContent_Shadcn_ align="end" className="w-60">
        <DropdownMenuGroup_Shadcn_>
          <DropdownMenuRadioGroup_Shadcn_
            value={currentTheme} // Use the currentTheme variable here
            onValueChange={(value) => {
              setTheme(value)
            }}
          >
            <DropdownMenuRadioItem_Shadcn_ value={'system'}>System</DropdownMenuRadioItem_Shadcn_>
            <DropdownMenuRadioItem_Shadcn_ value={'dark'}>Dark</DropdownMenuRadioItem_Shadcn_>
            <DropdownMenuRadioItem_Shadcn_ value={'light'}>Light</DropdownMenuRadioItem_Shadcn_>
          </DropdownMenuRadioGroup_Shadcn_>
        </DropdownMenuGroup_Shadcn_>
      </DropdownMenuContent_Shadcn_>
    </DropdownMenu_Shadcn_>
  )
}

export default ThemeToggle
