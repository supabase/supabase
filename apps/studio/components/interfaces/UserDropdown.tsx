import { Command, FlaskConical, Loader2, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { ProfileImage } from 'components/ui/ProfileImage'
import { useProfileIdentitiesQuery } from 'data/profile/profile-identities-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSignOut } from 'lib/auth'
import { IS_PLATFORM } from 'lib/constants'
import { getGitHubProfileImgUrl } from 'lib/github'
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
import { useFeaturePreviewModal } from './App/FeaturePreview/FeaturePreviewContext'

export function UserDropdown() {
  const router = useRouter()
  const signOut = useSignOut()
  const { profile, isLoading: isLoadingProfile } = useProfile()
  const { theme, setTheme } = useTheme()
  const appStateSnapshot = useAppStateSnapshot()
  const setCommandMenuOpen = useSetCommandMenuOpen()
  const { openFeaturePreviewModal } = useFeaturePreviewModal()
  const profileShowEmailEnabled = useIsFeatureEnabled('profile:show_email')

  const { username, primary_email } = profile ?? {}

  const { data, isLoading: isLoadingIdentities } = useProfileIdentitiesQuery()
  const isGitHubProfile = profile?.auth0_id.startsWith('github')
  const gitHubUsername = isGitHubProfile
    ? (data?.identities ?? []).find((x) => x.provider === 'github')?.identity_data?.user_name
    : undefined
  const profileImageUrl = isGitHubProfile ? getGitHubProfileImgUrl(gitHubUsername) : undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="border flex-shrink-0 px-3" asChild>
        <Button
          type="default"
          className="[&>span]:flex px-0 py-0 rounded-full overflow-hidden h-8 w-8"
        >
          {isLoadingProfile || isLoadingIdentities ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-foreground-lighter" size={16} />
            </div>
          ) : (
            <ProfileImage
              alt={profile?.username}
              src={profileImageUrl}
              className="w-8 h-8 rounded-md"
            />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="bottom" align="end">
        {IS_PLATFORM && (
          <>
            <div className="px-2 py-1 flex flex-col gap-0 text-sm">
              {profile && (
                <>
                  <span title={username} className="w-full text-left text-foreground truncate">
                    {username}
                  </span>
                  {primary_email !== username && profileShowEmailEnabled && (
                    <span
                      title={primary_email}
                      className="w-full text-left text-foreground-light text-xs truncate"
                    >
                      {primary_email}
                    </span>
                  )}
                </>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="flex gap-2" asChild>
                <Link
                  href="/account/me"
                  onClick={() => {
                    if (router.pathname !== '/account/me') {
                      appStateSnapshot.setLastRouteBeforeVisitingAccountPage(router.asPath)
                    }
                  }}
                >
                  <Settings size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                  Account preferences
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex gap-2"
                onClick={openFeaturePreviewModal}
                onSelect={openFeaturePreviewModal}
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
