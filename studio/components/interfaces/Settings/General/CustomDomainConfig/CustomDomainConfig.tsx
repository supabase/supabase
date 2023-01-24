import Link from 'next/link'
import { observer } from 'mobx-react-lite'
import { IconAlertCircle } from 'ui'

import { useParams, useStore } from 'hooks'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import Panel from 'components/ui/Panel'
import { FormHeader } from 'components/ui/Forms'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import CustomDomainDelete from './CustomDomainDelete'
import CustomDomainVerify from './CustomDomainVerify'
import CustomDomainActivate from './CustomDomainActivate'
import CustomDomainsConfigureHostname from './CustomDomainsConfigureHostname'
import CustomDomainsShimmerLoader from './CustomDomainsShimmerLoader'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'

const CustomDomainConfig = () => {
  const { ui } = useStore()
  const { ref } = useParams()

  const tier = ui.selectedProject?.subscription_tier
  const { isLoading: isSettingsLoading, data: settings } = useProjectSettingsQuery({
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
      {data?.status === '0_no_hostname_configured' ? (
        <CustomDomainsConfigureHostname />
      ) : (
        <Panel>
          {isLoading && (
            <Panel.Content className="space-y-6">
              <CustomDomainsShimmerLoader />
            </Panel.Content>
          )}

          {data?.status === '0_not_allowed' && (
            <Panel.Content className="space-y-6">
              <UpgradeToPro
                icon={<IconAlertCircle size={18} strokeWidth={1.5} />}
                primaryText="Custom domains are a Pro plan add-on"
                projectRef={ref as string}
                secondaryText={
                  tier === PRICING_TIER_PRODUCT_IDS.FREE
                    ? 'To configure a custom domain for your project, please upgrade to the Pro plan with the custom domains add-on selected'
                    : 'To configure a custom domain for your project, please enable the add-on'
                }
              />
            </Panel.Content>
          )}

          {isError && (
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
          )}

          {isSuccess && (
            <div className="flex flex-col">
              {(data.status === '2_initiated' || data.status === '3_challenge_verified') && (
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

export default observer(CustomDomainConfig)
