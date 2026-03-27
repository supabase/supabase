'use client'

import { useIsMFAEnabled } from 'common'
import { PrivacyUpdateBanner } from 'components/interfaces/Account/Preferences/AnalyticsSettings'
import { ProjectList } from 'components/interfaces/Home/ProjectList/ProjectList'
import { HomePageActions } from 'components/interfaces/HomePageActions'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

export interface OrganizationProjectsHomeContentProps {
  rewriteProjectHref?: (projectRef: string) => string
}

export function OrganizationProjectsHomeContent({
  rewriteProjectHref,
}: OrganizationProjectsHomeContentProps) {
  const isUserMFAEnabled = useIsMFAEnabled()
  const { data: org } = useSelectedOrganizationQuery()

  const disableAccessMfa = org?.organization_requires_mfa && !isUserMFAEnabled

  return (
    <ScaffoldContainer className="flex-grow flex">
      <ScaffoldSection isFullWidth className="pb-0">
        <PrivacyUpdateBanner />
        {disableAccessMfa ? (
          <Admonition
            type="note"
            layout="horizontal"
            title={`${org?.name} requires MFA`}
            description={
              <>
                Set up multi-factor authentication (MFA) on your account to access this
                organization’s projects.
              </>
            }
            actions={
              <Button asChild type="default">
                <Link href="/account/security">Set up MFA</Link>
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-y-4">
            <HomePageActions />
            <ProjectList rewriteHref={rewriteProjectHref} />
          </div>
        )}
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
