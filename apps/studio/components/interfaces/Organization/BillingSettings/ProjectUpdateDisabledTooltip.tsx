import * as Tooltip from '@radix-ui/react-tooltip'
import { PropsWithChildren } from 'react'

export interface ProjectUpdateDisabledTooltipProps {
  projectUpdateDisabled: boolean
  projectNotActive?: boolean
}

const ProjectUpdateDisabledTooltip = ({
  projectUpdateDisabled,
  projectNotActive = false,
  children,
}: PropsWithChildren<ProjectUpdateDisabledTooltipProps>) => {
  const showTooltip = projectUpdateDisabled || projectNotActive

  return (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      {showTooltip ? (
        <Tooltip.Portal>
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-alternative py-1 px-2 leading-none shadow',
                'border border-background',
              ].join(' ')}
            >
              <span className="text-xs text-foreground">
                {projectUpdateDisabled
                  ? 'Subscription changes are currently disabled. Our engineers are working on a fix.'
                  : projectNotActive
                  ? 'Unable to update subscription as project is currently not active'
                  : ''}
              </span>
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      ) : null}
    </Tooltip.Root>
  )
}

export default ProjectUpdateDisabledTooltip
