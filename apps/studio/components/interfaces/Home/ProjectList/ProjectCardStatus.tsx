import { AlertTriangle, Info, PauseCircle, RefreshCcw } from 'lucide-react'

import { RESOURCE_WARNING_MESSAGES } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner.constants'
import { getWarningContent } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner.utils'
import type { ResourceWarning } from 'data/usage/resource-warnings-query'
import { Badge, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { InferredProjectStatus } from './ProjectCard.utils'

export interface ProjectCardWarningsProps {
  resourceWarnings?: ResourceWarning
  projectStatus: InferredProjectStatus
  renderMode?: 'alert' | 'badge'
}

export const ProjectCardStatus = ({
  resourceWarnings: allResourceWarnings,
  projectStatus,
  renderMode = 'alert',
}: ProjectCardWarningsProps) => {
  const showResourceExhaustionWarnings = false

  // [Terry] temp to remove auth_restricted_email_sending property from resourceWarnings
  // set auth_restricted_email_sending from 'warning' to null so it doesn't show up in the warning banner
  // [Joshen] Can remove this eventually once the auth email thing is resolved (Nov 2024)
  const resourceWarnings = allResourceWarnings
    ? {
        ...allResourceWarnings,
        auth_restricted_email_sending: null,
      }
    : undefined

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
    switch (projectStatus) {
      case 'isPaused':
        return renderMode === 'badge' ? 'Paused' : 'Project is paused'
      case 'isPausing':
        return renderMode === 'badge' ? 'Pausing' : 'Project is pausing'
      case 'isRestarting':
        return renderMode === 'badge' ? 'Restarting' : 'Project is restarting'
      case 'isResizing':
        return renderMode === 'badge' ? 'Resizing' : 'Project is resizing'
      case 'isComingUp':
        return renderMode === 'badge' ? 'Starting' : 'Project is coming up'
      case 'isRestoring':
        return renderMode === 'badge' ? 'Restoring' : 'Project is restoring'
      case 'isUpgrading':
        return renderMode === 'badge' ? 'Upgrading' : 'Project is upgrading'
      case 'isRestoreFailed':
        return renderMode === 'badge' ? 'Restore Failed' : 'Project restore failed'
      case 'isPauseFailed':
        return renderMode === 'badge' ? 'Pause Failed' : 'Project pause failed'
    }

    if (!resourceWarnings) {
      return renderMode === 'badge' && projectStatus === 'isHealthy' ? 'Active' : undefined
    }

    // If none of the paused/restoring states match, proceed with the default logic
    return activeWarnings.length > 1
      ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.cardContent[
          hasCriticalWarning ? 'critical' : 'warning'
        ].title
      : warningContent?.title
  }

  const getDescription = () => {
    switch (projectStatus) {
      case 'isPaused':
        return 'This project will not accept requests until resumed'
      case 'isPausing':
        return 'The pause process will complete in a few minutes'
      case 'isRestarting':
      case 'isResizing':
      case 'isComingUp':
      case 'isRestoring':
      case 'isUpgrading':
        return 'Your project will be ready in a few minutes'
      case 'isRestoreFailed':
      case 'isPauseFailed':
        return 'Please contact support for assistance'
    }

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
    (activeWarnings.length === 0 || warningContent === undefined) &&
    projectStatus === 'isHealthy'
  ) {
    if (renderMode === 'badge') {
      return (
        // Badge must be wrapped in a div in order to be centered in table cell
        <div className="flex items-center">
          <Badge variant="success">Active</Badge>
        </div>
      )
    }
    return null
  }

  if (renderMode === 'badge') {
    // Render a fallback en dash if no title is available
    if (!alertTitle) return <span className="text-xs text-foreground-muted">–</span>

    const badgeVariant = isCritical
      ? 'destructive'
      : activeWarnings.length > 0 ||
          projectStatus === 'isPauseFailed' ||
          projectStatus === 'isRestoreFailed'
        ? 'warning'
        : projectStatus === 'isHealthy'
          ? 'success'
          : 'default'

    return (
      // Badge must be wrapped in a div in order to be centered in table cell
      <div className="flex items-center">
        {alertDescription ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={badgeVariant}>{alertTitle}</Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">{alertDescription}</TooltipContent>
          </Tooltip>
        ) : (
          <Badge variant={badgeVariant}>{alertTitle}</Badge>
        )}
      </div>
    )
  }

  // Only render if an alert title is available
  if (!alertTitle) return null

  return (
    <div role="alert" className={cn('w-full p-5 pb-[1.25rem] flex flex-row gap-x-2 items-center')}>
      {/* Icon */}
      <div
        className={cn(
          'shrink-0 w-6 h-6 border rounded-md flex items-center justify-center',
          alertType === 'destructive' && 'border-destructive-400 [&>svg]:text-destructive-600',
          alertType === 'warning' && 'border-warning-400 [&>svg]:text-warning-600',
          alertType === 'default' && 'border-strong [&>svg]:text-foreground'
        )}
      >
        {['isPaused', 'isPausing'].includes(projectStatus ?? '') ? (
          <PauseCircle strokeWidth={1.5} size={14} />
        ) : ['isRestoring', 'isComingUp', 'isRestarting', 'isResizing'].includes(
            projectStatus ?? ''
          ) ? (
          <RefreshCcw strokeWidth={1.5} size={14} />
        ) : (
          <AlertTriangle strokeWidth={1.5} size={14} />
        )}
      </div>
      {/* Text and tooltip icon */}
      <div className="flex items-center w-full gap-x-2">
        <p className="text-xs">{alertTitle}</p>
        <Tooltip>
          <TooltipTrigger>
            <Info
              size={12}
              className="text-foreground-lighter hover:text-foreground transition-colors"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">{alertDescription}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
