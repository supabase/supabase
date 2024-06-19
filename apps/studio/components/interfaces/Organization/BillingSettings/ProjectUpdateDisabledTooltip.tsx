import { PropsWithChildren } from 'react'
import { TooltipContent_Shadcn_, TooltipTrigger_Shadcn_, Tooltip_Shadcn_ } from 'ui'

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
    <Tooltip_Shadcn_>
      <TooltipTrigger_Shadcn_ asChild>{children}</TooltipTrigger_Shadcn_>
      {projectUpdateDisabled && (
        <TooltipContent_Shadcn_ side="bottom" className="w-72 text-center">
          {projectUpdateDisabled
            ? tooltip ||
              'Subscription changes are currently disabled. Our engineers are working on a fix.'
            : projectNotActive
              ? 'Unable to update subscription as project is currently not active'
              : ''}
        </TooltipContent_Shadcn_>
      )}
    </Tooltip_Shadcn_>
  )
}

export default ProjectUpdateDisabledTooltip
