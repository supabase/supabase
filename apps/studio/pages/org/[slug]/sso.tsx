import { SSOConfig } from 'components/interfaces/Organization/SSO/SSOConfig'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import Link from 'next/link'
import type { NextPageWithLayout } from 'types'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'

const OrgSSO: NextPageWithLayout = () => {
  const { data: organization } = useSelectedOrganizationQuery()
  const plan = organization?.plan.id
  const canSetupSSOConfig = ['team', 'enterprise'].includes(plan ?? '')

  if (canSetupSSOConfig) {
    return <SSOConfig />
  } else {
    return (
      <ScaffoldContainer>
        <Alert_Shadcn_
          variant="default"
          className="mt-8"
          title="Organization MFA enforcement is not available on Free plan"
        >
          <WarningIcon />
          <div className="flex flex-col md:flex-row pt-1 gap-4">
            <div className="grow">
              <AlertTitle_Shadcn_>
                Organization Single Sign-on (SSO) is available from Team plan and above
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_ className="flex flex-row justify-between gap-3">
                <p className="max-w-3xl">
                  SSO as a login option provides additional acccount security for your team by
                  enforcing the use of an identity provider when logging into Supabase. Upgrade to
                  Team or above to set up SSO for your organization.
                </p>
              </AlertDescription_Shadcn_>
            </div>

            <div className="flex items-center">
              <Button type="primary" asChild>
                <Link href={`/org/${organization?.slug}/billing?panel=subscriptionPlan&source=sso`}>
                  Upgrade to Team
                </Link>
              </Button>
            </div>
          </div>
        </Alert_Shadcn_>
      </ScaffoldContainer>
    )
  }
}

OrgSSO.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default OrgSSO
