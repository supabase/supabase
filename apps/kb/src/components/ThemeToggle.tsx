import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  singleThemes,
} from 'ui'

export interface ThemeToggleProps {
  className?: string
}

type ThemeChoice = 'system' | 'dark' | 'light'

const isThemeChoice = (value: string | null): value is ThemeChoice =>
  value === 'system' || value === 'dark' || value === 'light'

const readStoredChoice = (): ThemeChoice => {
  try {
    const stored = localStorage.getItem('theme')
    return isThemeChoice(stored) ? stored : 'dark'
  } catch {
    return 'dark'
  }
}

// writes the same `data-theme` attribute and `theme` key the no-flash script in Layout.astro reads
const applyTheme = (choice: ThemeChoice) => {
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = choice === 'system' ? (isSystemDark ? 'dark' : 'light') : choice
  // same trick as next-themes' disableTransitionOnChange: without it, every
  // transition-colors element fades between themes while the rest snaps
  const freeze = document.createElement('style')
  freeze.textContent = '*,*::before,*::after{transition:none!important}'
  document.head.appendChild(freeze)
  document.documentElement.setAttribute('data-theme', resolved)
  // reading a property forces the style flush while transitions are frozen
  void window.getComputedStyle(document.body).opacity
  window.setTimeout(() => freeze.remove(), 1)
  try {
    localStorage.setItem('theme', choice)
  } catch {
    // localStorage unavailable (e.g. private browsing) — theme just won't persist.
  }
}

// same menu as ui-patterns/ThemeToggle (used in www's footer), without next-themes.
// render with client:only since the current choice lives in localStorage
export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const [choice, setChoice] = useState(readStoredChoice)

  const handleChoiceChange = (value: string) => {
    if (!isThemeChoice(value)) return
    setChoice(value)
    applyTheme(value)
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex size-7 items-center justify-center rounded-md text-foreground-light hover:text-foreground focus-ring',
            className
          )}
        >
          <Moon aria-hidden className="hidden size-5 dark:block" />
          <Sun aria-hidden className="block size-5 dark:hidden" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuRadioGroup value={choice} onValueChange={handleChoiceChange}>
          {singleThemes.map((theme) => (
            <DropdownMenuRadioItem key={theme.value} value={theme.value}>
              {theme.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
