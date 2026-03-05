'use client'

import { useIsMFAEnabled, useParams } from 'common'
import { ICON_SIZE, ICON_STROKE_WIDTH } from 'components/interfaces/Sidebar'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Blocks, Boxes, ChartArea, Receipt, Settings, Users } from 'lucide-react'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { SidebarGroup, SidebarMenu } from 'ui'

import { getPathnameWithoutQuery } from 'lib/pathname.utils'

import type { OrgNavItem } from './OrgMenuContent.utils'
import {
  getOrgActiveRoute,
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

  if (!organizationSlug) return null

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto bg-sidebar text-sidebar-foreground">
        <nav className="flex flex-col gap-2 p-2" aria-label="Organization menu">
          <SidebarMenu>
            <SidebarGroup className="gap-0.5">
              {navMenuItems.map((item, i) => (
                <OrgMenuItem
                  key={item.key}
                  item={item}
                  isActive={isOrgMenuActive(item, i, pathname, activeRoute)}
                  disabled={disableAccessMfa}
                  onCloseSheet={onCloseSheet}
                />
              ))}
            </SidebarGroup>
          </SidebarMenu>
        </nav>
      </div>
    </div>
  )
}
