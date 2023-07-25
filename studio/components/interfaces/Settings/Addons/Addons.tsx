import dayjs from 'dayjs'
import Link from 'next/link'
import { useMemo } from 'react'

import { useParams, useTheme } from 'common'
import { getAddons } from 'components/interfaces/BillingV2/Subscription/Subscription.utils'
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
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useFlag } from 'hooks'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { BASE_PATH, PROJECT_STATUS } from 'lib/constants'
import { SUBSCRIPTION_PANEL_KEYS, useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import { Alert, Button, IconChevronRight, IconExternalLink } from 'ui'
import { ComputeInstanceSidePanel, CustomDomainSidePanel, PITRSidePanel } from './'

const Addons = () => {
  const { isDarkMode } = useTheme()
  const { ref: projectRef, panel } = useParams()
  const snap = useSubscriptionPageStateSnapshot()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')
  const { project: selectedProject } = useProjectContext()

  const isProjectActive = useIsProjectActive()
  const allowedPanelValues = ['computeInstance', 'pitr', 'customDomain']
  if (panel && typeof panel === 'string' && allowedPanelValues.includes(panel)) {
    snap.setPanelKey(panel as SUBSCRIPTION_PANEL_KEYS)
  }

  const cpuArchitecture = getCloudProviderArchitecture(selectedProject?.cloud_provider)

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
  const { computeInstance, pitr, customDomain } = getAddons(selectedAddons)

  return (
    <>
      <ScaffoldContainer>
        <div className="mx-auto flex flex-col gap-10 py-6">
          <div>
            <p className="text-xl">Add ons</p>
            <p className="text-sm text-scale-1000">Level up your project with add-ons</p>
          </div>
        </div>
      </ScaffoldContainer>

      <ScaffoldDivider />

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
                  <p>Optimized compute</p>
                  <div className="space-y-2">
                    <p className="text-sm text-scale-1100">More information</p>
                    <div>
                      <Link href="https://supabase.com/docs/guides/platform/compute-add-ons">
                        <a target="_blank" rel="noreferrer">
                          <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                            <p className="text-sm">About compute add-ons</p>
                            <IconExternalLink size={16} strokeWidth={1.5} />
                          </div>
                        </a>
                      </Link>
                    </div>
                    <div>
                      <Link href="https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler">
                        <a target="_blank" rel="noreferrer">
                          <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                            <p className="text-sm">Connection Pooler</p>
                            <IconExternalLink size={16} strokeWidth={1.5} />
                          </div>
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>
              </ScaffoldSectionDetail>
              <ScaffoldSectionContent>
                <div className="flex space-x-6">
                  <div>
                    <div className="rounded-md bg-scale-100 dark:bg-scale-400 w-[160px] h-[96px] shadow">
                      <img
                        alt="Optimized Compute"
                        width={160}
                        height={96}
                        src={
                          computeInstance !== undefined
                            ? `${BASE_PATH}/img/optimized-compute-on${
                                isDarkMode ? '' : '--light'
                              }.png`
                            : `${BASE_PATH}/img/optimized-compute-off${
                                isDarkMode ? '' : '--light'
                              }.png`
                        }
                      />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-scale-1000">Current option:</p>
                    <p className="">{computeInstance?.variant.name ?? 'Micro'}</p>
                    <ProjectUpdateDisabledTooltip
                      projectUpdateDisabled={projectUpdateDisabled}
                      projectNotActive={!isProjectActive}
                    >
                      <Button
                        type="default"
                        className="mt-2 pointer-events-auto"
                        onClick={() => snap.setPanelKey('computeInstance')}
                        disabled={!isProjectActive || projectUpdateDisabled}
                      >
                        Change optimized compute
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
                          {computeInstance?.variant?.meta?.baseline_disk_io_mbs?.toLocaleString() ??
                            87}{' '}
                          Mbps and may suffer degradation in performance.
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
                          {computeInstance?.variant?.meta?.baseline_disk_io_mbs?.toLocaleString() ??
                            87}{' '}
                          Mbps and may suffer degradation in performance.
                        </p>
                        <p className="mt-1">
                          Consider upgrading to a larger compute instance for a higher baseline
                          throughput.
                        </p>
                      </Alert>
                    ) : null}

                    <div className="mt-2 w-full flex items-center justify-between border-b py-2">
                      <Link href={`/project/${projectRef}/settings/infrastructure#ram`}>
                        <a>
                          <div className="group flex items-center space-x-2">
                            <p className="text-sm text-scale-1100 group-hover:text-scale-1200 transition cursor-pointer">
                              Memory
                            </p>
                            <IconChevronRight
                              strokeWidth={1.5}
                              size={16}
                              className="transition opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                            />
                          </div>
                        </a>
                      </Link>
                      <p className="text-sm">{computeInstance?.variant?.meta?.memory_gb ?? 1} GB</p>
                    </div>
                    <div className="w-full flex items-center justify-between border-b py-2">
                      <Link href={`/project/${projectRef}/settings/infrastructure#cpu`}>
                        <a>
                          <div className="group flex items-center space-x-2">
                            <p className="text-sm text-scale-1100 group-hover:text-scale-1200 transition cursor-pointer">
                              CPU
                            </p>
                            <IconChevronRight
                              strokeWidth={1.5}
                              size={16}
                              className="transition opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                            />
                          </div>
                        </a>
                      </Link>
                      <p className="text-sm">
                        {computeInstance?.variant?.meta?.cpu_cores ?? 2}-core {cpuArchitecture}{' '}
                        {computeInstance?.variant?.meta?.cpu_dedicated ? '(Dedicated)' : '(Shared)'}
                      </p>
                    </div>
                    <div className="w-full flex items-center justify-between border-b py-2">
                      <p className="text-sm text-scale-1000">No. of direct connections</p>
                      <p className="text-sm">
                        {computeInstance?.variant?.meta?.connections_direct ?? 60}
                      </p>
                    </div>
                    <div className="w-full flex items-center justify-between border-b py-2">
                      <p className="text-sm text-scale-1000">No. of pooler connections</p>
                      <p className="text-sm">
                        {computeInstance?.variant?.meta?.connections_pooler ?? 200}
                      </p>
                    </div>
                    <div className="w-full flex items-center justify-between border-b py-2">
                      <Link href={`/project/${projectRef}/settings/infrastructure#disk_io`}>
                        <a>
                          <div className="group flex items-center space-x-2">
                            <p className="text-sm text-scale-1100 group-hover:text-scale-1200 transition cursor-pointer">
                              Max Disk Throughput
                            </p>
                            <IconChevronRight
                              strokeWidth={1.5}
                              size={16}
                              className="transition opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                            />
                          </div>
                        </a>
                      </Link>
                      <p className="text-sm">
                        {computeInstance?.variant?.meta?.max_disk_io_mbs?.toLocaleString() ??
                          '2,085'}{' '}
                        Mbps
                      </p>
                    </div>
                    <div className="w-full flex items-center justify-between py-2">
                      <Link href={`/project/${projectRef}/settings/infrastructure#disk_io`}>
                        <a>
                          <div className="group flex items-center space-x-2">
                            <p className="text-sm text-scale-1100 group-hover:text-scale-1200 transition cursor-pointer">
                              Baseline Disk Throughput
                            </p>
                            <IconChevronRight
                              strokeWidth={1.5}
                              size={16}
                              className="transition opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                            />
                          </div>
                        </a>
                      </Link>
                      <p className="text-sm">
                        {computeInstance?.variant?.meta?.baseline_disk_io_mbs?.toLocaleString() ??
                          87}{' '}
                        Mbps
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
                  <p>Point in time recovery</p>
                  <div className="space-y-2">
                    <p className="text-sm text-scale-1100">More information</p>
                    <div>
                      <Link href="https://supabase.com/docs/guides/platform/backups#point-in-time-recovery">
                        <a target="_blank" rel="noreferrer">
                          <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                            <p className="text-sm">About PITR backups</p>
                            <IconExternalLink size={16} strokeWidth={1.5} />
                          </div>
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>
              </ScaffoldSectionDetail>
              <ScaffoldSectionContent>
                <div className="flex space-x-6">
                  <div>
                    <div className="rounded-md bg-scale-100 dark:bg-scale-400 w-[160px] h-[96px] shadow">
                      <img
                        alt="Point-In-Time-Recovery"
                        width={160}
                        height={96}
                        src={
                          pitr !== undefined
                            ? `${BASE_PATH}/img/pitr-on${isDarkMode ? '' : '--light'}.png?v=2`
                            : `${BASE_PATH}/img/pitr-off${isDarkMode ? '' : '--light'}.png?v=2`
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-scale-1000">Current option:</p>
                    <p className="">
                      {pitr !== undefined
                        ? `Point in time recovery of ${pitr.variant.meta?.backup_duration_days} days is enabled`
                        : 'Point in time recovery is not enabled'}
                    </p>
                    <ProjectUpdateDisabledTooltip
                      projectUpdateDisabled={projectUpdateDisabled}
                      projectNotActive={!isProjectActive}
                    >
                      <Button
                        type="default"
                        className="mt-2 pointer-events-auto"
                        onClick={() => snap.setPanelKey('pitr')}
                        disabled={!isProjectActive || projectUpdateDisabled}
                      >
                        Change point in time recovery
                      </Button>
                    </ProjectUpdateDisabledTooltip>
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
                  <p>Custom domain</p>
                  <div className="space-y-2">
                    <p className="text-sm text-scale-1100">More information</p>
                    <div>
                      <Link href="https://supabase.com/docs/guides/platform/custom-domains">
                        <a target="_blank" rel="noreferrer">
                          <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                            <p className="text-sm">About custom domains</p>
                            <IconExternalLink size={16} strokeWidth={1.5} />
                          </div>
                        </a>
                      </Link>
                    </div>
                  </div>
                </div>
              </ScaffoldSectionDetail>
              <ScaffoldSectionContent>
                <div className="flex space-x-6">
                  <div>
                    <div className="rounded-md bg-scale-100 dark:bg-scale-400 w-[160px] h-[96px] shadow">
                      <img
                        alt="Custom Domain"
                        width={160}
                        height={96}
                        src={
                          customDomain !== undefined
                            ? `${BASE_PATH}/img/custom-domain-on${isDarkMode ? '' : '--light'}.png`
                            : `${BASE_PATH}/img/custom-domain-off${isDarkMode ? '' : '--light'}.png`
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-scale-1000">Current option:</p>
                    <p className="">
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

      <ComputeInstanceSidePanel />
      <PITRSidePanel />
      <CustomDomainSidePanel />
    </>
  )
}

export default Addons
