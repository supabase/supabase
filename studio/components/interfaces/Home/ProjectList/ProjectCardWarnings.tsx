import { ResourceWarning } from 'data/usage/resource-warnings-query'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, IconAlertTriangle } from 'ui'

export interface ProjectCardWarningsProps {
  resourceWarnings: ResourceWarning
}

// reference for message wording
// www.notion.so/supabase/Notify-users-on-resource-exhaustion-on-the-dashboard-4bb7b9a990104720b179b7a37d07f41c?pvs=4#a79798b5ac72402e8bfea4c4715e7439
const RESOURCE_WARNING_MESSAGES = {
  is_readonly_mode_enabled: {
    title: 'Project is in readonly mode',
    description: 'Database is no longer accept write requests.',
  },
  is_disk_io_budget_below_threshold: {
    title: 'Project is depleting its Disk IO Budget',
    description: 'Instance may become unresponsive if fully exhausted.',
  },
  is_disk_space_usage_beyond_threshold: {
    title: 'Project is exhausting disk space budget',
    description: 'Instance may become unresponsive if fully exhausted.',
  },
  is_cpu_load_beyond_threshold: {
    title: 'Project has high CPU usage',
    description: `Instance's performance is affected`,
  },
  is_memory_and_swap_usage_beyond_threshold: {
    title: 'Project has high memory usage',
    description: `Instance's performance is affected.`,
  },
  multiple_resource_warnings: {
    title: 'Project is exhausting multiple resources',
    description: `Instance's performance is affected.`,
  },
}

export default function ProjectCardWarnings({ resourceWarnings }: ProjectCardWarningsProps) {
  const activeWarnings = Object.keys(resourceWarnings).filter(
    (property) => resourceWarnings[property as keyof typeof resourceWarnings] === true
  )
  const hasHighPriorityWarning = activeWarnings.includes('is_readonly_mode_enabled')

  return (
    <div>
      <Alert_Shadcn_
        variant={hasHighPriorityWarning ? 'destructive' : 'warning'}
        className="border-r-0 border-l-0 rounded-none my-2 mb-2.5"
      >
        <IconAlertTriangle strokeWidth={2} />

        <AlertTitle_Shadcn_ className="text-xs mb-0.5">
          {activeWarnings.length > 1
            ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.title
            : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
                ?.title}
        </AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_ className="text-xs">
          {activeWarnings.length > 1
            ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.description
            : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof RESOURCE_WARNING_MESSAGES]
                ?.description}
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
      {/* <pre>{JSON.stringify(resourceWarnings, null, 2)}</pre> */}
    </div>
  )
}
