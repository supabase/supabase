'use client'

import { ServiceStatusPopoverContent } from 'components/interfaces/ProjectHome/ServiceStatusPopoverContent'
import { useProjectHomeServiceStatusModel } from 'components/interfaces/ProjectHome/useProjectHomeServiceStatusModel'
import type { ProjectDetailData } from 'data/projects/project-detail-query'
import { Loader2 } from 'lucide-react'
import { cn, Popover_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

type Props = {
  projectRef: string | undefined
  project: ProjectDetailData | undefined
}

export function HomeViewServiceStatusCard({ projectRef, project }: Props) {
  const projectForModel =
    project != null && projectRef
      ? {
          ref: project.ref,
          parentRef: project.parent_project_ref ?? project.ref,
          status: project.status,
          inserted_at: project.inserted_at,
        }
      : undefined

  const { services, allServicesOperational, isProjectNew, isProjectComingUp, overallStatusLabel } =
    useProjectHomeServiceStatusModel(projectRef, projectForModel)

  const dotsOrSpinner = isProjectComingUp ? (
    <Loader2 className="animate-spin shrink-0" size={16} aria-hidden />
  ) : (
    <div className="grid grid-cols-3 h-full gap-1.5 shrink-0 my-auto" aria-hidden>
      {services.map((service, index) => (
        <div
          key={`${service.name}-${index}`}
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            service.isLoading ||
              service.status === 'COMING_UP' ||
              (isProjectNew && service.status !== 'ACTIVE_HEALTHY')
              ? 'bg-foreground-lighter animate-pulse'
              : service.status === 'ACTIVE_HEALTHY'
                ? 'bg-brand'
                : 'bg-selection'
          )}
        />
      ))}
    </div>
  )

  if (!projectRef) {
    return (
      <div className="border border-border bg-surface-100 rounded-md p-2">
        <div className="text-xs text-foreground-lighter">Services</div>
        <div className="text-xs mt-1 text-foreground-lighter">Unknown</div>
      </div>
    )
  }

  return (
    <Popover_Shadcn_>
      <PopoverTrigger_Shadcn_ asChild>
        <button
          type="button"
          className={cn(
            'flex gap-2 justify-between items-center',
            'border border-border bg-surface-100 rounded-md p-2 w-full text-left',
            'hover:bg-sidebar-accent/50 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface-100'
          )}
        >
          <div className="flex flex-col">
            <div className="text-xs text-foreground-lighter">Services</div>
            <div className="flex items-center gap-2 mt-1 min-h-[1.25rem]">
              <span className="text-xs text-foreground capitalize-sentence">
                {overallStatusLabel}
              </span>
            </div>
          </div>
          <div className="px-3">{dotsOrSpinner}</div>
        </button>
      </PopoverTrigger_Shadcn_>
      <ServiceStatusPopoverContent
        projectRef={projectRef}
        services={services}
        isProjectNew={isProjectNew}
        isProjectComingUp={isProjectComingUp}
        allServicesOperational={allServicesOperational}
      />
    </Popover_Shadcn_>
  )
}
