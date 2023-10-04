import { RESOURCE_WARNING_MESSAGES } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner.constants'
import { ResourceWarning } from 'data/usage/resource-warnings-query'
import {
  Alert_Shadcn_,
  AlertTitle_Shadcn_,
  cn,
  IconAlertTriangle,
  IconPauseCircle,
  IconRefreshCw,
} from 'ui'
import { InferredProjectStatus } from './ProjectCard.utils'
import { getWarningContent } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner.utils'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Info } from 'lucide-react'

export interface ProjectCardWarningsProps {
  resourceWarnings?: ResourceWarning
  projectStatus: InferredProjectStatus
}

export const ProjectCardStatus = ({
  resourceWarnings,
  projectStatus,
}: ProjectCardWarningsProps) => {
  //const showResourceExhaustionWarnings = useFlag('resourceExhaustionWarnings')
  const showResourceExhaustionWarnings = false

  // [Joshen] Read only takes higher precedence over multiple resource warnings
  const activeWarnings = resourceWarnings?.is_readonly_mode_enabled
    ? ['is_readonly_mode_enabled']
    : Object.keys(resourceWarnings || {}).filter(
        (property) =>
          property !== 'project' &&
          property !== 'is_readonly_mode_enabled' &&
          resourceWarnings?.[property as keyof typeof resourceWarnings] !== null
      )

  const hasCriticalWarning = activeWarnings.some(
    (x) => resourceWarnings?.[x as keyof typeof resourceWarnings] === 'critical'
  )
  const isCritical = activeWarnings.includes('is_readonly_mode_enabled') || hasCriticalWarning

  const getTitle = () => {
    if (projectStatus === 'isPaused') return 'Project is paused'
    if (projectStatus === 'isPausing') return 'Project is pausing'
    if (projectStatus === 'isComingUp') return 'Project is coming up'
    if (projectStatus === 'isRestoring') return 'Project is restoring'

    if (!resourceWarnings) return undefined

    // If none of the paused/restoring states match, proceed with the default logic
    return activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.cardContent[
          hasCriticalWarning ? 'critical' : 'warning'
        ].title
      : getWarningContent(resourceWarnings, activeWarnings[0], 'cardContent')?.title
  }

  const getDescription = () => {
    if (projectStatus === 'isPaused') return 'This project will not accept requests until resumed'
    if (projectStatus === 'isPausing') return 'The pause process will complete in a few minutes'
    if (projectStatus === 'isComingUp') return 'Your project will be ready in a few minutes'
    if (projectStatus === 'isRestoring') return 'Your project will be ready in a few minutes'

    if (!resourceWarnings) return undefined

    // If none of the paused/restoring states match, proceed with the default logic
    return activeWarnings.length > 1 && showResourceExhaustionWarnings
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.cardContent[
          hasCriticalWarning ? 'critical' : 'warning'
        ].description
      : getWarningContent(resourceWarnings, activeWarnings[0], 'cardContent')?.description
  }

  const alertTitle = getTitle()
  const alertDescription = getDescription()
  const alertType = isCritical
    ? 'destructive'
    : projectStatus === 'isPaused'
    ? 'default'
    : 'warning'

  if (activeWarnings.length === 0 && projectStatus === 'isHealthy') return <div className="py-2" />

  return (
    <div>
      <Alert_Shadcn_
        variant={alertType}
        className={cn(
          `border-0 rounded-none rounded-b-md my-2 mb-2.5 [&>svg]:top-2.5 [&>svg]:w-[24px] [&>svg]:h-[24px] [&>svg]:p-1.5 [&>svg]:left-4 pl-2 bg-transparent transition-colors flex items-center`,
          !isCritical
            ? '[&>svg]:text-foreground [&>svg]:bg-scale-400 [&>svg]:dark:bg-scale-600'
            : ''
        )}
      >
        {projectStatus === 'isPaused' || projectStatus === 'isPausing' ? (
          <IconPauseCircle strokeWidth={2} />
        ) : projectStatus === 'isRestoring' || projectStatus === 'isComingUp' ? (
          <IconRefreshCw size={14} strokeWidth={2} />
        ) : (
          <IconAlertTriangle strokeWidth={2} />
        )}
        <div className="flex justify-between items-center w-full pr-0.5">
          <AlertTitle_Shadcn_ className="text-xs mb-0 mr-8">{alertTitle}</AlertTitle_Shadcn_>
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              <Info size={14} />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                    'border border-scale-200',
                  ].join(' ')}
                >
                  <span className="text-xs text-foreground">{alertDescription}</span>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </Alert_Shadcn_>
    </div>
  )
}
