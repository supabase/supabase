import Panel from 'components/ui/Panel'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useParams } from 'hooks'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { IconAlertCircle, IconExternalLink } from 'ui'
import CustomDomainActivate from './CustomDomainActivate'
import CustomDomainDelete from './CustomDomainDelete'
import CustomDomainsConfigureHostname from './CustomDomainsConfigureHostname'
import CustomDomainsShimmerLoader from './CustomDomainsShimmerLoader'
import CustomDomainVerify from './CustomDomainVerify'

const CustomDomainConfig = () => {
  const { ref } = useParams()

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
      />
    )
  }

  return (
    <>
      <Panel title={CUSTOM_DOMAINS_TITLE}>
        <Panel.Content className="space-y-6 border-t border-panel-border-interior-light dark:border-panel-border-interior-dark">
          {isLoading && <CustomDomainsShimmerLoader />}

          {isNotAllowedError && (
            <div className="flex items-center justify-center space-x-2 py-8">
              <IconAlertCircle size={16} strokeWidth={1.5} />
              <p className="text-sm text-scale-1100">
                Custom domain is not enabled for this project. Please{' '}
                <Link href={`/support/new?ref=${ref}&category=sales`}>
                  <a className="underline">contact support</a>
                </Link>{' '}
                if you would like to enable this feature.
              </p>
            </div>
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
            <div className="flex flex-col gap-6">
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
        </Panel.Content>
      </Panel>
    </>
  )
}

export default observer(CustomDomainConfig)

const CUSTOM_DOMAINS_TITLE = (
  <div className="flex-1 flex items-center justify-between">
    <h5 className="mb-0">Custom Domain</h5>

    <a
      href="https://supabase.com/docs/guides/platform/custom-domains"
      target="_blank"
      rel="noreferrer noopener"
      className="flex items-center gap-1 text-sm text-scale-1000 hover:text-scale-1100"
    >
      <span>Docs</span>
      <IconExternalLink className="inline w-4 h-4" />
    </a>
  </div>
)
