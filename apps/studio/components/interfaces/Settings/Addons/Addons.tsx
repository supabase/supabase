import dayjs from 'dayjs'
import { AlertCircle, Info } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useMemo } from 'react'

import { useFlag, useParams } from 'common'
import {
  getAddons,
  subscriptionHasHipaaAddon,
} from 'components/interfaces/Billing/Subscription/Subscription.utils'
import ProjectUpdateDisabledTooltip from 'components/interfaces/Organization/BillingSettings/ProjectUpdateDisabledTooltip'
import { useIsProjectActive } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldDivider, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers/Shimmers'
import { ResourceItem } from 'components/ui/Resource/ResourceItem'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { useInfraMonitoringQuery } from 'data/analytics/infra-monitoring-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import type { ProjectAddonVariantMeta } from 'data/subscriptions/types'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import {
  useIsOrioleDbInAws,
  useProjectByRefQuery,
  useSelectedProjectQuery,
} from 'hooks/misc/useSelectedProject'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { BASE_PATH, INSTANCE_MICRO_SPECS, INSTANCE_NANO_SPECS } from 'lib/constants'
import { getDatabaseMajorVersion, getSemanticVersion } from 'lib/helpers'
import { useAddonsPagePanel } from 'state/addons-page'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  Button,
} from 'ui'
import CustomDomainSidePanel from './CustomDomainSidePanel'
import IPv4SidePanel from './IPv4SidePanel'
import PITRSidePanel from './PITRSidePanel'
import Image from 'next/image'

export const Addons = () => {
  const { resolvedTheme } = useTheme()
  const { ref: projectRef } = useParams()
  const { setPanel } = useAddonsPagePanel()
  const isProjectActive = useIsProjectActive()
  const isOrioleDbInAws = useIsOrioleDbInAws()

  const { projectSettingsCustomDomains, projectAddonsDedicatedIpv4Address } = useIsFeatureEnabled([
    'project_settings:custom_domains',
    'project_addons:dedicated_ipv4_address',
  ])

  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const { data: selectedProject, isLoading: isLoadingProject } = useSelectedProjectQuery()
  const { data: parentProject } = useProjectByRefQuery(selectedProject?.parent_project_ref)
  const isBranch = parentProject !== undefined

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrg?.slug })

  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription) && settings?.is_sensitive

  const cpuArchitecture = getCloudProviderArchitecture(selectedProject?.cloud_provider)
  // Only projects of version greater than supabase-postgrest-14.1.0.44 can use PITR
  const sufficientPgVersion =
    // introduced as generatedSemantic version could be < 141044 even if actual version is indeed past it
    // eg. 15.1.1.2 leads to 15112
    getDatabaseMajorVersion(selectedProject?.dbVersion ?? '') > 14 ||
    getSemanticVersion(selectedProject?.dbVersion ?? '') >= 141044

  // [Joshen] We could possibly look into reducing the interval to be more "realtime"
  // I tried setting the interval to 1m but no data was returned, may need to experiment
  const startDate = useMemo(() => dayjs().subtract(15, 'minutes').millisecond(0).toISOString(), [])
  const endDate = useMemo(() => dayjs().millisecond(0).toISOString(), [])
  const { data: ioBudgetData } = useInfraMonitoringQuery({
    projectRef,
    attribute: 'disk_io_budget',
    interval: '5m',
    startDate,
    endDate,
  })
  const [mostRecentRemainingIOBudget] = (ioBudgetData?.data ?? []).slice(-1)

  const {
    data: addons,
    error,
    isLoading,
    isError,
    isSuccess,
  } = useProjectAddonsQuery({ projectRef })
  const selectedAddons = addons?.selected_addons ?? []
  const { computeInstance, pitr, customDomain, ipv4 } = getAddons(selectedAddons)

  const meta = useMemo(() => {
    const computeMeta = computeInstance?.variant?.meta as ProjectAddonVariantMeta | undefined

    if (!computeMeta && selectedProject?.infra_compute_size === 'nano') {
      return INSTANCE_NANO_SPECS
    } else if (selectedProject?.infra_compute_size === 'micro') {
      return INSTANCE_MICRO_SPECS
    }

    return computeMeta
  }, [selectedProject, computeInstance])

  const canUpdateIPv4 = settings?.db_ip_addr_config === 'ipv6'

  const ipv4Enabled = ipv4 !== undefined
  const pitrEnabled = pitr !== undefined
  const customDomainEnabled = customDomain !== undefined

  const canOpenIPv4 = isProjectActive && !projectUpdateDisabled && (canUpdateIPv4 || ipv4Enabled)
  const canOpenPITR =
    isProjectActive &&
    !projectUpdateDisabled &&
    sufficientPgVersion &&
    !hasHipaaAddon &&
    !isOrioleDbInAws
  const canOpenCustomDomain = isProjectActive && !projectUpdateDisabled

  return (
    <ScaffoldContainer>
      <ScaffoldSection isFullWidth>
        {isBranch && (
          <Alert_Shadcn_ variant="default" className="mt-6">
            <AlertCircle strokeWidth={2} />
            <AlertTitle_Shadcn_>
              You are currently on a preview branch of your project
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Updating addons here will only apply to this preview branch. To manage your addons,
              for your main branch, please visit the{' '}
              <Link href={`/project/${parentProject.ref}/settings/general`} className="text-brand">
                main branch
              </Link>
              .
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}

        {isLoading && (
          <ResourceList>
            <div className="py-4 px-6 border-b last:border-b-none">
              <HorizontalShimmerWithIcon />
            </div>
            <div className="py-4 px-6 border-b last:border-b-none">
              <HorizontalShimmerWithIcon />
            </div>
            <div className="py-4 px-6 border-b last:border-b-none">
              <HorizontalShimmerWithIcon />
            </div>
          </ResourceList>
        )}

        {isError && <AlertError error={error} subject="Failed to retrieve project addons" />}

        {isSuccess && (
          <>
            {selectedProject?.infra_compute_size === 'nano' && subscription?.plan.id !== 'free' && (
              <Alert_Shadcn_ variant="default">
                <Info strokeWidth={2} />
                <AlertTitle_Shadcn_>Free compute upgrade to Micro</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  Paid Plans include a free upgrade to Micro compute. Your project is ready to
                  upgrade for no additional charges.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            )}

            <ResourceList>
              {projectAddonsDedicatedIpv4Address && (
                <ResourceItem
                  onClick={canOpenIPv4 ? () => setPanel('ipv4') : undefined}
                  media={
                    <Image
                      className="bg rounded-lg border"
                      alt="IPv4"
                      width={160}
                      height={96}
                      src={
                        ipv4Enabled
                          ? `${BASE_PATH}/img/ipv4-on${resolvedTheme?.includes('dark') ? '' : '--light'}.svg?v=2`
                          : `${BASE_PATH}/img/ipv4-off${resolvedTheme?.includes('dark') ? '' : '--light'}.svg?v=2`
                      }
                    />
                  }
                  meta={
                    ipv4Enabled ? (
                      <Badge variant="success">Enabled</Badge>
                    ) : (
                      <Badge variant="default">Disabled</Badge>
                    )
                  }
                >
                  <div className="space-y-1">
                    <div>Dedicated IPv4 address</div>
                    <p className="m-0 text-foreground-light text-sm">
                      Reserve a dedicated IPv4 address for your project.
                    </p>
                    <div>
                      <Link
                        href="https://supabase.com/docs/guides/platform/ipv4-address"
                        target="_blank"
                        rel="noreferrer"
                        className="text-link"
                      >
                        <div className="inline-flex items-center gap-2 opacity-50 hover:opacity-100 transition">
                          <span className="text-sm">About IPv4 deprecation</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                </ResourceItem>
              )}

              <ResourceItem
                onClick={canOpenPITR ? () => setPanel('pitr') : undefined}
                media={
                  <Image
                    className="bg"
                    alt="PITR"
                    width={160}
                    height={96}
                    src={
                      pitrEnabled
                        ? `${BASE_PATH}/img/pitr-on${resolvedTheme?.includes('dark') ? '' : '--light'}.svg`
                        : `${BASE_PATH}/img/pitr-off${resolvedTheme?.includes('dark') ? '' : '--light'}.svg`
                    }
                  />
                }
                meta={
                  pitrEnabled ? (
                    <Badge variant="success">Enabled</Badge>
                  ) : (
                    <Badge variant="default">Disabled</Badge>
                  )
                }
              >
                <div className="space-y-1">
                  <div>Point in time recovery</div>
                  <p className="m-0 text-foreground-light text-sm">
                    Restore your database to a specific moment in the past.
                  </p>
                  <div>
                    <Link
                      href="https://supabase.com/docs/guides/platform/backups#point-in-time-recovery"
                      target="_blank"
                      rel="noreferrer"
                      className="text-link"
                    >
                      <div className="inline-flex items-center gap-2 opacity-50 hover:opacity-100 transition">
                        <span className="text-sm">About PITR backups</span>
                      </div>
                    </Link>
                  </div>
                </div>
              </ResourceItem>

              {hasHipaaAddon ? (
                <div className="px-6">
                  <Alert_Shadcn_>
                    <AlertTitle_Shadcn_>PITR cannot be changed with HIPAA</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      All projects should have PITR enabled by default and cannot be changed with
                      HIPAA enabled. Contact support for further assistance.
                    </AlertDescription_Shadcn_>
                    <div className="mt-4">
                      <Button type="default" asChild>
                        <Link href="/support/new">Contact support</Link>
                      </Button>
                    </div>
                  </Alert_Shadcn_>
                </div>
              ) : !sufficientPgVersion ? (
                <div className="px-6">
                  <Alert_Shadcn_ className="mt-2">
                    <AlertTitle_Shadcn_>Your project is too old to enable PITR</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      <p className="text-sm leading-normal mb-2">
                        Reach out to us via support if you're interested
                      </p>
                      <Button asChild type="default">
                        <Link
                          className="text-link"
                          href={`/support/new?projectRef=${projectRef}&category=sales&subject=Project%20too%20old%20old%20for%20PITR`}
                        >
                          <a>Contact support</a>
                        </Link>
                      </Button>
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                </div>
              ) : isOrioleDbInAws ? (
                <div className="px-6">
                  <Alert_Shadcn_ className="mt-2">
                    <AlertTitle_Shadcn_>PITR not supported</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      Point in time recovery is not supported with OrioleDB
                    </AlertDescription_Shadcn_>
                  </Alert_Shadcn_>
                </div>
              ) : null}

              {projectSettingsCustomDomains && (
                <ResourceItem
                  onClick={canOpenCustomDomain ? () => setPanel('customDomain') : undefined}
                  media={
                    <Image
                      className="bg rounded-lg border"
                      alt="Custom Domain"
                      width={160}
                      height={96}
                      src={
                        customDomainEnabled
                          ? `${BASE_PATH}/img/custom-domain-on${
                              resolvedTheme?.includes('dark') ? '' : '--light'
                            }.svg`
                          : `${BASE_PATH}/img/custom-domain-off${
                              resolvedTheme?.includes('dark') ? '' : '--light'
                            }.svg`
                      }
                    />
                  }
                  meta={
                    customDomainEnabled ? (
                      <Badge variant="success">Enabled</Badge>
                    ) : (
                      <Badge variant="default">Disabled</Badge>
                    )
                  }
                >
                  <div className="space-y-1">
                    <div>Custom domain</div>
                    <p className="m-0 text-foreground-light text-sm">
                      Serve your project on your own domain name.
                    </p>
                    <div>
                      <Link
                        className="text-link"
                        href="https://supabase.com/docs/guides/platform/custom-domains"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div className="inline-flex items-center gap-2 opacity-50 hover:opacity-100 transition">
                          <span className="text-sm">About custom domains</span>
                        </div>
                      </Link>
                    </div>
                  </div>
                </ResourceItem>
              )}
            </ResourceList>
          </>
        )}

        <PITRSidePanel />
        <CustomDomainSidePanel />
        <IPv4SidePanel />
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
