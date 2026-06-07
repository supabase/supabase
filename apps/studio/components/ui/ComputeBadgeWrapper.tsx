import Link from 'next/link'
import { useState } from 'react'
import { Button, cn, HoverCard, HoverCardContent, HoverCardTrigger, Separator } from 'ui'
import { ComputeBadge } from 'ui-patterns/ComputeBadge'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { getAvailableComputeOptions } from '@/components/interfaces/DiskManagement/DiskManagement.utils'
import { ProjectDetail } from '@/data/projects/project-detail-query'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { ResourceWarning } from '@/data/usage/resource-warnings-query'
import { getCloudProviderArchitecture } from '@/lib/cloudprovider-utils'
import { useTrack } from '@/lib/telemetry/track'

export const ChevronsUpAnimated = () => (
  <svg
    width={10}
    height={10}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline
      points="17 18 12 13 7 18"
      className="animate-chevron-up"
      style={{ animationDelay: '0s' }}
    />
    <polyline
      points="17 11 12 6 7 11"
      className="animate-chevron-up"
      style={{ animationDelay: '0.3s' }}
    />
  </svg>
)

const Row = ({ label, stat }: { label: string; stat: React.ReactNode | string }) => {
  return (
    <div className="flex flex-row gap-2">
      <span className="text-sm text-foreground-light w-16">{label}</span>
      <span className="text-sm">{stat}</span>
    </div>
  )
}

interface ComputeBadgeWrapperProps {
  slug?: string
  projectRef?: string
  cloudProvider?: string
  computeSize?: ProjectDetail['infra_compute_size']
  resourceWarnings?: ResourceWarning
  badgeClassName?: string
}

export const ComputeBadgeWrapper = ({
  slug,
  projectRef,
  cloudProvider,
  computeSize,
  resourceWarnings,
  badgeClassName,
}: ComputeBadgeWrapperProps) => {
  // handles the state of the hover card
  // once open it will fetch the addons
  const [open, setOpenState] = useState(false)

  // returns hardcoded values for infra
  const cpuArchitecture = getCloudProviderArchitecture(cloudProvider)

  // fetches addons
  const { data: addons, isPending: isLoadingAddons } = useProjectAddonsQuery(
    { projectRef },
    { enabled: open }
  )

  // Derive cores/memory from the same source as the badge (infra_compute_size) by looking up
  // the matching variant in available_addons. Sourcing from selected_addons can drift out of
  // sync with infra_compute_size and produce a card that contradicts its own badge.
  const computeOptions = getAvailableComputeOptions(addons?.available_addons ?? [], cloudProvider)
  const meta = computeOptions.find((variant) => variant.identifier === `ci_${computeSize}`)?.meta

  const highestComputeAvailable = computeOptions[computeOptions.length - 1]?.identifier
  const isHighestCompute = computeSize === highestComputeAvailable?.replace('ci_', '')

  const { data, isPending: isLoadingSubscriptions } = useOrgSubscriptionQuery(
    { orgSlug: slug },
    { enabled: open }
  )

  const isEligibleForFreeUpgrade = data?.plan.id !== 'free' && computeSize === 'nano'
  const isComputeNearExhaustion =
    !!resourceWarnings?.cpu_exhaustion ||
    !!resourceWarnings?.memory_and_swap_exhaustion ||
    !!resourceWarnings?.disk_space_exhaustion ||
    !!resourceWarnings?.disk_io_exhaustion
  const showUpgradeGlow = isEligibleForFreeUpgrade && isComputeNearExhaustion

  const track = useTrack()

  const isLoading = isLoadingAddons || isLoadingSubscriptions

  if (!computeSize) return null

  return (
    <HoverCard onOpenChange={() => setOpenState(!open)} openDelay={280}>
      <HoverCardTrigger asChild className="group" onClick={(e) => e.stopPropagation()}>
        <div className={cn('flex items-center', showUpgradeGlow && 'animate-badge-pulse')}>
          <div
            className={cn(
              'flex',
              showUpgradeGlow && 'relative inline-flex overflow-hidden rounded-sm'
            )}
          >
            <ComputeBadge
              infraComputeSize={computeSize}
              icon={showUpgradeGlow && <ChevronsUpAnimated />}
              className={cn(
                showUpgradeGlow && 'text-brand-600 border-brand-500 bg-brand/10 gap-1',
                badgeClassName
              )}
            />
            {showUpgradeGlow && (
              <span className="animate-badge-shimmer pointer-events-none absolute inset-0 bg-linear-to-br from-transparent via-brand/20 to-transparent blur-md" />
            )}
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="start"
        className="p-0 overflow-hidden w-96"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2 px-5 text-xs text-foreground-lighter">Compute size</div>
        <Separator />
        <div className="p-3 px-5 flex flex-row gap-4">
          <div>
            <ComputeBadge infraComputeSize={computeSize} />
          </div>
          <div className="flex flex-col gap-4">
            {isLoading ? (
              <>
                <div className="flex flex-col gap-1">
                  <ShimmeringLoader className="h-[20px] py-0 w-32" />
                  <ShimmeringLoader className="h-[20px] py-0 w-32" />
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  {computeSize === 'nano' ? (
                    <>
                      <Row label="CPU" stat="Shared" />
                      <Row label="Memory" stat="Up to 0.5 GB" />
                    </>
                  ) : meta !== undefined ? (
                    <>
                      <Row
                        label="CPU"
                        stat={`${meta.cpu_cores ?? '?'}-core ${cpuArchitecture} ${meta.cpu_dedicated ? '(Dedicated)' : '(Shared)'}`}
                      />
                      <Row label="Memory" stat={`${meta.memory_gb ?? '-'} GB`} />
                    </>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
        {(!isHighestCompute || isEligibleForFreeUpgrade) && (
          <>
            <Separator />
            <div className="p-3 px-5 text-sm flex flex-col gap-2 bg-studio">
              <div className="flex flex-col gap-0">
                <p className="text-foreground">
                  {isEligibleForFreeUpgrade
                    ? 'Free upgrade to Micro available'
                    : 'Unlock more compute'}
                </p>
                <p className="text-foreground-light">
                  {isEligibleForFreeUpgrade
                    ? 'Paid plans include a free upgrade to Micro compute.'
                    : 'Scale your project up to 64 cores and 256 GB RAM.'}
                </p>
              </div>
              <div>
                <Button
                  asChild
                  type="default"
                  htmlType="button"
                  role="button"
                  onClick={() => {
                    track('compute_badge_upgrade_clicked', {
                      computeSize: computeSize ?? 'unknown',
                      planId: data?.plan.id ?? 'unknown',
                      upgradeType: isEligibleForFreeUpgrade
                        ? 'free_micro_upgrade'
                        : 'compute_upgrade',
                    })
                  }}
                >
                  <Link href={`/project/${projectRef}/settings/compute-and-disk`}>
                    Upgrade compute
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </HoverCardContent>
    </HoverCard>
  )
}
