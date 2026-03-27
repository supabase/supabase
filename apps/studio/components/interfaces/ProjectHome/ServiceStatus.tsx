import { useParams } from 'common'
import { SingleStat } from 'components/ui/SingleStat'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Loader2 } from 'lucide-react'
import { cn, Popover_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

import { ServiceStatusPopoverContent } from './ServiceStatusPopoverContent'
import { useProjectHomeServiceStatusModel } from './useProjectHomeServiceStatusModel'

/**
 * [Joshen] JFYI before we go live with this, we need to revisit the migrations section
 * as I don't think it should live in the ServiceStatus component since its not indicative
 * of a project's "service". ServiceStatus's intention is to be an ongoing health/status check.
 *
 * For context, migrations are meant to be indicative for only when creating branches or projects
 * with an initial SQL, so "healthy" migrations just means that migrations have all been successfully
 * ran. So it might be a matter of decoupling "ready" state vs "health checks"
 * [Edit] Now that migrations are only showing up if the project is a branch, i think its okay for now
 *
 * [Joshen] Another issue that requires investigation before we go live with the changes:
 * We've removed the isProjectNew check in this component which we had that logic cause new
 * projects would show unhealthy as the services are still starting up - but it causes a
 * perceived negative impression as new projects were showing unhealthy, hence the 5 minute
 * threshold check (we’d show “Coming up” instead of “unhealthy” if the project is within 5
 * minutes of when it was created). Might be related to decoupling "ready" state vs "health checks"
 */

export const ServiceStatus = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const projectForModel =
    project != null
      ? {
          ref: project.ref,
          parentRef: project.parentRef,
          status: project.status,
          inserted_at: project.inserted_at,
        }
      : undefined

  const {
    services,
    allServicesOperational,
    isProjectNew,
    isProjectComingUp,
    overallStatusLabel,
  } = useProjectHomeServiceStatusModel(ref, projectForModel)

  if (!ref) {
    return null
  }

  return (
    <Popover_Shadcn_>
      <PopoverTrigger_Shadcn_>
        <SingleStat
          icon={
            isProjectComingUp ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <div className="grid grid-cols-3 gap-1">
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
          }
          label={<span>Status</span>}
          value={<span>{overallStatusLabel}</span>}
        />
      </PopoverTrigger_Shadcn_>
      <ServiceStatusPopoverContent
        projectRef={ref}
        services={services}
        isProjectNew={isProjectNew}
        isProjectComingUp={isProjectComingUp}
        allServicesOperational={allServicesOperational}
      />
    </Popover_Shadcn_>
  )
}
