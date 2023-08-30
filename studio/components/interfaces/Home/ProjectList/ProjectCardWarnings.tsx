import { ResourceWarning } from 'data/usage/resource-warnings-query'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, IconAlertTriangle } from 'ui'

export interface ProjectCardWarningsProps {
  resourceWarnings: ResourceWarning
}

const RESOURCE_WARNING_MESSAGES = {
  is_readonly_mode_enabled: {
    warning: {
      title: 'Project is in readonly mode',
      description: 'Database is no longer accept write requests.',
    },
    critical: {
      title: 'Project is in readonly mode',
      description: 'Database is no longer accept write requests.',
    },
  },
  disk_io_exhaustion: {
    warning: {
      title: 'Project is depleting its Disk IO Budget',
      description: 'Instance may become unresponsive if fully exhausted.',
    },
    critical: {
      title: 'Project has depleted its Disk IO Budget',
      description: 'Instance may become unresponsive.',
    },
  },
  disk_space_exhaustion: {
    warning: {
      title: 'Project is exhausting disk space budget',
      description: 'Instance may become unresponsive if fully exhausted.',
    },
    critical: {
      title: 'Project has exhausted disk space budget',
      description: 'Instance may become unresponsive.',
    },
  },
  cpu_exhaustion: {
    warning: {
      title: 'Project has high CPU usage',
      description: `Instance's performance is affected`,
    },
    critical: {
      title: 'Project CPU usage is at 100%',
      description: `Instance's performance is affected`,
    },
  },
  memory_and_swap_exhaustion: {
    warning: {
      title: 'Project has high memory usage',
      description: `Instance's performance is affected.`,
    },
    critical: {
      title: 'Project memory usage is at 100%',
      description: `Instance's performance is affected.`,
    },
  },
  multiple_resource_warnings: {
    warning: {
      title: 'Project is exhausting multiple resources',
      description: `Instance's performance is affected.`,
    },
    critical: {
      title: 'Project has exhausted at least one resource',
      description: `Instance's performance is affected.`,
    },
  },
}

const ProjectCardWarnings = ({ resourceWarnings }: ProjectCardWarningsProps) => {
  // [Joshen] Read only takes higher precedence over multiple resource warnings
  const activeWarnings = resourceWarnings.is_readonly_mode_enabled
    ? ['is_readonly_mode_enabled']
    : Object.keys(resourceWarnings).filter(
        (property) =>
          property !== 'project' &&
          property !== 'is_readonly_mode_enabled' &&
          resourceWarnings[property as keyof typeof resourceWarnings] !== null
      )

  const getContent = (metric: string) => {
    if (metric === 'is_readonly_mode_enabled') {
      return RESOURCE_WARNING_MESSAGES.is_readonly_mode_enabled.warning
    }
    const severity = resourceWarnings[metric as keyof typeof resourceWarnings]
    if (typeof severity !== 'string') return undefined
    return RESOURCE_WARNING_MESSAGES[metric as keyof typeof RESOURCE_WARNING_MESSAGES][
      severity as 'warning' | 'critical'
    ]
  }

  const hasCriticalWarning = activeWarnings.some(
    (x) => resourceWarnings[x as keyof typeof resourceWarnings] === 'critical'
  )

  const isCritical = activeWarnings.includes('is_readonly_mode_enabled') || hasCriticalWarning

  if (activeWarnings.length === 0) return <div className="py-2" />

  return (
    <div>
      <Alert_Shadcn_
        variant={isCritical ? 'destructive' : 'warning'}
        className="border-r-0 border-l-0 rounded-none my-2 mb-2.5"
      >
        <IconAlertTriangle strokeWidth={2} />

        <AlertTitle_Shadcn_ className="text-xs mb-0.5">
          {activeWarnings.length > 1
            ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings[
                hasCriticalWarning ? 'critical' : 'warning'
              ].title
            : getContent(activeWarnings[0])?.title}
        </AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_ className="text-xs">
          {activeWarnings.length > 1
            ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings[
                hasCriticalWarning ? 'critical' : 'warning'
              ].description
            : getContent(activeWarnings[0])?.description}
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
    </div>
  )
}

export default ProjectCardWarnings
