import { logOut, useUser } from 'common/auth'
import { House, LifeBuoy } from 'lucide-react'
import { useState } from 'react'
import { DropdownMenuItem, DropdownMenuSeparator, GithubIcon } from 'ui'
import {
  TopNavAccountItems,
  TopNavDropdown,
  TopNavSignOutItem,
  TopNavThemeGroup,
} from 'ui-patterns/TopNav/TopNavDropdown'

export interface HeaderMenuProps {
  className?: string
}

interface SignOutItemProps {
  onSignOut: () => void
}

type ThemeChoice = 'system' | 'dark' | 'light'

export const EXTERNAL_LINKS = [
  { label: 'Supabase.com', href: 'https://supabase.com', Icon: House },
  { label: 'GitHub', href: 'https://github.com/supabase/supabase', Icon: GithubIcon },
  { label: 'Support', href: 'https://supabase.com/support', Icon: LifeBuoy },
]

const isThemeChoice = (value: string | null): value is ThemeChoice =>
  value === 'system' || value === 'dark' || value === 'light'

const readStoredChoice = (): ThemeChoice => {
  try {
    const stored = localStorage.getItem('theme')
    return isThemeChoice(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

// writes the same `data-theme` attribute and `theme` key the no-flash script in Layout.astro reads
const applyTheme = (choice: ThemeChoice) => {
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = choice === 'system' ? (isSystemDark ? 'dark' : 'light') : choice
  // without this, transition-colors elements fade between themes while the rest change at once
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
    // private browsing can block localStorage, so the choice does not persist
  }
}

export const useThemeChoice = () => {
  const [choice, setChoice] = useState(readStoredChoice)

  const handleChoiceChange = (value: string) => {
    if (!isThemeChoice(value)) return
    setChoice(value)
    applyTheme(value)
  }

  return { choice, onChoiceChange: handleChoiceChange }
}

export const HeaderMenu = ({ className }: HeaderMenuProps) => {
  const { choice, onChoiceChange } = useThemeChoice()
  const [statusMessage, setStatusMessage] = useState('')

  const handleSignOut = async () => {
    await logOut()
    setStatusMessage('Signed out')
  }

  return (
    <>
      <TopNavDropdown className={className}>
        <AccountItems />
        {EXTERNAL_LINKS.map(({ label, href, Icon }) => (
          <DropdownMenuItem key={href} asChild className="gap-2">
            <a href={href} target="_blank" rel="noreferrer noopener">
              <Icon aria-hidden className="size-4 text-foreground-lighter" strokeWidth={1.5} />
              {label}
            </a>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <TopNavThemeGroup value={choice} onValueChange={onChoiceChange} />
        <SignOutItem onSignOut={handleSignOut} />
      </TopNavDropdown>
      <span role="status" className="sr-only">
        {statusMessage}
      </span>
    </>
  )
}

const AccountItems = () => {
  const user = useUser()
  if (!user) return null

  return (
    <>
      <TopNavAccountItems email={user.email} />
      <DropdownMenuSeparator />
    </>
  )
}

const SignOutItem = ({ onSignOut }: SignOutItemProps) => {
  const user = useUser()
  if (!user) return null

  return (
    <>
      <DropdownMenuSeparator />
      <TopNavSignOutItem onSelect={onSignOut} />
    </>
  )
}
