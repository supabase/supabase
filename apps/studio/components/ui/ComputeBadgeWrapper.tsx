import Link from 'next/link'
import { useState } from 'react'

import { getAddons } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { InfraInstanceSize } from 'components/interfaces/DiskManagement/DiskManagement.types'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { ProjectAddonVariantMeta } from 'data/subscriptions/types'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { INSTANCE_MICRO_SPECS } from 'lib/constants'
import { Button, HoverCard, HoverCardContent, HoverCardTrigger, Separator } from 'ui'
import { ComputeBadge } from 'ui-patterns/ComputeBadge'
import ShimmeringLoader from './ShimmeringLoader'

const Row = ({ label, stat }: { label: string; stat: React.ReactNode | string }) => {
  return (
    <div className="flex flex-row gap-2">
      <span className="text-sm text-foreground-light w-16">{label}</span>
      <span className="text-sm">{stat}</span>
    </div>
  )
}

interface ComputeBadgeWrapperProps {
  project: {
    ref?: string
    organization_slug?: string
    cloud_provider?: string
    infra_compute_size?: InfraInstanceSize
  }
}

export const ComputeBadgeWrapper = ({ project }: ComputeBadgeWrapperProps) => {
  // handles the state of the hover card
  // once open it will fetch the addons
  const [open, setOpenState] = useState(false)

  // returns hardcoded values for infra
  const cpuArchitecture = getCloudProviderArchitecture(project.cloud_provider)

  // fetches addons
  const { data: addons, isLoading: isLoadingAddons } = useProjectAddonsQuery(
    {
      projectRef: project.ref,
    },
    { enabled: open }
  )
  const selectedAddons = addons?.selected_addons ?? []

  const { computeInstance } = getAddons(selectedAddons)
  const computeInstanceMeta = computeInstance?.variant?.meta

  const meta = (
    computeInstanceMeta === undefined && project.infra_compute_size === 'micro'
      ? INSTANCE_MICRO_SPECS
      : computeInstanceMeta
  ) as ProjectAddonVariantMeta

  const availableCompute = addons?.available_addons.find(
    (addon) => addon.name === 'Compute Instance'
  )?.variants

  const highestComputeAvailable = availableCompute?.[availableCompute.length - 1].identifier

  const isHighestCompute =
    project?.infra_compute_size === highestComputeAvailable?.replace('ci_', '')

  const { data, isLoading: isLoadingSubscriptions } = useOrgSubscriptionQuery(
    { orgSlug: project?.organization_slug },
    { enabled: open }
  )

  const isEligibleForFreeUpgrade =
    data?.plan.id !== 'free' && project?.infra_compute_size === 'nano'

  const isLoading = isLoadingAddons || isLoadingSubscriptions

  if (!project?.infra_compute_size) return null

  return (
    <HoverCard onOpenChange={() => setOpenState(!open)} openDelay={280}>
      <HoverCardTrigger asChild className="group" onClick={(e) => e.stopPropagation()}>
        <div>
          <ComputeBadge infraComputeSize={project.infra_compute_size} />
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
            <ComputeBadge infraComputeSize={project?.infra_compute_size} />
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
                  {meta !== undefined ? (
                    <>
                      <Row
                        label="CPU"
                        stat={`${meta.cpu_cores ?? '?'}-core ${cpuArchitecture} ${meta.cpu_dedicated ? '(Dedicated)' : '(Shared)'}`}
                      />
                      <Row label="Memory" stat={`${meta.memory_gb ?? '-'} GB`} />
                    </>
                  ) : (
                    <>
                      {/* meta is only undefined for nano sized compute */}
                      <Row label="CPU" stat="Shared" />
                      <Row label="Memory" stat="Up to 0.5 GB" />
                    </>
                  )}
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
                <Button asChild type="default" htmlType="button" role="button">
                  <Link href={`/project/${project?.ref}/settings/compute-and-disk`}>
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
