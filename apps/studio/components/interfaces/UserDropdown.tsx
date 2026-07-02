import { FlaskConical, Loader2, ScrollText, User2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  cn,
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
} from 'ui'

import { ButtonTooltip } from '../ui/ButtonTooltip'
import { useFeaturePreviewModal } from './App/FeaturePreview/FeaturePreviewContext'
import { TimezoneDropdown } from './UserDropdown/TimezoneDropdown'
import { ProfileImage } from '@/components/ui/ProfileImage'
import { UpgradePlanButton } from '@/components/ui/UpgradePlanButton'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useUpgradeCtaExperiment } from '@/hooks/misc/useUpgradeCtaExperiment'
import { IS_PLATFORM } from '@/lib/constants'
import { useProfileNameAndPicture } from '@/lib/profile'
import { useTrack } from '@/lib/telemetry/track'
import { useAppStateSnapshot } from '@/state/app-state'

export function UserDropdown({
  triggerClassName,
  contentClassName,
}: {
  triggerClassName?: string
  contentClassName?: string
}) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const appStateSnapshot = useAppStateSnapshot()
  const profileShowEmailEnabled = useIsFeatureEnabled('profile:show_email')
  const { username, avatarUrl, primaryEmail, isLoading } = useProfileNameAndPicture()

  const { toggleFeaturePreviewModal } = useFeaturePreviewModal()
  const track = useTrack()

  const { variant: upgradeCtaVariant } = useUpgradeCtaExperiment()
  // Per Slack feedback (Jonny): the upgrade CTA is org-scoped, so only show it on routes
  // where an org is in scope. Excludes /account/*, /organizations, /new, marketing routes, etc.
  const isOrgScopedRoute =
    router.pathname.startsWith('/project/') || router.pathname.startsWith('/org/')
  const showUpgradeCta = upgradeCtaVariant === 'user_dropdown' && isOrgScopedRoute

  const [isOpen, setIsOpen] = useState(false)

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (open) track('header_user_dropdown_opened')
      }}
    >
      <DropdownMenuTrigger asChild className={cn('border shrink-0 px-3', triggerClassName)}>
        <ButtonTooltip
          variant="default"
          className="[&>span]:flex px-0 py-0 rounded-full overflow-hidden h-8 w-8"
          tooltip={{ content: { text: 'Account settings' } }}
        >
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-foreground-lighter" size={16} />
            </div>
          ) : (
            <ProfileImage alt={username} src={avatarUrl} className="w-8 h-8 rounded-md" />
          )}
        </ButtonTooltip>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="bottom" align="end" className={contentClassName}>
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
                    if (router.pathname !== '/account/me') {
                      appStateSnapshot.setLastRouteBeforeVisitingAccountPage(router.asPath)
                    }
                  }}
                >
                  <User2 size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex gap-2 cursor-pointer"
                onClick={() => toggleFeaturePreviewModal(true)}
              >
                <FlaskConical size={14} strokeWidth={1.5} className="text-foreground-lighter" />
                Feature previews
              </DropdownMenuItem>
              <DropdownMenuItem className="flex gap-2 cursor-pointer" asChild>
                <Link
                  href="https://supabase.com/changelog"
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
          <DropdownMenuRadioGroup
            value={theme}
            onValueChange={(value) => {
              setTheme(value)
            }}
          >
            {singleThemes.map((theme) => (
              <DropdownMenuRadioItem
                key={theme.value}
                value={theme.value}
                className="cursor-pointer"
              >
                {theme.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <TimezoneDropdown />
        </DropdownMenuGroup>

        {showUpgradeCta && (
          <>
            <DropdownMenuSeparator />
            <div className="p-1">
              <UpgradePlanButton
                source="user_dropdown"
                plan="Pro"
                className="w-full justify-center"
                onClick={() => {
                  track('upgrade_cta_clicked', { placement: 'user_dropdown' })
                  setIsOpen(false)
                }}
              />
            </div>
          </>
        )}
        {IS_PLATFORM && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={() => {
                  router.push('/logout')
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
