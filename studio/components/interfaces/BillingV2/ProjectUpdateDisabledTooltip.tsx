import * as Tooltip from '@radix-ui/react-tooltip'
import { PropsWithChildren } from 'react'

export interface ProjectUpdateDisabledTooltipProps {
  projectUpdateDisabled: boolean
}

const ProjectUpdateDisabledTooltip = ({
  projectUpdateDisabled,
  children,
}: PropsWithChildren<ProjectUpdateDisabledTooltipProps>) => {
  return (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      {projectUpdateDisabled ? (
        <Tooltip.Portal>
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                'border border-scale-200',
              ].join(' ')}
            >
              <span className="text-xs text-scale-1200">
                Subscription changes are currently disabled. Our engineers are working on a fix.
              </span>
            </div>
          </Tooltip.Content>
        </Tooltip.Portal>
      ) : null}
    </Tooltip.Root>
  )
}

export default ProjectUpdateDisabledTooltip
