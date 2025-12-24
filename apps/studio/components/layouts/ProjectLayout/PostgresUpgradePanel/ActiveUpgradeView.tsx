import dayjs from 'dayjs'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { PageSection } from 'ui-patterns/PageSection'
import { UpgradeStepsTable } from './UpgradeStepsTable'
import { UPGRADE_STATE_CONTENT } from './types'

type ActiveUpgradeViewProps =
  | {
      variant: 'upgrading'
      progress: string | undefined
      initiatedAt: string | undefined
    }
  | {
      variant: 'backingUp'
      initiatedAt: string | undefined
    }

export const ActiveUpgradeView = (props: ActiveUpgradeViewProps) => {
  const { variant, initiatedAt } = props

  const content = UPGRADE_STATE_CONTENT[variant]

  const initiatedAtUTC = dayjs.utc(initiatedAt ?? 0).format('DD MMM YYYY HH:mm:ss')
  const initiatedAtLocal = dayjs
    .utc(initiatedAt ?? 0)
    .local()
    .format('DD MMM YYYY HH:mm:ss (ZZ)')

  return (
    <PageSection>
      <div className="flex flex-col gap-y-3">
        <h3 className="text-lg">{content.stepsHeading}</h3>
        {variant === 'upgrading' ? (
          <UpgradeStepsTable variant="upgrading" progress={props.progress} />
        ) : (
          <UpgradeStepsTable variant="backingUp" />
        )}
        {initiatedAt !== undefined && (
          <p className="text-sm text-foreground-muted animate-in fade-in duration-300">
            Upgrade began at{' '}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="underline decoration-dotted underline-offset-2 decoration-foreground-muted hover:text-foreground-light transition-colors duration-100">
                  {initiatedAtUTC} (UTC)
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-center">
                {initiatedAtLocal}
              </TooltipContent>
            </Tooltip>
            .
          </p>
        )}
      </div>
    </PageSection>
  )
}
