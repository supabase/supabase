import { Command, FlaskConical, Palette, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { ProfileImage } from 'components/ui/ProfileImage'
import { useSignOut } from 'lib/auth'
import { IS_PLATFORM } from 'lib/constants'
import { useProfile } from 'lib/profile'
import { useAppStateSnapshot } from 'state/app-state'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarMenuButton,
  Theme,
  cn,
  singleThemes,
} from 'ui'
import { useSetCommandMenuOpen } from 'ui-patterns/CommandMenu'
import { ICON_SIZE, ICON_STROKE_WIDTH, SideBarNavLink } from './Sidebar'

export const UserDropdown = () => {
  const { profile } = useProfile()
  const appStateSnapshot = useAppStateSnapshot()
  const { theme, setTheme } = useTheme()
  const signOut = useSignOut()
  const router = useRouter()

  const setCommandMenuOpen = useSetCommandMenuOpen()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          className={cn(
            'text-sm',
            'group-data-[state=expanded]:h-10',
            'p-0.5 group-data-[state=expanded]:pr-2 group-data-[state=expanded]:pl-1'
          )}
          size={'default'}
          hasIcon={false}
          asChild
          isActive={false}
        >
          <button>
            <div className="aspect-square h-7 w-7 rounded-md border flex-shrink-0">
              <ProfileImage
                alt={profile?.username}
                src={profile?.profileImageUrl}
                className="w-7 h-7 rounded-md"
              />
            </div>
            <span className="flex flex-col gap-0">
              {profile?.username}
              <span className="text-foreground-lighter text-xs">{profile?.primary_email}</span>
            </span>
          </button>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start">
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
