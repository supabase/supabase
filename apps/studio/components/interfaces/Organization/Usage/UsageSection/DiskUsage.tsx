import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import type { OrgSubscription } from 'data/subscriptions/types'
import SectionContent from '../SectionContent'
import { CategoryAttribute } from '../Usage.constants'
import { useOrgProjectsQuery } from 'data/projects/org-projects'
import { PROJECT_STATUS } from 'lib/constants'
import {
  cn,
  Button,
  Alert_Shadcn_,
  CriticalIcon,
  AlertTitle_Shadcn_,
  AlertDescription_Shadcn_,
} from 'ui'
import MotionNumber from 'motion-number'
import Link from 'next/link'
import { useMemo } from 'react'
import { InfoTooltip } from 'ui-patterns/info-tooltip'
import * as Tooltip from '@radix-ui/react-tooltip'
import { OrgUsageResponse } from 'data/usage/org-usage-query'
import { PricingMetric } from 'data/analytics/org-daily-stats-query'

export interface DiskUsageProps {
  slug: string
  projectRef?: string
  attribute: CategoryAttribute
  subscription?: OrgSubscription
  usage?: OrgUsageResponse

  currentBillingCycleSelected: boolean
}

const DiskUsage = ({
  slug,
  projectRef,
  attribute,
  subscription,
  usage,
  currentBillingCycleSelected,
}: DiskUsageProps) => {
  const {
    data: diskUsage,
    isError,
    isLoading,
    isSuccess,
  } = useOrgProjectsQuery(
    {
      orgSlug: slug,
    },
    {
      enabled: currentBillingCycleSelected,
    }
  )

  const hasProjectsExceedingDiskSize = useMemo(() => {
    if (diskUsage) {
      return diskUsage.projects.some((it) =>
        it.databases.some(
          (db) =>
            db.type !== 'READ_REPLICA' || (db.disk_volume_size_gb && db.disk_volume_size_gb > 8)
        )
      )
    } else {
      return false
    }
  }, [diskUsage])

  const gp3UsageInPeriod = usage?.usages.find((it) => it.metric === PricingMetric.DISK_IOPS_GP3)
  const io2UsageInPeriod = usage?.usages.find((it) => it.metric === PricingMetric.DISK_IOPS_IO2)

  return (
    <div id={attribute.anchor} className="scroll-my-12">
      <SectionContent section={attribute}>
        {isLoading && (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        )}
        {/* TODO error prop */}
        {isError && <AlertError subject="Failed to retrieve usage data" error={null} />}
        {isSuccess && (
          <div className="space-y-4">
            {subscription?.usage_billing_enabled === true && hasProjectsExceedingDiskSize && (
              <Alert_Shadcn_ variant="warning">
                <CriticalIcon />
                <AlertTitle_Shadcn_>Projects exceeding quota</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  You have projects that are exceeding 8 GB of provisioned disk size, but do not
                  allow any overages with the spend cap on. Reduce the disk size or disable the
                  spend cap.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            )}

            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-sm">{attribute.name} usage</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-b py-1">
                <p className="text-xs text-foreground-light">
                  Included in {subscription?.plan?.name} Plan
                </p>
                <p className="text-xs">8 GB GP3 disk per project</p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-foreground-light">Overages in period</p>
                <p className="text-xs">{gp3UsageInPeriod?.usage ?? 0} GB-Hrs</p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm">Current disk size per project</p>
              <p className="text-sm text-foreground-light">
                Breakdown of disk per project. Head to your project's disk management section to see
                database space used.
              </p>
            </div>

            {currentBillingCycleSelected ? (
              <div>
                {diskUsage.projects
                  .filter((it) => !it.is_branch && it.status !== PROJECT_STATUS.INACTIVE)
                  .map((project) => {
                    const primaryDiskUsage = project.databases
                      .filter((it) => it.type === 'PRIMARY')
                      .reduce((acc, curr) => acc + (curr.disk_volume_size_gb ?? 8), 0)
                    const replicaDbs = project.databases.filter((it) => it.type !== 'PRIMARY')
                    const replicaDiskUsage = replicaDbs.reduce(
                      (acc, curr) => acc + (curr.disk_volume_size_gb ?? 8),
                      0
                    )

                    const totalDiskUsage = primaryDiskUsage + replicaDiskUsage

                    // No free disk for io2
                    const freeDiskGb = project.databases[0]!.disk_type === 'gp3' ? 8 : 0

                    const freeUsedPercentage =
                      freeDiskGb === 0 ? 0 : (freeDiskGb / totalDiskUsage) * 100
                    const overagesPercentage = 100 - freeUsedPercentage

                    return (
                      <div>
                        <div className="flex justify-between">
                          <span className="text-foreground-light flex items-center gap-2">
                            {project.name}
                          </span>
                          <Button asChild type="default" size={'tiny'}>
                            <Link
                              href={`/project/${project.ref}/settings/database#disk-management`}
                            >
                              Manage Disk
                            </Link>
                          </Button>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center h-6 gap-3">
                            <span className="text-foreground-light text-sm font-mono flex items-center gap-2">
                              <span className="text-foreground font-semibold -mt-[2px]">
                                <MotionNumber
                                  value={totalDiskUsage}
                                  style={{ lineHeight: 0.8 }}
                                  transition={{
                                    y: { type: 'spring', duration: 0.35, bounce: 0 },
                                  }}
                                  className="font-mono"
                                />
                              </span>{' '}
                              GB Disk provisioned
                            </span>
                            <InfoTooltip side="top">
                              <p>{primaryDiskUsage} GB for Primary Database</p>
                              {replicaDbs.length && (
                                <>
                                  <p>
                                    {replicaDiskUsage} GB for {replicaDbs.length} Read{' '}
                                    {replicaDbs.length === 1 ? 'Replica' : 'Replicas'}
                                  </p>
                                  <p className="mt-1">
                                    Read replicas have their own disk and use 25% more disk to
                                    account for WAL files.
                                  </p>
                                </>
                              )}
                            </InfoTooltip>
                          </div>
                          <div className="relative">
                            <div
                              className={cn(
                                'h-[12px] relative border rounded-sm w-full transition bg-surface-300'
                              )}
                            >
                              <div className="h-full flex">
                                <Tooltip.Root delayDuration={0}>
                                  <Tooltip.Trigger asChild>
                                    <div
                                      className="bg-foreground relative overflow-hidden transition-all duration-500 ease-in-out"
                                      style={{ width: `${freeUsedPercentage}%` }}
                                    >
                                      <div
                                        className="absolute inset-0"
                                        style={{
                                          backgroundImage: `repeating-linear-gradient(
                            -45deg,
                            rgba(255,255,255,0.1),
                            rgba(255,255,255,0.1) 1px,
                            transparent 1px,
                            transparent 4px
                          )`,
                                        }}
                                      />
                                    </div>
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
                                    <Tooltip.Content side="top">
                                      <div
                                        className={[
                                          'rounded bg-alternative py-1 px-2 leading-none shadow',
                                          'border border-background',
                                        ].join(' ')}
                                      >
                                        <span className="text-xs text-foreground">
                                          {freeDiskGb} GB included for free
                                        </span>
                                      </div>
                                    </Tooltip.Content>
                                  </Tooltip.Portal>
                                </Tooltip.Root>

                                <Tooltip.Root delayDuration={0}>
                                  <Tooltip.Trigger asChild>
                                    <div
                                      className="bg-transparent border-r transition-all duration-500 ease-in-out"
                                      style={{ width: `${overagesPercentage}%` }}
                                    />
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
                                    <Tooltip.Content side="top">
                                      <div
                                        className={[
                                          'rounded bg-alternative py-1 px-2 leading-none shadow',
                                          'border border-background',
                                        ].join(' ')}
                                      >
                                        <span className="text-xs text-foreground">
                                          {totalDiskUsage - freeDiskGb} GB additional provisioned
                                          disk
                                        </span>
                                      </div>
                                    </Tooltip.Content>
                                  </Tooltip.Portal>
                                </Tooltip.Root>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-foreground-lighter">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-foreground mr-2" />
                              <span>Free Disk</span>
                            </div>
                            {replicaDiskUsage > 0 && (
                              <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-border border border-strong mr-2" />
                                <span>Additional Disk</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            ) : (
              <div>select current billing cycle please</div>
            )}
          </div>
        )}
      </SectionContent>
    </div>
  )
}

export default DiskUsage
