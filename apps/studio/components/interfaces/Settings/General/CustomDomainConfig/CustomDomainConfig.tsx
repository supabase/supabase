import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import Panel from 'components/ui/Panel'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useFlag } from 'hooks/ui/useFlag'
import CustomDomainActivate from './CustomDomainActivate'
import CustomDomainDelete from './CustomDomainDelete'
import CustomDomainVerify from './CustomDomainVerify'
import CustomDomainsConfigureHostname from './CustomDomainsConfigureHostname'
import CustomDomainsShimmerLoader from './CustomDomainsShimmerLoader'

const CustomDomainConfig = () => {
  const { ref } = useParams()
  const organization = useSelectedOrganization()

  const customDomainsDisabledDueToQuota = useFlag('customDomainsDisabledDueToQuota')

  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })

  const plan = subscription?.plan?.id
  const { isLoading: isSettingsLoading, data: settings } = useProjectApiQuery({
    projectRef: ref,
  })

  const {
    isLoading: isCustomDomainsLoading,
    isError,
    isSuccess,
    data,
  } = useCustomDomainsQuery({ projectRef: ref })

  const isLoading = isSettingsLoading || isCustomDomainsLoading

  return (
    <section id="custom-domains">
      <FormHeader title="Custom Domains" description="Present a branded experience to your users" />
      {isLoading ? (
        <Panel>
          <Panel.Content className="space-y-6">
            <CustomDomainsShimmerLoader />
          </Panel.Content>
        </Panel>
      ) : isError ? (
        <Panel>
          <Panel.Content className="space-y-6">
            <div className="flex items-center justify-center space-x-2 py-8">
              <AlertCircle size={16} strokeWidth={1.5} />
              <p className="text-sm text-foreground-light">
                Failed to retrieve custom domain configuration. Please try again later or{' '}
                <Link href={`/support/new?ref=${ref}&category=sales`} className="underline">
                  contact support
                </Link>
                .
              </p>
            </div>
          </Panel.Content>
        </Panel>
      ) : data?.status === '0_no_hostname_configured' ? (
        <CustomDomainsConfigureHostname />
      ) : data?.status === '0_not_allowed' ? (
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
                ? 'To configure a custom domain for your project, please upgrade to the Pro Plan with the custom domains add-on selected'
                : 'To configure a custom domain for your project, please enable the add-on'
          }
          addon="customDomain"
          disabled={customDomainsDisabledDueToQuota}
        />
      ) : (
        <Panel>
          {isSuccess && (
            <div className="flex flex-col">
              {(data.status === '1_not_started' ||
                data.status === '2_initiated' ||
                data.status === '3_challenge_verified') && (
                <CustomDomainVerify
                  projectRef={ref}
                  customDomain={data.customDomain}
                  settings={settings}
                />
              )}

              {data.status === '4_origin_setup_completed' && (
                <CustomDomainActivate projectRef={ref} customDomain={data.customDomain} />
              )}

              {data.status === '5_services_reconfigured' && (
                <CustomDomainDelete projectRef={ref} customDomain={data.customDomain} />
              )}
            </div>
          )}
        </Panel>
      )}
    </section>
  )
}

export default CustomDomainConfig
