import dayjs from 'dayjs'
import { AlertCircle, ChevronRight, ExternalLink, Info } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'

import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useFlag, useParams } from 'common'
import {
  getAddons,
  subscriptionHasHipaaAddon,
} from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { NoticeBar } from 'components/interfaces/DiskManagement/ui/NoticeBar'
import ProjectUpdateDisabledTooltip from 'components/interfaces/Organization/BillingSettings/ProjectUpdateDisabledTooltip'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { useIsProjectActive } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { mapResponseToAnalyticsData } from 'data/analytics/infra-monitoring-queries'
import { useInfraMonitoringAttributesQuery } from 'data/analytics/infra-monitoring-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import type { ProjectAddonVariantMeta } from 'data/subscriptions/types'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useIsOrioleDbInAws, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { BASE_PATH, DOCS_URL, INSTANCE_MICRO_SPECS, INSTANCE_NANO_SPECS } from 'lib/constants'
import { getDatabaseMajorVersion, getSemanticVersion } from 'lib/helpers'
import { useAddonsPagePanel } from 'state/addons-page'
import { Alert, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'
import { ComputeBadge } from 'ui-patterns/ComputeBadge'
import { GenericSkeletonLoader, ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import CustomDomainSidePanel from './CustomDomainSidePanel'
import IPv4SidePanel from './IPv4SidePanel'
import PITRSidePanel from './PITRSidePanel'

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
  const { data: selectedProject, isPending: isLoadingProject } = useSelectedProjectQuery()
  const { data: parentProject } = useProjectDetailQuery({
    ref: selectedProject?.parent_project_ref,
  })
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
  const { data: ioBudgetData } = useInfraMonitoringAttributesQuery({
    projectRef,
    attributes: ['disk_io_budget'],
    interval: '5m',
    startDate,
    endDate,
  })
  const mostRecentRemainingIOBudget = useMemo(() => {
    if (!ioBudgetData) return undefined
    const mapped = mapResponseToAnalyticsData(ioBudgetData, ['disk_io_budget'])
    const data = mapped['disk_io_budget']?.data
    if (!data?.length) return undefined
    const lastPoint = data[data.length - 1]
    return { disk_io_budget: lastPoint?.disk_io_budget }
  }, [ioBudgetData])

  const {
    data: addons,
    error,
    isPending: isLoading,
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

  return (
    <>
      <ScaffoldDivider />

      {isBranch && (
        <ScaffoldContainer>
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
        </ScaffoldContainer>
      )}

      {isLoading && (
        <ScaffoldContainer>
          <ScaffoldSection>
            <div className="col-span-12">
              <GenericSkeletonLoader />
            </div>
          </ScaffoldSection>
        </ScaffoldContainer>
      )}

      {isError && (
        <ScaffoldContainer>
          <ScaffoldSection>
            <div className="col-span-12">
              <AlertError error={error} subject="Failed to retrieve project addons" />
            </div>
          </ScaffoldSection>
        </ScaffoldContainer>
      )}

      {isSuccess && (
        <>
          {selectedProject?.infra_compute_size === 'nano' && subscription?.plan.id !== 'free' && (
            <ScaffoldContainer className="mt-4">
              <Alert_Shadcn_ variant="default">
                <Info strokeWidth={2} />
                <AlertTitle_Shadcn_>Free compute upgrade to Micro</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  Paid Plans include a free upgrade to Micro compute. Your project is ready to
                  upgrade for no additional charges.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            </ScaffoldContainer>
          )}
          <ScaffoldContainer>
            <ScaffoldSection>
              <ScaffoldSectionDetail>
                <div className="space-y-6">
                  <p className="m-0">Compute Size</p>
                  <div className="space-y-2">
                    <p className="text-sm text-foreground-light m-0">More information</p>
                    <div>
                      <Link
                        href={`${DOCS_URL}/guides/platform/compute-add-ons`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                          <p className="text-sm m-0">About compute add-ons</p>
                          <ExternalLink size={16} strokeWidth={1.5} />
                        </div>
                      </Link>
                    </div>
                    <div>
                      <Link
                        href={`${DOCS_URL}/guides/database/connecting-to-postgres#connection-pooler`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                          <p className="text-sm m-0">Connection Pooler</p>
                          <ExternalLink size={16} strokeWidth={1.5} />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </ScaffoldSectionDetail>
              <ScaffoldSectionContent>
                <div className="flex space-x-6">
                  <div>
                    <div className="rounded-md bg-surface-100 border border-muted w-[160px] h-[96px] overflow-hidden">
                      <Image
                        alt="Compute size"
                        width={160}
                        height={96}
                        src={
                          ['nano', 'micro'].includes(selectedProject?.infra_compute_size || 'micro')
                            ? `${BASE_PATH}/img/optimized-compute-off${
                                resolvedTheme?.includes('dark') ? '' : '--light'
                              }.svg`
                            : `${BASE_PATH}/img/optimized-compute-on${
                                resolvedTheme?.includes('dark') ? '' : '--light'
                              }.svg`
                        }
                      />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-foreground-light">Current option:</p>
                    {isLoading || (computeInstance === undefined && isLoadingProject) ? (
                      <ShimmeringLoader className="w-32" />
                    ) : (
                      <div className="flex py-3">
                        <ComputeBadge infraComputeSize={selectedProject?.infra_compute_size} />
                      </div>
                    )}

                    <NoticeBar
                      visible={true}
                      type="default"
                      title="Compute size has moved"
                      description="Compute size is now managed alongside Disk configuration on the new Compute and Disk page."
                      actions={
                        <ProjectUpdateDisabledTooltip
                          projectUpdateDisabled={projectUpdateDisabled}
                          projectNotActive={!isProjectActive}
                        >
                          <Button
                            asChild
                            type="default"
                            className="pointer-events-auto"
                            disabled={projectUpdateDisabled || !isProjectActive}
                          >
                            <Link href={`/project/${projectRef}/settings/compute-and-disk`}>
                              Go to Compute and Disk
                            </Link>
                          </Button>
                        </ProjectUpdateDisabledTooltip>
                      }
                    />

                    {Number(mostRecentRemainingIOBudget?.disk_io_budget) === 0 ? (
                      <Alert
                        withIcon
                        className="mt-4"
                        variant="danger"
                        title="Your disk IO budget has run out for today"
                      >
                        <p>
                          Your workload is currently running at the baseline disk IO bandwidth at{' '}
                          {meta?.baseline_disk_io_mbs?.toLocaleString() ?? '-'} Mbps and may suffer
                          degradation in performance.
                        </p>
                        <p className="mt-1">
                          Consider upgrading to a larger compute instance for a higher baseline
                          throughput.
                        </p>
                      </Alert>
                    ) : Number(mostRecentRemainingIOBudget?.disk_io_budget) <= 10 ? (
                      <Alert
                        withIcon
                        className="mt-4"
                        variant="warning"
                        title="Your disk IO budget is running out for today"
                      >
                        <p>
                          If the disk IO budget drops to zero, your workload will run at the
                          baseline disk IO bandwidth at{' '}
                          {meta?.baseline_disk_io_mbs?.toLocaleString() ?? '-'} Mbps and may suffer
                          degradation in performance.
                        </p>
                        <p className="mt-1">
                          Consider upgrading to a larger compute instance for a higher baseline
                          throughput.
                        </p>
                      </Alert>
                    ) : null}
                    <div className="mt-2 w-full flex items-center justify-between border-b py-2">
                      <Link href={`/project/${projectRef}/settings/infrastructure#ram`}>
                        <div className="group flex items-center space-x-2">
                          <p className="text-sm text-foreground-light group-hover:text-foreground transition cursor-pointer">
                            Memory
                          </p>
                          <ChevronRight
                            strokeWidth={1.5}
                            size={16}
                            className="transition opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                          />
                        </div>
                      </Link>
                      <p className="text-sm">{meta?.memory_gb ?? '-'} GB</p>
                    </div>
                    <div className="w-full flex items-center justify-between border-b py-2">
                      <Link href={`/project/${projectRef}/settings/infrastructure#cpu`}>
                        <div className="group flex items-center space-x-2">
                          <p className="text-sm text-foreground-light group-hover:text-foreground transition cursor-pointer">
                            CPU
                          </p>
                          <ChevronRight
                            strokeWidth={1.5}
                            size={16}
                            className="transition opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                          />
                        </div>
                      </Link>
                      <p className="text-sm">
                        {meta?.cpu_cores ?? '?'}-core {cpuArchitecture}{' '}
                        {meta?.cpu_dedicated ? '(Dedicated)' : '(Shared)'}
                      </p>
                    </div>
                    <div className="w-full flex items-center justify-between border-b py-2">
                      <p className="text-sm text-foreground-light">No. of direct connections</p>
                      <p className="text-sm">{meta?.connections_direct ?? '-'}</p>
                    </div>
                    <div className="w-full flex items-center justify-between border-b py-2">
                      <p className="text-sm text-foreground-light">No. of pooler connections</p>
                      <p className="text-sm">{meta?.connections_pooler ?? '-'}</p>
                    </div>
                  </div>
                </div>
              </ScaffoldSectionContent>
            </ScaffoldSection>
          </ScaffoldContainer>

          {projectAddonsDedicatedIpv4Address && (
            <>
              <ScaffoldDivider />
              <ScaffoldContainer>
                <ScaffoldSection>
                  <ScaffoldSectionDetail>
                    <div className="space-y-6">
                      <p className="m-0">Dedicated IPv4 address</p>
                      <div className="space-y-2">
                        <p className="text-sm text-foreground-light m-0">More information</p>
                        <div>
                          <Link
                            href={`${DOCS_URL}/guides/platform/ipv4-address`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                              <p className="text-sm m-0">About IPv4 deprecation</p>
                              <ExternalLink size={16} strokeWidth={1.5} />
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </ScaffoldSectionDetail>
                  <ScaffoldSectionContent>
                    <div className="flex space-x-6">
                      <div>
                        <div className="rounded-md bg-surface-100 border border-muted w-[160px] h-[96px] overflow-hidden">
                          <img
                            alt="IPv4"
                            width={160}
                            height={96}
                            src={
                              ipv4 !== undefined
                                ? `${BASE_PATH}/img/ipv4-on${
                                    resolvedTheme?.includes('dark') ? '' : '--light'
                                  }.svg?v=2`
                                : `${BASE_PATH}/img/ipv4-off${
                                    resolvedTheme?.includes('dark') ? '' : '--light'
                                  }.svg?v=2`
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-foreground-light">Current option:</p>
                        <p>
                          {ipv4 !== undefined
                            ? 'Dedicated IPv4 address is enabled'
                            : 'Dedicated IPv4 address is not enabled'}
                        </p>
                        <ProjectUpdateDisabledTooltip
                          projectUpdateDisabled={projectUpdateDisabled}
                          projectNotActive={!isProjectActive}
                        >
                          <Button
                            type="default"
                            className="mt-2 pointer-events-auto"
                            onClick={() => setPanel('ipv4')}
                            disabled={
                              !isProjectActive || projectUpdateDisabled || !(canUpdateIPv4 || ipv4)
                            }
                          >
                            Change dedicated IPv4 address
                          </Button>
                        </ProjectUpdateDisabledTooltip>
                      </div>
                    </div>
                  </ScaffoldSectionContent>
                </ScaffoldSection>
              </ScaffoldContainer>
            </>
          )}

          <ScaffoldDivider />

          <ScaffoldContainer>
            <ScaffoldSection>
              <ScaffoldSectionDetail>
                <div className="space-y-6">
                  <p className="m-0">Point in time recovery</p>
                  <div className="space-y-2">
                    <p className="text-sm text-foreground-light m-0">More information</p>
                    <div>
                      <Link
                        href={`${DOCS_URL}/guides/platform/backups#point-in-time-recovery`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                          <p className="text-sm m-0">About PITR backups</p>
                          <ExternalLink size={16} strokeWidth={1.5} />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </ScaffoldSectionDetail>
              <ScaffoldSectionContent>
                {hasHipaaAddon && (
                  <Alert_Shadcn_>
                    <AlertTitle_Shadcn_>PITR cannot be changed with HIPAA</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      All projects should have PITR enabled by default and cannot be changed with
                      HIPAA enabled. Contact support for further assistance.
                    </AlertDescription_Shadcn_>
                    <div className="mt-4">
                      <Button type="default" asChild>
                        <SupportLink>Contact support</SupportLink>
                      </Button>
                    </div>
                  </Alert_Shadcn_>
                )}
                <div className="flex space-x-6">
                  <div>
                    <div className="rounded-md bg-surface-100 border border-muted w-[160px] h-[96px] overflow-hidden">
                      <Image
                        alt="Point-In-Time-Recovery"
                        width={160}
                        height={96}
                        src={
                          pitr !== undefined
                            ? `${BASE_PATH}/img/pitr-on${
                                resolvedTheme?.includes('dark') ? '' : '--light'
                              }.svg`
                            : `${BASE_PATH}/img/pitr-off${
                                resolvedTheme?.includes('dark') ? '' : '--light'
                              }.svg`
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-light">Current option:</p>
                    <p>
                      {pitr !== undefined
                        ? `Point in time recovery of ${(pitr.variant.meta as any)?.backup_duration_days} days is enabled`
                        : 'Point in time recovery is not enabled'}
                    </p>
                    {!sufficientPgVersion ? (
                      <Alert_Shadcn_ className="mt-2">
                        <AlertTitle_Shadcn_>
                          Your project is too old to enable PITR
                        </AlertTitle_Shadcn_>
                        <AlertDescription_Shadcn_>
                          <p className="text-sm leading-normal mb-2">
                            Reach out to us via support if you're interested
                          </p>
                          <Button asChild type="default">
                            <SupportLink
                              queryParams={{
                                projectRef,
                                category: SupportCategories.SALES_ENQUIRY,
                                subject: 'Project too old old for PITR',
                              }}
                            >
                              <a>Contact support</a>
                            </SupportLink>
                          </Button>
                        </AlertDescription_Shadcn_>
                      </Alert_Shadcn_>
                    ) : isOrioleDbInAws ? (
                      <ButtonTooltip
                        disabled
                        type="default"
                        className="mt-2"
                        tooltip={{
                          content: {
                            side: 'bottom',
                            text: 'Point in time recovery is not supported with OrioleDB',
                          },
                        }}
                      >
                        Change point in time recovery
                      </ButtonTooltip>
                    ) : (
                      <ProjectUpdateDisabledTooltip
                        projectUpdateDisabled={projectUpdateDisabled}
                        projectNotActive={!isProjectActive}
                      >
                        <Button
                          type="default"
                          className="mt-2 pointer-events-auto"
                          onClick={() => setPanel('pitr')}
                          disabled={
                            !isProjectActive ||
                            projectUpdateDisabled ||
                            !sufficientPgVersion ||
                            hasHipaaAddon
                          }
                        >
                          Change point in time recovery
                        </Button>
                      </ProjectUpdateDisabledTooltip>
                    )}
                  </div>
                </div>
              </ScaffoldSectionContent>
            </ScaffoldSection>
          </ScaffoldContainer>

          {projectSettingsCustomDomains && (
            <>
              <ScaffoldDivider />
              <ScaffoldContainer>
                <ScaffoldSection>
                  <ScaffoldSectionDetail>
                    <div className="space-y-6">
                      <p className="m-0">Custom domain</p>
                      <div className="space-y-2">
                        <p className="text-sm text-foreground-light m-0">More information</p>
                        <div>
                          <Link
                            href={`${DOCS_URL}/guides/platform/custom-domains`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                              <p className="text-sm m-0">About custom domains</p>
                              <ExternalLink size={16} strokeWidth={1.5} />
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </ScaffoldSectionDetail>
                  <ScaffoldSectionContent>
                    <div className="flex space-x-6">
                      <div>
                        <div className="rounded-md bg-surface-100 border border-muted w-[160px] h-[96px] overflow-hidden">
                          <img
                            alt="Custom Domain"
                            width={160}
                            height={96}
                            src={
                              customDomain !== undefined
                                ? `${BASE_PATH}/img/custom-domain-on${
                                    resolvedTheme?.includes('dark') ? '' : '--light'
                                  }.svg`
                                : `${BASE_PATH}/img/custom-domain-off${
                                    resolvedTheme?.includes('dark') ? '' : '--light'
                                  }.svg`
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-foreground-light">Current option:</p>
                        <p>
                          {customDomain !== undefined
                            ? 'Custom domain is enabled'
                            : 'Custom domain is not enabled'}
                        </p>
                        <ProjectUpdateDisabledTooltip
                          projectUpdateDisabled={projectUpdateDisabled}
                          projectNotActive={!isProjectActive}
                        >
                          <Button
                            type="default"
                            className="mt-2 pointer-events-auto"
                            onClick={() => setPanel('customDomain')}
                            disabled={!isProjectActive || projectUpdateDisabled}
                          >
                            Change custom domain
                          </Button>
                        </ProjectUpdateDisabledTooltip>
                      </div>
                    </div>
                  </ScaffoldSectionContent>
                </ScaffoldSection>
              </ScaffoldContainer>
            </>
          )}
        </>
      )}

      <PITRSidePanel />
      <CustomDomainSidePanel />
      <IPv4SidePanel />
    </>
  )
}
