import { AlertTriangle, Info, PauseCircle, RefreshCcw } from 'lucide-react'

import { RESOURCE_WARNING_MESSAGES } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner.constants'
import { getWarningContent } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner.utils'
import type { ResourceWarning } from 'data/usage/resource-warnings-query'
import {
  Alert_Shadcn_,
  AlertTitle_Shadcn_,
  Badge,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { InferredProjectStatus } from './ProjectCard.utils'

export interface ProjectCardWarningsProps {
  resourceWarnings?: ResourceWarning
  projectStatus: InferredProjectStatus
  renderMode?: 'alert' | 'badge' // New prop to control rendering mode
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
        <Badge variant="success" className="rounded-md">
          Active
        </Badge>
      )
    }
    return null
  }

  if (renderMode === 'badge') {
    const badgeVariant = isCritical
      ? 'destructive'
      : activeWarnings.length > 0 ||
          projectStatus === 'isPauseFailed' ||
          projectStatus === 'isRestoreFailed'
        ? 'warning'
        : projectStatus === 'isHealthy'
          ? 'success'
          : 'default'

    return alertDescription ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="rounded-md" variant={badgeVariant}>
            {alertTitle}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom">{alertDescription}</TooltipContent>
      </Tooltip>
    ) : (
      <Badge className="rounded-md" variant={badgeVariant}>
        {alertTitle}
      </Badge>
    )
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
      {['isPaused', 'isPausing'].includes(projectStatus ?? '') ? (
        <PauseCircle strokeWidth={1.5} size={12} />
      ) : ['isRestoring', 'isComingUp', 'isRestarting', 'isResizing'].includes(
          projectStatus ?? ''
        ) ? (
        <RefreshCcw strokeWidth={1.5} size={12} />
      ) : (
        <AlertTriangle strokeWidth={1.5} size={12} />
      )}
      <div className="flex justify-between items-center w-full gap-x-1">
        <AlertTitle_Shadcn_ className="text-xs mb-0">{alertTitle}</AlertTitle_Shadcn_>
        <Tooltip>
          <TooltipTrigger>
            <Info size={14} className="text-foreground-light hover:text-foreground" />
          </TooltipTrigger>
          <TooltipContent side="bottom">{alertDescription}</TooltipContent>
        </Tooltip>
      </div>
    </Alert_Shadcn_>
  )
}
