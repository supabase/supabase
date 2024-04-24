import {
  generateComputeInstanceMeta,
  getAddons,
} from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { Project } from 'data/projects/project-detail-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Button, HoverCard, HoverCardContent, HoverCardTrigger, Separator, cn } from 'ui'
import { ComputeBadge } from 'ui-patterns/ComputeBadge/ComputeBadge'
import ShimmeringLoader from './ShimmeringLoader'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { ProjectInfo } from 'data/projects/projects-query'

export const ComputeBadgeWrapper = ({ project }: { project?: ProjectInfo }) => {
  // handles the state of the hover card
  // once open it will fetch the addons
  const [open, setOpenState] = useState(false)

  // returns hardcoded values for infra
  const cpuArchitecture = getCloudProviderArchitecture(project?.cloud_provider)

  // fetches addons
  const { data: addons, isLoading: isLoadingAddons } = useProjectAddonsQuery(
    {
      projectRef: project?.ref,
    },
    { enabled: open }
  )
  const selectedAddons = addons?.selected_addons ?? []

  const { computeInstance } = getAddons(selectedAddons)

  const meta = useMemo(() => {
    // if project is not available, return null
    if (project) {
      // returns the compute instance meta
      // if nano or micro instance is selected, it will return harcoded values
      return generateComputeInstanceMeta(computeInstance, project)
    } else {
      return null
    }
  }, [project, computeInstance])

  const Row = ({ label, stat }: { label: string; stat: React.ReactNode | string }) => {
    return (
      <div className="flex flex-row gap-2">
        <span className="text-sm text-foreground-light w-16">{label}</span>
        <span className="text-sm">{stat}</span>
      </div>
    )
  }

  const availableCompute = addons?.available_addons.find(
    (addon: any) => addon.name === 'Compute Instance'
  )?.variants

  const NANO_PRICE = '$0.0/hour (~$0/month)'
  const HIGHEST_COMPUTE_AVAILABLE = availableCompute?.[availableCompute.length - 1].identifier

  const isHighestCompute =
    project?.infra_compute_size === HIGHEST_COMPUTE_AVAILABLE?.replace('ci_', '')

  return (
    <>
      <HoverCard onOpenChange={() => setOpenState(!open)}>
        <HoverCardTrigger className="group">
          <ComputeBadge
            infraComputeSize={project?.infra_compute_size}
            className={cn(
              'group-data-[state=open]:border-foreground-muted',
              'group-data-[state=open]:bg-surface-300'
            )}
          />
        </HoverCardTrigger>
        <HoverCardContent side="bottom" align="start" className="p-0 overflow-hidden w-96">
          <div className="p-2 px-5 text-xs text-foreground-lighter">Compute size</div>
          <Separator />
          <div className="p-3 px-5 flex flex-row gap-4">
            <div>
              <ComputeBadge infraComputeSize={project?.infra_compute_size} />
            </div>
            <div className="flex flex-col gap-4">
              {isLoadingAddons ? (
                <>
                  <div className="flex flex-col gap-1">
                    <ShimmeringLoader className="h-[20px] py-0 w-32" />
                    <ShimmeringLoader className="h-[20px] py-0 w-32" />
                  </div>
                  <ShimmeringLoader className="h-[20px] py-0 w-48" />
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-1">
                    <Row label="CPU" stat={`${meta?.cpu_cores ?? '?'}-core ${cpuArchitecture}`} />
                    <Row label="Memory" stat={`${meta?.memory_gb ?? '-'} GB`} />
                  </div>
                  <p className="text-sm">
                    {computeInstance ? (
                      <span>{computeInstance?.variant.price_description}</span>
                    ) : (
                      <span>{NANO_PRICE}</span>
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
          {!isHighestCompute && (
            <>
              <Separator />
              <div className="p-3 px-5 text-sm flex flex-col gap-2 bg-studio">
                <div className="flex flex-col gap-0">
                  <p className="text-foreground">Unlock more compute</p>
                  <p className="text-foreground-light">
                    Scale your project up to 64 cores and 256 GB RAM.
                  </p>
                </div>
                <div>
                  <Button type="default" asChild>
                    <Link href={`/project/${project?.ref}/settings/addons`}>Upgrade compute</Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </HoverCardContent>
      </HoverCard>
    </>
  )
}
