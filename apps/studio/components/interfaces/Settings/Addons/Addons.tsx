import dayjs from 'dayjs'
import Link from 'next/link'
import { useMemo } from 'react'

import { useParams } from 'common'
import { useTheme } from 'next-themes'
import { getAddons } from 'components/interfaces/Billing/Subscription/Subscription.utils'
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
import { useFlag, useProjectByRef } from 'hooks'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { BASE_PATH } from 'lib/constants'
import { getSemanticVersion } from 'lib/helpers'
import { SUBSCRIPTION_PANEL_KEYS, useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertCircle,
  IconChevronRight,
  IconExternalLink,
} from 'ui'
import Image from 'next/image'
import ComputeInstanceSidePanel from './ComputeInstanceSidePanel'
import PITRSidePanel from './PITRSidePanel'
import CustomDomainSidePanel from './CustomDomainSidePanel'

const Addons = () => {
  const { resolvedTheme } = useTheme()
  const { ref: projectRef, panel } = useParams()
  const snap = useSubscriptionPageStateSnapshot()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')
  const { project: selectedProject } = useProjectContext()

  const parentProject = useProjectByRef(selectedProject?.parent_project_ref)
  const isBranch = parentProject !== undefined
  const isProjectActive = useIsProjectActive()
  const allowedPanelValues = ['computeInstance', 'pitr', 'customDomain']
  if (panel && typeof panel === 'string' && allowedPanelValues.includes(panel)) {
    snap.setPanelKey(panel as SUBSCRIPTION_PANEL_KEYS)
  }

  const cpuArchitecture = getCloudProviderArchitecture(selectedProject?.cloud_provider)
  // Only projects of version greater than supabase-postgrest-14.1.0.44 can use PITR
  const sufficientPgVersion = getSemanticVersion(selectedProject?.dbVersion ?? '') >= 141044

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
                    <div className="rounded-md bg-surface-200 w-[160px] h-[96px] shadow">
                      <Image
                        alt="Optimized Compute"
                        width={160}
                        height={96}
                        src={
                          computeInstance !== undefined
                            ? `${BASE_PATH}/img/optimized-compute-on${
                                resolvedTheme === 'dark' ? '' : '--light'
                              }.png`
                            : `${BASE_PATH}/img/optimized-compute-off${
                                resolvedTheme === 'dark' ? '' : '--light'
                              }.png`
                        }
                      />
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm text-foreground-light">Current option:</p>
                    <p className="">{computeInstance?.variant.name ?? 'Micro'}</p>
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
                      <p className="text-sm">{computeInstance?.variant?.meta?.memory_gb ?? 1} GB</p>
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
                        {computeInstance?.variant?.meta?.cpu_cores ?? 2}-core {cpuArchitecture}{' '}
                        {computeInstance?.variant?.meta?.cpu_dedicated ? '(Dedicated)' : '(Shared)'}
                      </p>
                    </div>
                    <div className="w-full flex items-center justify-between border-b py-2">
                      <p className="text-sm text-foreground-light">No. of direct connections</p>
                      <p className="text-sm">
                        {computeInstance?.variant?.meta?.connections_direct ?? 60}
                      </p>
                    </div>
                    <div className="w-full flex items-center justify-between border-b py-2">
                      <p className="text-sm text-foreground-light">No. of pooler connections</p>
                      <p className="text-sm">
                        {computeInstance?.variant?.meta?.connections_pooler ?? 200}
                      </p>
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
                        {computeInstance?.variant?.meta?.max_disk_io_mbs?.toLocaleString() ??
                          '2,085'}{' '}
                        Mbps
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
                <div className="flex space-x-6">
                  <div>
                    <div className="rounded-md bg-surface-200 w-[160px] h-[96px] shadow">
                      <Image
                        alt="Point-In-Time-Recovery"
                        width={160}
                        height={96}
                        src={
                          pitr !== undefined
                            ? `${BASE_PATH}/img/pitr-on${
                                resolvedTheme === 'dark' ? '' : '--light'
                              }.png?v=2`
                            : `${BASE_PATH}/img/pitr-off${
                                resolvedTheme === 'dark' ? '' : '--light'
                              }.png?v=2`
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-light">Current option:</p>
                    <p className="">
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
                            !sufficientPgVersion
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
                    <div className="rounded-md bg-surface-200 w-[160px] h-[96px] shadow">
                      <img
                        alt="Custom Domain"
                        width={160}
                        height={96}
                        src={
                          customDomain !== undefined
                            ? `${BASE_PATH}/img/custom-domain-on${
                                resolvedTheme === 'dark' ? '' : '--light'
                              }.png`
                            : `${BASE_PATH}/img/custom-domain-off${
                                resolvedTheme === 'dark' ? '' : '--light'
                              }.png`
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-light">Current option:</p>
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
    </>
  )
}

export default Addons
