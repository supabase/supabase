import { PropsWithChildren } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

export interface ProjectUpdateDisabledTooltipProps {
  projectUpdateDisabled: boolean
  projectNotActive?: boolean
  tooltip?: string
}

const ProjectUpdateDisabledTooltip = ({
  projectUpdateDisabled,
  projectNotActive = false,
  children,
  tooltip,
}: PropsWithChildren<ProjectUpdateDisabledTooltipProps>) => {
  const showTooltip = projectUpdateDisabled || projectNotActive

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      {showTooltip && (
        <TooltipContent side="bottom" className="w-72 text-center">
          {projectUpdateDisabled
            ? tooltip ||
              'Subscription changes are currently disabled. Our engineers are working on a fix.'
            : projectNotActive
              ? 'Unable to update subscription as project is currently not active'
              : ''}
        </TooltipContent>
      )}
    </Tooltip>
  )
}

export default ProjectUpdateDisabledTooltip
