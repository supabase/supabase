import * as Tooltip from '@radix-ui/react-tooltip'
import { RESOURCE_WARNING_MESSAGES } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner.constants'
import { getWarningContent } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner.utils'
import { ResourceWarning } from 'data/usage/resource-warnings-query'
import { AlertTriangle, Info, RefreshCcw } from 'lucide-react'
import { Alert_Shadcn_, AlertTitle_Shadcn_, cn, IconPauseCircle } from 'ui'
import { InferredProjectStatus } from './ProjectCard.utils'

export interface ProjectCardWarningsProps {
  resourceWarnings?: ResourceWarning
  projectStatus: InferredProjectStatus
}

export const ProjectCardStatus = ({
  resourceWarnings,
  projectStatus,
}: ProjectCardWarningsProps) => {
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
  const warningContent =
    resourceWarnings !== undefined
      ? getWarningContent(resourceWarnings, activeWarnings[0], 'cardContent')
      : undefined

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
      : warningContent?.title
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
      : warningContent?.description
  }

  const alertTitle = getTitle()
  const alertDescription = getDescription()
  const alertType = isCritical
    ? 'destructive'
    : projectStatus === 'isPaused'
    ? 'default'
    : 'warning'

  if (
    (activeWarnings.length === 0 && projectStatus === 'isHealthy') ||
    warningContent === undefined
  ) {
    return null
  }

  return (
    <Alert_Shadcn_
      variant={alertType}
      className={cn(
        'border-0 p-5 pb-[1.25rem]',
        'bg-transparent',
        '[&>svg]:left-[1.25rem] [&>svg]:top-3.5 [&>svg]:border',
        !isCritical ? '[&>svg]:text-foreground [&>svg]:bg-surface-100' : ''
      )}
    >
      {projectStatus === 'isPaused' || projectStatus === 'isPausing' ? (
        <IconPauseCircle strokeWidth={1.5} size={12} />
      ) : projectStatus === 'isRestoring' || projectStatus === 'isComingUp' ? (
        <RefreshCcw strokeWidth={1.5} size={12} />
      ) : (
        <AlertTriangle strokeWidth={1.5} size={12} />
      )}
      <div className="flex justify-between items-center w-full">
        <AlertTitle_Shadcn_ className="text-xs mb-0">{alertTitle}</AlertTitle_Shadcn_>
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <Info size={14} className="text-foreground-light hover:text-foreground" />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow',
                  'border border-background',
                ].join(' ')}
              >
                <span className="text-xs text-foreground">{alertDescription}</span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </Alert_Shadcn_>
  )
}
