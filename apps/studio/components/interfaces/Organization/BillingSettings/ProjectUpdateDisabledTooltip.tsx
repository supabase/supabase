import { PropsWithChildren } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export interface ProjectUpdateDisabledTooltipProps {
  projectUpdateDisabled: boolean
  projectNotActive?: boolean
  projectNotAwsProvider?: boolean
  tooltip?: string
}

const ProjectUpdateDisabledTooltip = ({
  projectUpdateDisabled,
  projectNotActive = false,
  projectNotAwsProvider = false,
  children,
  tooltip,
}: PropsWithChildren<ProjectUpdateDisabledTooltipProps>) => {
  const tooltipMessage = projectUpdateDisabled
    ? tooltip ?? 'Subscription changes are currently disabled. Our engineers are working on a fix.'
    : projectNotActive
      ? 'Unable to update subscription as project is currently not active'
      : projectNotAwsProvider
        ? 'Dedicated IPv4 address is only available for AWS projects'
        : undefined

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

export default ProjectUpdateDisabledTooltip
