'use client'

import { useIsMFAEnabled, useParams } from 'common'
import { ICON_SIZE, ICON_STROKE_WIDTH } from 'components/interfaces/Sidebar'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { getPathnameWithoutQuery } from 'lib/pathname.utils'
import { useTrack } from 'lib/telemetry/track'
import { Blocks, Boxes, ChartArea, ChevronLeft, Receipt, Settings, Users } from 'lucide-react'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'
import { Button, cn, SidebarGroup, SidebarMenu } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'

import { getOrgMenuComponent } from './mobileOrgMenuRegistry'
import type { OrgNavItem } from './OrgMenuContent.utils'
import {
  getOrgActiveRoute,
  getOrgSectionKeyFromPathname,
  isOrgMenuActive,
} from './OrgMenuContent.utils'
import { OrgMenuItem } from './OrgMenuItem'
import { orgItemHasSubmenu, useOrgMenuNavigation } from './useOrgMenuNavigation'

export interface OrgMenuContentProps {
  onCloseSheet?: () => void
}

export function OrgMenuContent({ onCloseSheet }: OrgMenuContentProps) {
  const router = useRouter()
  const { slug } = useParams()
  const organizationSlug: string = slug ?? (router.query.orgSlug as string) ?? ''
  const { data: org } = useSelectedOrganizationQuery()
  const isUserMFAEnabled = useIsMFAEnabled()
  const disableAccessMfa = org?.organization_requires_mfa && !isUserMFAEnabled

  const showBilling = useIsFeatureEnabled('billing:all')

  const pathname = getPathnameWithoutQuery(router.asPath, router.pathname)
  const activeRoute = getOrgActiveRoute(pathname)
  const initialSectionKey = getOrgSectionKeyFromPathname(activeRoute)

  const track = useTrack()
  const {
    viewLevel,
    selectedSectionKey,
    handleSubmenuClick: navigateToSubmenu,
    handleBackToTop: navigateBackToTop,
  } = useOrgMenuNavigation({ initialSectionKey })

  const handleSubmenuClick = (item: OrgNavItem) => {
    track('org_submenu_opened', { itemKey: item.key, itemLabel: item.label })
    navigateToSubmenu(item)
  }

  const handleBackToTop = () => {
    track('org_menu_back_clicked')
    navigateBackToTop()
  }

  const navMenuItems: OrgNavItem[] = useMemo(
    () => [
      {
        label: 'Projects',
        href: `/org/${organizationSlug}`,
        key: 'projects',
        icon: <Boxes size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      },
      {
        label: 'Team',
        href: `/org/${organizationSlug}/team`,
        key: 'team',
        icon: <Users size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      },
      {
        label: 'Integrations',
        href: `/org/${organizationSlug}/integrations`,
        key: 'integrations',
        icon: <Blocks size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      },
      {
        label: 'Usage',
        href: `/org/${organizationSlug}/usage`,
        key: 'usage',
        icon: <ChartArea size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      },
      ...(showBilling
        ? [
            {
              label: 'Billing',
              href: `/org/${organizationSlug}/billing`,
              key: 'billing',
              icon: <Receipt size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
            },
          ]
        : []),
      {
        label: 'Organization settings',
        href: `/org/${organizationSlug}/general`,
        key: 'settings',
        icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE_WIDTH} />,
      },
    ],
    [organizationSlug, showBilling]
  )

  const sectionKeyToShow = viewLevel === 'section' ? selectedSectionKey : null
  const sectionLabel =
    sectionKeyToShow && navMenuItems.find((item) => item.key === sectionKeyToShow)?.label

  const SectionMenuContent = sectionKeyToShow ? getOrgMenuComponent(sectionKeyToShow) : null

  if (!organizationSlug) return null

  if (viewLevel === 'section' && sectionKeyToShow && SectionMenuContent) {
    return (
      <div className="flex flex-col h-full">
        <div
          className={cn(
            'flex-shrink-0 flex items-center gap-2 border-b border-default px-3 min-h-[var(--header-height)]'
          )}
        >
          <Button
            type="text"
            className="!p-1 justify-start"
            icon={<ChevronLeft size={20} />}
            onClick={handleBackToTop}
            aria-label="Back to menu"
            block
          >
            <span className="font-medium truncate text-sm">{sectionLabel ?? sectionKeyToShow}</span>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto text-sidebar-foreground px-2">
          <React.Suspense fallback={<GenericSkeletonLoader className="p-4" />}>
            <SectionMenuContent onCloseSheet={onCloseSheet} />
          </React.Suspense>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto text-sidebar-foreground">
        <nav className="flex flex-col gap-2 p-1" aria-label="Organization menu">
          <SidebarMenu>
            <SidebarGroup className="gap-0.5">
              {navMenuItems.map((item, i) => (
                <OrgMenuItem
                  key={item.key}
                  item={item}
                  isActive={isOrgMenuActive(item, i, pathname, activeRoute)}
                  disabled={disableAccessMfa}
                  onCloseSheet={onCloseSheet}
                  onSubmenuClick={orgItemHasSubmenu(item) ? handleSubmenuClick : undefined}
                  onSelect={() =>
                    track('org_menu_item_clicked', {
                      itemKey: item.key,
                      itemHref: item.href,
                    })
                  }
                />
              ))}
            </SidebarGroup>
          </SidebarMenu>
        </nav>
      </div>
    </div>
  )
}
