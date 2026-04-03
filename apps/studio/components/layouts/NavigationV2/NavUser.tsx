import { UserDropdownContent } from 'components/interfaces/UserDropdown'
import { ProfileImage } from 'components/ui/ProfileImage'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useProfileNameAndPicture } from 'lib/profile'
import { ChevronsUpDown, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from 'ui'

export function NavUser() {
  const { isMobile } = useSidebar()
  const profileShowEmailEnabled = useIsFeatureEnabled('profile:show_email')
  const { username, primaryEmail, avatarUrl, isLoading } = useProfileNameAndPicture()

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
            <UserDropdownContent />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
