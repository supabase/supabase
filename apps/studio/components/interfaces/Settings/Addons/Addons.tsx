import * as Tooltip from '@radix-ui/react-tooltip'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertCircle,
  IconAlertTriangle,
  IconChevronRight,
  IconExternalLink,
} from 'ui'

import {
  getAddons,
  subscriptionHasHipaaAddon,
} from 'components/interfaces/Billing/Subscription/Subscription.utils'
import ProjectUpdateDisabledTooltip from 'components/interfaces/Organization/BillingSettings/ProjectUpdateDisabledTooltip'
import {
  useIsProjectActive,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useInfraMonitoringQuery } from 'data/analytics/infra-monitoring-query'
import { useProjectSettingsQuery } from 'data/config/project-settings-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { ProjectAddonVariantMeta } from 'data/subscriptions/types'
import { useFlag, useProjectByRef, useSelectedOrganization } from 'hooks'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { BASE_PATH } from 'lib/constants'
import { getDatabaseMajorVersion, getSemanticVersion } from 'lib/helpers'
import { SUBSCRIPTION_PANEL_KEYS, useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import ComputeInstanceSidePanel from './ComputeInstanceSidePanel'
import CustomDomainSidePanel from './CustomDomainSidePanel'
import IPv4SidePanel from './IPv4SidePanel'
import PITRSidePanel from './PITRSidePanel'

const Addons = () => {
  const { resolvedTheme } = useTheme()
  const { ref: projectRef, panel } = useParams()
  const snap = useSubscriptionPageStateSnapshot()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')
  const { project: selectedProject } = useProjectContext()
  const { data: projectSettings } = useProjectSettingsQuery({ projectRef })
  const selectedOrg = useSelectedOrganization()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrg?.slug })

  const parentProject = useProjectByRef(selectedProject?.parent_project_ref)
  const isBranch = parentProject !== undefined
  const isProjectActive = useIsProjectActive()
  const allowedPanelValues = ['computeInstance', 'pitr', 'customDomain']
  if (panel && typeof panel === 'string' && allowedPanelValues.includes(panel)) {
    snap.setPanelKey(panel as SUBSCRIPTION_PANEL_KEYS)
  }

  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

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

  const meta = computeInstance?.variant?.meta as ProjectAddonVariantMeta | undefined

  const canUpdateIPv4 = projectSettings?.project.db_ip_addr_config === 'ipv6'

  return (
    <>
      <ScaffoldContainer>
        <div className="mx-auto flex flex-col gap-10 py-6">
          <div>
            <p className="text-xl">Add ons</p>
            <p className="text-sm text-foreground-light">Level up your project with add-ons</p>
          </div>
        </div>
      </ScaffoldContainer>

      <ScaffoldDivider />

      {isBranch && (
        <ScaffoldContainer>
          <Alert_Shadcn_ variant="default" className="mt-6">
            <IconAlertCircle strokeWidth={2} />
            <AlertTitle_Shadcn_>
              You are currently on a preview branch of your project
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Updating addons are not available while you're on a preview branch. To manage your
              addons, you may return to your{' '}
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
          <ScaffoldContainer>
            <ScaffoldSection>
              <ScaffoldSectionDetail>
                <div className="space-y-6">
                  <p className="m-0">Optimized compute</p>
                  <div className="space-y-2">
                    <p className="text-sm text-foreground-light m-0">More information</p>
                    <div>
                      <Link
                        href="https://supabase.com/docs/guides/platform/compute-add-ons"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                          <p className="text-sm m-0">About compute add-ons</p>
                          <IconExternalLink size={16} strokeWidth={1.5} />
                        </div>
                      </Link>
                    </div>
                    <div>
                      <Link
                        href="https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                          <p className="text-sm m-0">Connection Pooler</p>
                          <IconExternalLink size={16} strokeWidth={1.5} />
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
                        alt="Optimized Compute"
                        width={160}
                        height={96}
                        src={
                          computeInstance !== undefined
                            ? `${BASE_PATH}/img/optimized-compute-on${
                                resolvedTheme?.includes('dark') ? '' : '--light'
                              }.svg`
                            : `${BASE_PATH}/img/optimized-compute-off${
                                resolvedTheme?.includes('dark') ? '' : '--light'
                              }.svg`
                        }
                      />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-foreground-light">Current option:</p>
                    <p>{computeInstance?.variant.name ?? 'Micro'}</p>
                    <ProjectUpdateDisabledTooltip
                      projectUpdateDisabled={projectUpdateDisabled}
                      projectNotActive={!isProjectActive}
                    >
                      <Button
                        type="default"
                        className="mt-2 pointer-events-auto"
                        onClick={() => snap.setPanelKey('computeInstance')}
                        disabled={isBranch || !isProjectActive || projectUpdateDisabled}
                      >
                        Change compute size
                      </Button>
                    </ProjectUpdateDisabledTooltip>

                    {Number(mostRecentRemainingIOBudget?.disk_io_budget) === 0 ? (
                      <Alert
                        withIcon
                        className="mt-4"
                        variant="danger"
                        title="Your disk IO budget has run out for today"
                      >
                        <p>
                          Your workload is currently running at the baseline disk IO bandwidth at{' '}
                          {meta?.baseline_disk_io_mbs?.toLocaleString() ?? 87} Mbps and may suffer
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
                          {meta?.baseline_disk_io_mbs?.toLocaleString() ?? 87} Mbps and may suffer
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
                          <IconChevronRight
                            strokeWidth={1.5}
                            size={16}
                            className="transition opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                          />
                        </div>
                      </Link>
                      <p className="text-sm">{meta?.memory_gb ?? 1} GB</p>
                    </div>
                    <div className="w-full flex items-center justify-between border-b py-2">
                      <Link href={`/project/${projectRef}/settings/infrastructure#cpu`}>
                        <div className="group flex items-center space-x-2">
                          <p className="text-sm text-foreground-light group-hover:text-foreground transition cursor-pointer">
                            CPU
                          </p>
                          <IconChevronRight
                            strokeWidth={1.5}
                            size={16}
                            className="transition opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                          />
                        </div>
                      </Link>
                      <p className="text-sm">
                        {meta?.cpu_cores ?? 2}-core {cpuArchitecture}{' '}
                        {meta?.cpu_dedicated ? '(Dedicated)' : '(Shared)'}
                      </p>
                    </div>
                    <div className="w-full flex items-center justify-between border-b py-2">
                      <p className="text-sm text-foreground-light">No. of direct connections</p>
                      <p className="text-sm">{meta?.connections_direct ?? 60}</p>
                    </div>
                    <div className="w-full flex items-center justify-between border-b py-2">
                      <p className="text-sm text-foreground-light">No. of pooler connections</p>
                      <p className="text-sm">{meta?.connections_pooler ?? 200}</p>
                    </div>
                    <div className="w-full flex items-center justify-between border-b py-2">
                      <Link href={`/project/${projectRef}/settings/infrastructure#disk_io`}>
                        <div className="group flex items-center space-x-2">
                          <p className="text-sm text-foreground-light group-hover:text-foreground transition cursor-pointer">
                            Max Disk Throughput
                          </p>
                          <IconChevronRight
                            strokeWidth={1.5}
                            size={16}
                            className="transition opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                          />
                        </div>
                      </Link>
                      <p className="text-sm">
                        {meta?.max_disk_io_mbs?.toLocaleString() ?? '2,085'} Mbps
                      </p>
                    </div>
                    <div className="w-full flex items-center justify-between py-2">
                      <Link href={`/project/${projectRef}/settings/infrastructure#disk_io`}>
                        <div className="group flex items-center space-x-2">
                          <p className="text-sm text-foreground-light group-hover:text-foreground transition cursor-pointer">
                            Baseline Disk Throughput
                          </p>
                          <IconChevronRight
                            strokeWidth={1.5}
                            size={16}
                            className="transition opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                          />
                        </div>
                      </Link>
                      <p className="text-sm">
                        {meta?.baseline_disk_io_mbs?.toLocaleString() ?? 87} Mbps
                      </p>
                    </div>
                  </div>
                </div>
              </ScaffoldSectionContent>
            </ScaffoldSection>
          </ScaffoldContainer>

          <ScaffoldDivider />

          <ScaffoldContainer>
            <ScaffoldSection>
              <ScaffoldSectionDetail>
                <div className="space-y-6">
                  <p className="m-0">IPv4 address</p>
                  <div className="space-y-2">
                    <p className="text-sm text-foreground-light m-0">More information</p>
                    <div>
                      <Link
                        href="https://supabase.com/docs/guides/platform/ipv4-address"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                          <p className="text-sm m-0">About IPv4 deprecation</p>
                          <IconExternalLink size={16} strokeWidth={1.5} />
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
              </ScaffoldSectionDetail>
              <ScaffoldSectionContent>
                <Alert_Shadcn_ variant="warning">
                  <IconAlertTriangle className="h-4 w-4" />
                  <AlertTitle_Shadcn_>
                    PGBouncer and IPv4 Deprecation on January, 26th
                  </AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    <p>
                      Direct connections via db.{projectRef}.supabase.co will resolve to an IPv6
                      address starting from January 26th. If you plan on not using our connection
                      pooler and your environment does not support IPv6, consider enabling the
                      add-on.
                    </p>
                    <div className="mt-2">
                      <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                        <a
                          href="https://supabase.com/docs/guides/platform/ipv4-address"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Learn more
                        </a>
                      </Button>
                    </div>
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
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
                        ? 'IPv4 address is enabled'
                        : 'IPv4 address is not enabled'}
                    </p>
                    <Tooltip.Root delayDuration={0}>
                      <Tooltip.Trigger asChild>
                        <div>
                          <Button
                            type="default"
                            className="mt-2 pointer-events-auto"
                            onClick={() => snap.setPanelKey('ipv4')}
                            disabled={
                              isBranch ||
                              !isProjectActive ||
                              projectUpdateDisabled ||
                              !canUpdateIPv4
                            }
                          >
                            Change IPv4 address
                          </Button>
                        </div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        {!canUpdateIPv4 && (
                          <Tooltip.Content side="bottom">
                            <Tooltip.Arrow className="radix-tooltip-arrow" />
                            <div
                              className={[
                                'rounded bg-alternative py-1 px-2 leading-none shadow',
                                'border border-background',
                              ].join(' ')}
                            >
                              <span className="text-xs text-foreground">
                                Temporarily disabled while we are migrating to IPv6, please check
                                back later.
                              </span>
                            </div>
                          </Tooltip.Content>
                        )}
                      </Tooltip.Portal>
                    </Tooltip.Root>
                    {/*<ProjectUpdateDisabledTooltip
                      projectUpdateDisabled={projectUpdateDisabled}
                      projectNotActive={!isProjectActive}
                    >
                      <Button
                        type="default"
                        className="mt-2 pointer-events-auto"
                        onClick={() => snap.setPanelKey('ipv4')}
                        disabled={isBranch || !isProjectActive || projectUpdateDisabled}
                      >
                        Change IPv4 address
                      </Button>
                      </ProjectUpdateDisabledTooltip>*/}
                  </div>
                </div>
              </ScaffoldSectionContent>
            </ScaffoldSection>
          </ScaffoldContainer>

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
                        href="https://supabase.com/docs/guides/platform/backups#point-in-time-recovery"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                          <p className="text-sm m-0">About PITR backups</p>
                          <IconExternalLink size={16} strokeWidth={1.5} />
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
                        <Link href="/support/new">Contact support</Link>
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
                        ? `Point in time recovery of ${pitr.variant.meta?.backup_duration_days} days is enabled`
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
                            <Link
                              href={`/support/new?ref=${projectRef}&category=sales&subject=Project%20too%20old%20old%20for%20PITR`}
                            >
                              <a>Contact support</a>
                            </Link>
                          </Button>
                        </AlertDescription_Shadcn_>
                      </Alert_Shadcn_>
                    ) : (
                      <ProjectUpdateDisabledTooltip
                        projectUpdateDisabled={projectUpdateDisabled}
                        projectNotActive={!isProjectActive}
                      >
                        <Button
                          type="default"
                          className="mt-2 pointer-events-auto"
                          onClick={() => snap.setPanelKey('pitr')}
                          disabled={
                            isBranch ||
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
                        href="https://supabase.com/docs/guides/platform/custom-domains"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                          <p className="text-sm m-0">About custom domains</p>
                          <IconExternalLink size={16} strokeWidth={1.5} />
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
                        onClick={() => snap.setPanelKey('customDomain')}
                        disabled={isBranch || !isProjectActive || projectUpdateDisabled}
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

      <ComputeInstanceSidePanel />
      <PITRSidePanel />
      <CustomDomainSidePanel />
      <IPv4SidePanel />
    </>
  )
}

export default Addons
