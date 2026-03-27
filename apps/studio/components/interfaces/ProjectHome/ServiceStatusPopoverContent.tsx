import { InlineLink } from 'components/ui/InlineLink'
import { DOCS_URL } from 'lib/constants'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { InfoIcon, PopoverContent_Shadcn_ } from 'ui'

import { StatusIcon, StatusMessage } from '../Home/ServiceStatus'
import {
  SERVICE_STATUS_THRESHOLD_MINUTES,
  type ProjectHomeServiceRow,
} from './useProjectHomeServiceStatusModel'

type Props = {
  projectRef: string
  services: ProjectHomeServiceRow[]
  isProjectNew: boolean
  isProjectComingUp: boolean
  allServicesOperational: boolean
}

export function ServiceStatusPopoverContent({
  projectRef,
  services,
  isProjectNew,
  isProjectComingUp,
  allServicesOperational,
}: Props) {
  return (
    <PopoverContent_Shadcn_ className="w-60 p-0" side="bottom" align="start">
      {services.map((service) => (
        <Link
          href={`/project/${projectRef}${service.logsUrl}`}
          key={service.name}
          className="transition px-3 py-2 text-xs flex items-center justify-between border-b last:border-none group relative hover:bg-surface-300"
        >
          <div className="flex gap-x-2">
            <StatusIcon
              isLoading={service.isLoading}
              isProjectNew={isProjectNew}
              projectStatus={service.status}
            />
            <div className="flex-1">
              <p>{service.name}</p>
              <p className="text-foreground-light flex items-center gap-1">
                <StatusMessage
                  isLoading={service.isLoading}
                  isProjectNew={isProjectNew}
                  status={
                    isProjectComingUp && service.status === 'UNHEALTHY'
                      ? 'COMING_UP'
                      : service.status
                  }
                />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-x-1 transition opacity-0 group-hover:opacity-100">
            <span className="text-xs text-foreground">View logs</span>
            <ChevronRight size={14} className="text-foreground" />
          </div>
        </Link>
      ))}
      {!allServicesOperational && (
        <div className="flex gap-2 text-xs text-foreground-light px-3 py-2">
          <div className="mt-0.5">
            <InfoIcon />
          </div>
          <div className="flex flex-col gap-y-1">
            <p>
              {isProjectNew ? 'New' : 'Recently restored'} projects can take up to{' '}
              {SERVICE_STATUS_THRESHOLD_MINUTES} minutes to become fully operational.
            </p>
            <p>
              If services stay unhealthy, refer to our{' '}
              <InlineLink
                href={`${DOCS_URL}/guides/troubleshooting/project-status-reports-unhealthy-services`}
              >
                docs
              </InlineLink>{' '}
              for more information.
            </p>
          </div>
        </div>
      )}
    </PopoverContent_Shadcn_>
  )
}
