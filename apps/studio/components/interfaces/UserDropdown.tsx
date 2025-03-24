import { Command, FlaskConical, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useSignOut } from 'lib/auth'
import { IS_PLATFORM } from 'lib/constants'
import { useProfile } from 'lib/profile'
import { useAppStateSnapshot } from 'state/app-state'
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
  Theme,
  singleThemes,
} from 'ui'
import { useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'

export function UserDropdown() {
  const { profile } = useProfile()
  const appStateSnapshot = useAppStateSnapshot()
  const { theme, setTheme } = useTheme()
  const signOut = useSignOut()
  const router = useRouter()

  const setCommandMenuOpen = useSetCommandMenuOpen()

  // const { setAiAssistantPanel, aiAssistantPanel } = useAppStateSnapshot()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="border flex-shrink-0 px-3" asChild>
        <Button
          type="default"
          className="[&>span]:flex px-0 py-0 rounded-full overflow-hidden h-8 w-8"
        >
          <img
            className="aspect-square h-8 w-8 rounded-md border"
            alt="shadcn"
            src="https://avatars.githubusercontent.com/u/8291514?s=96&v=4"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="bottom" align="end">
        {IS_PLATFORM && (
          <>
            <div className="px-2 py-1 flex flex-col gap-0 text-sm">
              {profile && (
                <>
                  <span
                    title={profile.username}
                    className="w-full text-left text-foreground truncate"
                  >
                    {profile.username}
                  </span>
                  {profile.primary_email !== profile.username && (
                    <span
                      title={profile.primary_email}
                      className="w-full text-left text-foreground-light text-xs truncate"
                    >
                      {profile.primary_email}
                    </span>
                  )}
                </>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="flex gap-2" asChild>
                <Link href="/account/me">
                  <Settings size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                  Account preferences
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex gap-2"
                onClick={() => appStateSnapshot.setShowFeaturePreviewModal(true)}
                onSelect={() => appStateSnapshot.setShowFeaturePreviewModal(true)}
              >
                <FlaskConical size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                Feature previews
              </DropdownMenuItem>
              <DropdownMenuItem className="flex gap-2" onClick={() => setCommandMenuOpen(true)}>
                <Command size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                Command menu
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </DropdownMenuGroup>
          </>
        )}
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
        {IS_PLATFORM && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={async () => {
                  await signOut()
                  await router.push('/sign-in')
                }}
              >
                Log out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
