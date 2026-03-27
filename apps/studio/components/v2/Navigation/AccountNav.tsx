'use client'

import { useFeaturePreviewModal } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ProfileImage } from 'components/ui/ProfileImage'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM } from 'lib/constants'
import { useProfileNameAndPicture } from 'lib/profile'
import { FlaskConical, Loader2, ScrollText, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  useSidebar,
  type Theme,
} from 'ui'

function V2UserDropdownContent() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const appStateSnapshot = useAppStateSnapshot()
  const profileShowEmailEnabled = useIsFeatureEnabled('profile:show_email')
  const { username, primaryEmail } = useProfileNameAndPicture()
  const { toggleFeaturePreviewModal } = useFeaturePreviewModal()

  return (
    <>
      {IS_PLATFORM && (
        <>
          <div className="px-2 py-1 flex flex-col gap-0 text-sm">
            {!!username ? (
              <>
                <span title={username} className="w-full text-left text-foreground truncate">
                  {username}
                </span>
                {primaryEmail !== username && profileShowEmailEnabled && (
                  <span
                    title={primaryEmail}
                    className="w-full text-left text-foreground-light text-xs truncate"
                  >
                    {primaryEmail}
                  </span>
                )}
              </>
            ) : (
              <span title={primaryEmail} className="w-full text-left text-foreground truncate">
                {primaryEmail}
              </span>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="flex gap-2 cursor-pointer" asChild>
              <Link
                href="/account/me"
                onClick={() => {
                  if (pathname !== '/account/me') {
                    appStateSnapshot.setLastRouteBeforeVisitingAccountPage(pathname ?? '')
                  }
                }}
              >
                <Settings size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                Account preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex gap-2 cursor-pointer"
              onSelect={() => toggleFeaturePreviewModal(true)}
            >
              <FlaskConical size={14} strokeWidth={1.5} className="text-foreground-lighter" />
              Feature previews
            </DropdownMenuItem>
            <DropdownMenuItem className="flex gap-2" asChild>
              <Link href="https://supabase.com/changelog" target="_blank" rel="noopener noreferrer">
                <ScrollText size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                Changelog
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuGroup>
        </>
      )}
      <DropdownMenuGroup>
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          {singleThemes.map((t: Theme) => (
            <DropdownMenuRadioItem key={t.value} value={t.value} className="cursor-pointer">
              {t.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuGroup>
      {IS_PLATFORM && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push('/logout')}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </>
      )}
    </>
  )
}

export function AccountNav() {
  const { isMobile } = useSidebar()
  const { username, avatarUrl, isLoading } = useProfileNameAndPicture()

  return (
    <SidebarMenu>
      <SidebarMenuItem className="!bg-transparent !m-0 flex items-center justify-center !mb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="!w-full !max-w-6 mx-auto h-auto !m-0 !p-0 !aspect-square rounded-full hover:outline-2 hover:outline-offset-2 hover:outline-foreground-muted">
              {isLoading ? (
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Loader2 className="animate-spin text-foreground-lighter" size={16} />
                </div>
              ) : (
                <ProfileImage
                  alt={username}
                  src={avatarUrl}
                  className="w-full aspect-square rounded-full p-0 m-0"
                />
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <V2UserDropdownContent />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
