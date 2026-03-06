import { AlertCircle } from 'lucide-react'

import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useFlag, useParams } from 'common'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { InlineLinkClassName } from 'components/ui/InlineLink'
import { UpgradeToPro } from 'components/ui/UpgradeToPro'
import {
  useCustomDomainsQuery,
  type CustomDomainsData,
} from 'data/custom-domains/custom-domains-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Card, CardContent } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import CustomDomainActivate from './CustomDomainActivate'
import CustomDomainDelete from './CustomDomainDelete'
import CustomDomainVerify from './CustomDomainVerify'
import CustomDomainsConfigureHostname from './CustomDomainsConfigureHostname'
import CustomDomainsShimmerLoader from './CustomDomainsShimmerLoader'

export const CustomDomainConfig = () => {
  const { ref } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const customDomainsDisabledDueToQuota = useFlag('customDomainsDisabledDueToQuota')

  const plan = organization?.plan?.id

  const { data: addons, isPending: isLoadingAddons } = useProjectAddonsQuery({ projectRef: ref })
  const hasCustomDomainAddon = !!addons?.selected_addons.find((x) => x.type === 'custom_domain')

  const {
    data: customDomainData,
    isPending: isCustomDomainsLoading,
    isError,
    isSuccess,
    status: customDomainStatus,
  } = useCustomDomainsQuery(
    { projectRef: ref },
    {
      refetchInterval: (query) => {
        const data = query.state.data
        // while setting up the ssl certificate, we want to poll every 5 seconds
        if (data?.customDomain?.ssl.status) {
          return 10000 // 10 seconds
        }

        return false
      },
    }
  )

  const { status } = customDomainData || {}

  return (
    <PageSection id="custom-domains">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Custom domains</PageSectionTitle>
          <PageSectionDescription>
            Present a branded experience to your users
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        {isLoadingAddons ? (
          <Card>
            <CardContent className="space-y-6">
              <CustomDomainsShimmerLoader />
            </CardContent>
          </Card>
        ) : !hasCustomDomainAddon ? (
          <UpgradeToPro
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
                  : 'To configure a custom domain for your project, please enable the add-on. Each Custom Domain costs $10 per month.'
            }
            addon="customDomain"
            source="customDomain"
            featureProposition="enable custom domains"
            disabled={customDomainsDisabledDueToQuota}
          />
        ) : isCustomDomainsLoading ? (
          <Card>
            <CardContent className="space-y-6">
              <CustomDomainsShimmerLoader />
            </CardContent>
          </Card>
        ) : isError ? (
          <Card>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center space-x-2 py-8">
                <AlertCircle size={16} strokeWidth={1.5} />
                <p className="text-sm text-foreground-light">
                  Failed to retrieve custom domain configuration. Please try again later or{' '}
                  <SupportLink
                    queryParams={{ projectRef: ref, category: SupportCategories.SALES_ENQUIRY }}
                    className={InlineLinkClassName}
                  >
                    contact support
                  </SupportLink>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        ) : status === '0_no_hostname_configured' ? (
          <CustomDomainsConfigureHostname />
        ) : (
          <Card>
            <CardContent className="p-0">
              {isSuccess ? (
                <div className="flex flex-col">
                  {(status === '1_not_started' ||
                    status === '2_initiated' ||
                    status === '3_challenge_verified') && <CustomDomainVerify />}

                  {customDomainData.status === '4_origin_setup_completed' && (
                    <CustomDomainActivate
                      projectRef={ref}
                      customDomain={customDomainData.customDomain}
                    />
                  )}

                  {customDomainData.status === '5_services_reconfigured' && (
                    <CustomDomainDelete
                      projectRef={ref}
                      customDomain={customDomainData.customDomain}
                    />
                  )}
                </div>
              ) : (
                <CustomDomainConfigFallthrough
                  fetchStatus={customDomainStatus}
                  data={customDomainData}
                />
              )}
            </CardContent>
          </Card>
        )}
      </PageSectionContent>
    </PageSection>
  )
}

interface CustomDomainConfigFallthroughProps {
  fetchStatus: 'error' | 'success' | 'pending'
  data: CustomDomainsData | undefined
}

function CustomDomainConfigFallthrough({ fetchStatus, data }: CustomDomainConfigFallthroughProps) {
  console.error(`Failing to display UI for custom domains:
Fetch status: ${fetchStatus}
Custom domain status: ${data?.status}`)

  return null
}
