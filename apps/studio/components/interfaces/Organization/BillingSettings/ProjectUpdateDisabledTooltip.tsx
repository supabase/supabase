import { PropsWithChildren } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export interface ProjectUpdateDisabledTooltipProps {
  projectUpdateDisabled: boolean
  projectNotActive?: boolean
  tooltip?: string
}

export const ProjectUpdateDisabledTooltip = ({
  projectUpdateDisabled,
  projectNotActive = false,
  children,
  tooltip,
}: PropsWithChildren<ProjectUpdateDisabledTooltipProps>) => {
  const tooltipMessage =
    tooltip ||
    (projectUpdateDisabled
      ? 'Subscription changes are currently disabled. Our engineers are working on a fix.'
      : projectNotActive
        ? 'Unable to update subscription as project is currently not active'
        : undefined)

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      {tooltipMessage !== undefined && (
        <TooltipContent side="bottom" className="w-64 text-center">
          {tooltipMessage}
        </TooltipContent>
      )}
    </Tooltip>
  )
}
