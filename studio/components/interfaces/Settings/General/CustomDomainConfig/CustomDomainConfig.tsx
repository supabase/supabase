import Link from 'next/link'

import { useParams } from 'common/hooks'
import { FormHeader } from 'components/ui/Forms'
import Panel from 'components/ui/Panel'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { IconAlertCircle } from 'ui'
import CustomDomainActivate from './CustomDomainActivate'
import CustomDomainDelete from './CustomDomainDelete'
import CustomDomainVerify from './CustomDomainVerify'
import CustomDomainsConfigureHostname from './CustomDomainsConfigureHostname'
import CustomDomainsShimmerLoader from './CustomDomainsShimmerLoader'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'

const CustomDomainConfig = () => {
  const { ref } = useParams()

  const { data: subscription } = useProjectSubscriptionV2Query({ projectRef: ref })

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
    <section>
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
              <IconAlertCircle size={16} strokeWidth={1.5} />
              <p className="text-sm text-scale-1100">
                Failed to retrieve custom domain configuration. Please try again later or{' '}
                <Link href={`/support/new?ref=${ref}&category=sales`}>
                  <a className="underline">contact support</a>
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
          icon={<IconAlertCircle size={18} strokeWidth={1.5} />}
          primaryText="Custom domains are a Pro plan add-on"
          projectRef={ref as string}
          secondaryText={
            plan === 'free'
              ? 'To configure a custom domain for your project, please upgrade to the Pro plan with the custom domains add-on selected'
              : 'To configure a custom domain for your project, please enable the add-on'
          }
          addon="customDomain"
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
