import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useState } from 'react'
import { Button, IconAlertCircle, IconExternalLink } from 'ui'

import { useParams } from 'hooks'
import Panel from 'components/ui/Panel'
import UpgradeToPro from 'components/ui/UpgradeToPro'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import CustomDomainActivate from './CustomDomainActivate'
import CustomDomainDelete from './CustomDomainDelete'
import CustomDomainsConfigureHostname from './CustomDomainsConfigureHostname'
import CustomDomainsShimmerLoader from './CustomDomainsShimmerLoader'
import CustomDomainVerify from './CustomDomainVerify'

const CustomDomainConfig = () => {
  const { ref } = useParams()
  const [isSuccessfullyAdded, setIsSuccessfullyAdded] = useState(false)

  const { isLoading: isSettingsLoading, data: settings } = useProjectSettingsQuery({
    projectRef: ref,
  })

  const {
    isLoading: isCustomDomainsLoading,
    isError,
    error,
    isSuccess,
    data,
  } = useCustomDomainsQuery(
    { projectRef: ref },
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  )

  const isLoading = isSettingsLoading || isCustomDomainsLoading

  const isNoHostnameConfiguredError =
    isError &&
    (error as any)?.code === 400 &&
    (error as any)?.message?.includes('custom hostname configuration')

  const isNotAllowedError =
    isError &&
    (error as any)?.code === 400 &&
    (error as any)?.message?.includes('not allowed to set up custom domain')

  const isUnknownError = isError && !isNoHostnameConfiguredError && !isNotAllowedError

  if (isNoHostnameConfiguredError) {
    return (
      <CustomDomainsConfigureHostname
        projectRef={ref}
        title={CUSTOM_DOMAINS_TITLE}
        settings={settings}
        onSuccessfullyAdded={() => setIsSuccessfullyAdded(true)}
      />
    )
  }

  return (
    <>
      <Panel title={CUSTOM_DOMAINS_TITLE}>
        <Panel.Content className="space-y-6 border-t border-panel-border-interior-light dark:border-panel-border-interior-dark">
          {isLoading && <CustomDomainsShimmerLoader />}

          {isNotAllowedError && (
            <UpgradeToPro
              icon={<IconAlertCircle size={18} strokeWidth={1.5} />}
              primaryText="Custom domains are a Pro plan add-on"
              projectRef={ref as string}
              secondaryText="To configure a custom domain for your project, please upgrade to a Pro plan"
            />
          )}

          {isUnknownError && (
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
          )}

          {isSuccess && (
            <div className="flex flex-col gap-4">
              {(data.status === '2_initiated' || data.status === '3_challenge_verified') && (
                <CustomDomainVerify
                  projectRef={ref}
                  customDomain={data.customDomain}
                  settings={settings}
                  isSuccessfullyAdded={isSuccessfullyAdded}
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
        </Panel.Content>
      </Panel>
    </>
  )
}

export default observer(CustomDomainConfig)

const CUSTOM_DOMAINS_TITLE = (
  <div className="flex-1 flex items-center justify-between">
    <h5 className="mb-0">Custom Domain</h5>

    <Link href="https://supabase.com/docs/guides/platform/custom-domains">
      <a target="_blank">
        <Button type="default" icon={<IconExternalLink />}>
          Documentation
        </Button>
      </a>
    </Link>
  </div>
)
