'use client'

import { useIsMFAEnabled, useParams } from 'common'
import { ICON_SIZE, ICON_STROKE_WIDTH } from 'components/interfaces/Sidebar'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { getPathnameWithoutQuery } from 'lib/pathname.utils'
import { Blocks, Boxes, ChartArea, ChevronLeft, Receipt, Settings, Users } from 'lucide-react'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'
import { Button, cn, SidebarGroup, SidebarMenu } from 'ui'

import { getOrgMenuComponent } from './mobileOrgMenuRegistry'
import type { OrgNavItem } from './OrgMenuContent.utils'
import {
  getOrgActiveRoute,
  getOrgSectionKeyFromPathname,
  isOrgMenuActive,
} from './OrgMenuContent.utils'
import { OrgMenuItem } from './OrgMenuItem'

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

  const [viewLevel, setViewLevel] = useState<'top' | 'section'>(
    initialSectionKey ? 'section' : 'top'
  )
  const [selectedSectionKey, setSelectedSectionKey] = useState<string | null>(initialSectionKey)

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

  const hasSubmenu = useCallback((item: OrgNavItem) => {
    return getOrgMenuComponent(item.key) !== null
  }, [])

  const handleSubmenuClick = useCallback((item: OrgNavItem) => {
    setSelectedSectionKey(item.key)
    setViewLevel('section')
  }, [])

  const handleBackToTop = useCallback(() => {
    setViewLevel('top')
    setSelectedSectionKey(null)
  }, [])

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
          <React.Suspense
            fallback={<div className="py-4 text-sm text-foreground-muted">Loading...</div>}
          >
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
                  onSubmenuClick={hasSubmenu(item) ? handleSubmenuClick : undefined}
                />
              ))}
            </SidebarGroup>
          </SidebarMenu>
        </nav>
      </div>
    </div>
  )
}
