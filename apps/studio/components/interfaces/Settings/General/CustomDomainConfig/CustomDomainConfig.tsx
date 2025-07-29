import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

import { useParams } from 'common'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import Panel from 'components/ui/Panel'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
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

  const plan = organization?.plan?.id

  const { data: addons, isLoading: isLoadingAddons } = useProjectAddonsQuery({ projectRef: ref })
  const hasCustomDomainAddon = !!addons?.selected_addons.find((x) => x.type === 'custom_domain')

  const {
    data: customDomainData,
    isLoading: isCustomDomainsLoading,
    isError,
    isSuccess,
  } = useCustomDomainsQuery(
    { projectRef: ref },
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

  const { status, customDomain } = customDomainData || {}

  return (
    <section id="custom-domains">
      <FormHeader title="Custom Domains" description="Present a branded experience to your users" />
      {isLoadingAddons ? (
        <Panel>
          <Panel.Content className="space-y-6">
            <CustomDomainsShimmerLoader />
          </Panel.Content>
        </Panel>
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
                <Link href={`/support/new?projectRef=${ref}&category=sales`} className="underline">
                  contact support
                </Link>
                .
              </p>
            </div>
          </Panel.Content>
        </Panel>
      ) : status === '0_no_hostname_configured' ? (
        <CustomDomainsConfigureHostname />
      ) : (
        <Panel>
          {isSuccess && (
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
                <CustomDomainDelete projectRef={ref} customDomain={customDomainData.customDomain} />
              )}
            </div>
          )}
        </Panel>
      )}
    </section>
  )
}

export default CustomDomainConfig
