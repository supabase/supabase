import { useParams } from 'common'
import { useTheme } from 'next-themes'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useMemo } from 'react'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconChevronRight,
  IconExternalLink,
} from 'ui'

import ProjectUpdateDisabledTooltip from 'components/interfaces/Organization/BillingSettings/ProjectUpdateDisabledTooltip'
import {
  ComputeInstanceSidePanel,
  CustomDomainSidePanel,
  PITRSidePanel,
} from 'components/interfaces/Settings/Addons'
import {
  useIsProjectActive,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useInfraMonitoringQuery } from 'data/analytics/infra-monitoring-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useFlag } from 'hooks'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { BASE_PATH } from 'lib/constants'
import { getSemanticVersion } from 'lib/helpers'
import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import { getAddons } from '../Subscription.utils'
import Image from 'next/image'

const AddOns = () => {
  const { resolvedTheme } = useTheme()
  const { ref: projectRef } = useParams()
  const snap = useSubscriptionPageStateSnapshot()
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const { project: selectedProject } = useProjectContext()
  const isProjectActive = useIsProjectActive()
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

  const { data: addons, isLoading } = useProjectAddonsQuery({ projectRef })
  const selectedAddons = addons?.selected_addons ?? []

  const { computeInstance, pitr, customDomain } = getAddons(selectedAddons)

  return (
    <>
      <div className="grid grid-cols-12 gap-6" id="addons">
        <div className="col-span-12 lg:col-span-5">
          <div className="sticky top-16">
            <div className="space-y-6">
              <div>
                <p className="text-base">Add ons</p>
                <p className="text-sm text-foreground-light">Level up your project with add-ons</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-foreground-light">More information</p>
                <div>
                  <Link href="https://supabase.com/docs/guides/platform/compute-add-ons">
                    <a target="_blank" rel="noreferrer">
                      <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                        <p className="text-sm">Compute add-ons</p>
                        <IconExternalLink size={16} strokeWidth={1.5} />
                      </div>
                    </a>
                  </Link>
                </div>
                <div>
                  <Link href="https://supabase.com/docs/guides/platform/backups#point-in-time-recovery">
                    <a target="_blank" rel="noreferrer">
                      <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                        <p className="text-sm">PITR backups</p>
                        <IconExternalLink size={16} strokeWidth={1.5} />
                      </div>
                    </a>
                  </Link>
                </div>
                <div>
                  <Link href="https://supabase.com/docs/guides/platform/custom-domains">
                    <a target="_blank" rel="noreferrer">
                      <div className="flex items-center space-x-2 opacity-50 hover:opacity-100 transition">
                        <p className="text-sm">Custom domains</p>
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
          </div>
        </div>
        {isLoading ? (
          <div className="col-span-12 lg:col-span-7 space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        ) : (
          <div className="col-span-12 lg:col-span-7 space-y-6">
            <div className="py-2 space-y-6">
              {/* Compute add on selection */}
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
                  <p className="text-sm text-foreground-light">Optimized compute</p>
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
                        If the disk IO budget drops to zero, your workload will run at the baseline
                        disk IO bandwidth at{' '}
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
                    <Link href={`/project/${projectRef}/settings/billing/usage#ram`}>
                      <a>
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
                      </a>
                    </Link>
                    <p className="text-sm">{computeInstance?.variant?.meta?.memory_gb ?? 1} GB</p>
                  </div>
                  <div className="w-full flex items-center justify-between border-b py-2">
                    <Link href={`/project/${projectRef}/settings/billing/usage#cpu`}>
                      <a>
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
                      </a>
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
                    <Link href={`/project/${projectRef}/settings/billing/usage#disk_io`}>
                      <a>
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
                      </a>
                    </Link>
                    <p className="text-sm">
                      {computeInstance?.variant?.meta?.max_disk_io_mbs?.toLocaleString() ?? '2,085'}{' '}
                      Mbps
                    </p>
                  </div>
                  <div className="w-full flex items-center justify-between py-2">
                    <Link href={`/project/${projectRef}/settings/billing/usage#disk_io`}>
                      <a>
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
                      </a>
                    </Link>
                    <p className="text-sm">
                      {computeInstance?.variant?.meta?.baseline_disk_io_mbs?.toLocaleString() ?? 87}{' '}
                      Mbps
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full border-t" />

              {/* PITR selection */}
              <div className="flex space-x-6">
                <div>
                  <div className="rounded-md bg-scale-100 dark:bg-scale-400 w-[160px] h-[96px] shadow">
                    <img
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
                  <p className="text-sm text-foreground-light">Point in time recovery</p>
                  <p className="">
                    {pitr !== undefined
                      ? `Point in time recovery of ${pitr.variant.meta?.backup_duration_days} days is enabled`
                      : 'Point in time recovery is not enabled'}
                  </p>
                  {!sufficientPgVersion ? (
                    <Alert_Shadcn_ className="mt-2">
                      <AlertTitle_Shadcn_>Your project is too old enable PITR</AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        <p className="text-sm leading-normal mb-2">
                          Reach out to us via support if you're interested
                        </p>
                        <Link
                          passHref
                          href={`/support/new?ref=${projectRef}&category=sales&subject=Project%20too%20old%20old%20for%20PITR`}
                        >
                          <Button asChild type="default">
                            <a>Contact support</a>
                          </Button>
                        </Link>
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
                        disabled={!isProjectActive || projectUpdateDisabled || !sufficientPgVersion}
                      >
                        Change point in time recovery
                      </Button>
                    </ProjectUpdateDisabledTooltip>
                  )}
                </div>
              </div>

              <div className="w-full border-t" />

              {/* Custom domain selection */}
              <div className="flex space-x-6">
                <div>
                  <div className="rounded-md bg-scale-100 dark:bg-scale-400 w-[160px] h-[96px] shadow">
                    <Image
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
                  <p className="text-sm text-foreground-light">Custom domain</p>
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
            </div>
          </div>
        )}
      </div>

      <ComputeInstanceSidePanel />
      <PITRSidePanel />
      <CustomDomainSidePanel />
    </>
  )
}

export default AddOns
