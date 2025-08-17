import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import {
  ScaffoldSection,
  ScaffoldSectionTitle,
  ScaffoldSectionDescription,
} from 'components/layouts/Scaffold'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useFlag } from 'hooks/ui/useFlag'
import { Alert_Shadcn_, AlertTitle_Shadcn_, AlertDescription_Shadcn_, Card, CardContent } from 'ui'
import { CustomDomainActivate } from './CustomDomainActivate'
import { CustomDomainDelete } from './CustomDomainDelete'
import { CustomDomainVerify } from './CustomDomainVerify'
import CustomDomainsConfigureHostname from './CustomDomainsConfigureHostname'

export const CustomDomainConfig = () => {
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const customDomainsDisabledDueToQuota = useFlag('customDomainsDisabledDueToQuota')

  const plan = organization?.plan?.id

  const { data: addons, isLoading: isLoadingAddons } = useProjectAddonsQuery({ projectRef })
  const hasCustomDomainAddon = !!addons?.selected_addons.find((x) => x.type === 'custom_domain')

  const {
    data: customDomainData,
    isLoading: isCustomDomainsLoading,
    isError,
    isSuccess,
  } = useCustomDomainsQuery(
    { projectRef },
    {
      refetchInterval(data) {
        // while setting up the ssl certificate, we want to poll every 5 seconds
        if (data?.customDomain?.ssl.status) {
          return 5000
        }

        return false
      },
    }
  )

  const { status, customDomain } = customDomainData ?? {}

  return (
    <ScaffoldSection id="custom-domains" className="gap-6">
      <ScaffoldSectionTitle>
        Custom Domains
        <ScaffoldSectionDescription>
          Present a branded experience to your users
        </ScaffoldSectionDescription>
      </ScaffoldSectionTitle>

      <Card>
        {isLoadingAddons ? (
          <CardContent>
            <GenericSkeletonLoader />
          </CardContent>
        ) : !hasCustomDomainAddon ? (
          <UpgradeToPro
            icon={<AlertCircle size={18} strokeWidth={1.5} />}
            primaryText={
              customDomainsDisabledDueToQuota
                ? 'New custom domains are temporarily disabled'
                : 'Custom domains are a Pro Plan add-on'
            }
            secondaryText={
              customDomainsDisabledDueToQuota
                ? 'We are working with our upstream DNS provider before we are able to sign up new custom domains. Please check back in a few hours.'
                : plan === 'free'
                  ? 'Paid Plans come with free vanity subdomains or Custom Domains for an additional $10/month per domain.'
                  : 'To configure a custom domain for your project, please enable the add-on. Each Custom Domains costs $10 per month.'
            }
            addon="customDomain"
            source="customDomain"
            disabled={customDomainsDisabledDueToQuota}
          />
        ) : isCustomDomainsLoading ? (
          <CardContent>
            <GenericSkeletonLoader />
          </CardContent>
        ) : isError ? (
          <Alert_Shadcn_ className="py-4 px-6 [&>svg]:left-6">
            <AlertCircle size={16} strokeWidth={1.5} />
            <AlertTitle_Shadcn_>Failed to retrieve custom domain configuration.</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Please try again later or{' '}
              <Link
                href={`/support/new?projectRef=${projectRef}&category=sales`}
                className="underline"
              >
                contact support
              </Link>
              .
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : status === '0_no_hostname_configured' ? (
          <CustomDomainsConfigureHostname />
        ) : isSuccess ? (
          <>
            {(status === '1_not_started' ||
              status === '2_initiated' ||
              status === '3_challenge_verified') && <CustomDomainVerify />}

            {status === '4_origin_setup_completed' && (
              <CustomDomainActivate projectRef={projectRef} customDomain={customDomain!} />
            )}

            {status === '5_services_reconfigured' && (
              <CustomDomainDelete projectRef={projectRef} customDomain={customDomain!} />
            )}
          </>
        ) : null}
      </Card>
    </ScaffoldSection>
  )
}
