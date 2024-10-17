import { AlertTriangle, Info, PauseCircle, RefreshCcw } from 'lucide-react'

import { RESOURCE_WARNING_MESSAGES } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner.constants'
import { getWarningContent } from 'components/ui/ResourceExhaustionWarningBanner/ResourceExhaustionWarningBanner.utils'
import type { ResourceWarning } from 'data/usage/resource-warnings-query'
import {
  Alert_Shadcn_,
  AlertTitle_Shadcn_,
  cn,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { InferredProjectStatus } from './ProjectCard.utils'

export interface ProjectCardWarningsProps {
  resourceWarnings?: ResourceWarning
  projectStatus: InferredProjectStatus
}

export const ProjectCardStatus = ({
  resourceWarnings: allResourceWarnings,
  projectStatus,
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
    if (projectStatus === 'isPaused') return 'Project is paused'
    if (projectStatus === 'isPausing') return 'Project is pausing'
    if (projectStatus === 'isRestarting') return 'Project is restarting'
    if (projectStatus === 'isResizing') return 'Project is resizing'
    if (projectStatus === 'isComingUp') return 'Project is coming up'
    if (projectStatus === 'isRestoring') return 'Project is restoring'
    if (projectStatus === 'isUpgrading') return 'Project is upgrading'
    if (projectStatus === 'isRestoreFailed') return 'Project restore failed'
    if (projectStatus === 'isPauseFailed') return 'Project pause failed'

    if (!resourceWarnings) return undefined

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
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_>
            <Info size={14} className="text-foreground-light hover:text-foreground" />
          </TooltipTrigger_Shadcn_>
          <TooltipContent_Shadcn_ side="bottom">{alertDescription}</TooltipContent_Shadcn_>
        </Tooltip_Shadcn_>
      </div>
    </Alert_Shadcn_>
  )
}
