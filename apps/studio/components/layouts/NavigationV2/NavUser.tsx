import { useFeaturePreviewModal } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ProfileImage } from 'components/ui/ProfileImage'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from 'lib/constants'
import { useProfileNameAndPicture } from 'lib/profile'
import { ChevronsUpDown, FlaskConical, Loader2, LogOut, ScrollText, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/router'
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  singleThemes,
  Theme,
  useSidebar,
} from 'ui'

export function NavUser() {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const appStateSnapshot = useAppStateSnapshot()
  const profileShowEmailEnabled = useIsFeatureEnabled('profile:show_email')
  const { username, primaryEmail, avatarUrl, isLoading } = useProfileNameAndPicture()
  const { openFeaturePreviewModal } = useFeaturePreviewModal()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {isLoading ? (
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Loader2 className="animate-spin text-foreground-lighter" size={16} />
                </div>
              ) : (
                <ProfileImage alt={username} src={avatarUrl} className="size-8 rounded-full" />
              )}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{username}</span>
                {primaryEmail !== username && profileShowEmailEnabled && (
                  <span className="truncate text-xs text-foreground-light">{primaryEmail}</span>
                )}
              </div>
              <ChevronsUpDown
                strokeWidth={1}
                className="ml-auto text-foreground-light hidden group-hover:block !w-4 !h-4"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            {IS_PLATFORM && (
              <>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <ProfileImage alt={username} src={avatarUrl} className="size-8 rounded-full" />
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{username}</span>
                      {primaryEmail !== username && profileShowEmailEnabled && (
                        <span className="truncate text-xs text-foreground-light">
                          {primaryEmail}
                        </span>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
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
                  <DropdownMenuItem className="flex gap-2" asChild>
                    <Link
                      href="https://supabase.com/changelog"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ScrollText size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                      Changelog
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuGroup>
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value)}>
                {singleThemes.map((t: Theme) => (
                  <DropdownMenuRadioItem key={t.value} value={t.value}>
                    {t.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            {IS_PLATFORM && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() => {
                      router.push('/logout')
                    }}
                  >
                    <LogOut size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
