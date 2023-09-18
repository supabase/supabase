import { RESOURCE_WARNING_MESSAGES } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner.constants'
import { ResourceWarning } from 'data/usage/resource-warnings-query'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  IconAlertTriangle,
  IconPauseCircle,
  IconRefreshCw,
} from 'ui'
import { InferredProjectStatus } from './ProjectCard.utils'
import { getWarningContent } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner.utils'

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
        className="border-0 rounded-none rounded-b-md my-2 mb-2.5 [&>svg]:w-[28px] [&>svg]:h-[28px] [&>svg]:mt-1 [&>svg]:p-1.5 [&>svg]:left-6 pl-6 group-hover:bg-destructive-300 transition-colors"
      >
        {projectStatus === 'isPaused' || projectStatus === 'isPausing' ? (
          <IconPauseCircle strokeWidth={2} />
        ) : projectStatus === 'isRestoring' || projectStatus === 'isComingUp' ? (
          <IconRefreshCw size={14} strokeWidth={2} />
        ) : (
          <IconAlertTriangle strokeWidth={2} />
        )}
        <AlertTitle_Shadcn_ className="text-sm mb-0.5">{alertTitle}</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_ className="text-xs">{alertDescription}</AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    </div>
  )
}
