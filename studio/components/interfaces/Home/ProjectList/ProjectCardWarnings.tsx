import { ResourceWarningResponse } from 'data/usage/resource-warnings-query'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, IconAlertTriangle } from 'ui'

export type ResourceWarningResponses = Omit<
  Omit<ResourceWarningResponse, 'project'>,
  'is_readonly_mode_enabled'
>

export interface ProjectCardWarningsProps {
  resourceWarnings: ResourceWarningResponses
}

// reference for message wording
// www.notion.so/supabase/Notify-users-on-resource-exhaustion-on-the-dashboard-4bb7b9a990104720b179b7a37d07f41c?pvs=4#a79798b5ac72402e8bfea4c4715e7439
const RESOURCE_WARNING_MESSAGES = {
  is_readonly_mode_enabled: {
    title: 'Project in readonly mode',
    description: 'This database will no longer accept write requests.',
  },
  is_disk_io_budget_below_threshold: {
    title: 'Your project is depleting its Disk IO Budget',
    description: 'Your instance may become unresponsive if fully exhausted.',
  },
  is_disk_space_usage_beyond_threshold: {
    title: 'Project has exhausted disk space budget',
    description: 'Your instance may become unresponsive if fully exhausted.',
  },
  is_cpu_load_beyond_threshold: {
    title: 'Your project has high CPU usage',
    description: `Your instance's performance is affected`,
  },
  is_memory_and_swap_usage_beyond_threshold: {
    title: 'Your project has high memory usage',
    description: `Your instance's performance is affected.`,
  },
  multiple_resource_warnings: {
    title: 'Your project is burning up',
    description: `Your instance's performance is affected.`,
  },
}

export default function ProjectCardWarnings({ resourceWarnings }: ProjectCardWarningsProps) {
  const activeWarnings = Object.keys(resourceWarnings).filter(
    (property) => resourceWarnings[property as keyof typeof resourceWarnings] === true
  )

  return (
    <div>
      <Alert_Shadcn_ variant="warning">
        <IconAlertTriangle strokeWidth={2} />
        <AlertTitle_Shadcn_>
          {activeWarnings.length > 1
            ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.title
            : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof resourceWarnings]?.title}
        </AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>
          {activeWarnings.length > 1
            ? RESOURCE_WARNING_MESSAGES.multiple_resource_warnings.description
            : RESOURCE_WARNING_MESSAGES[activeWarnings[0] as keyof typeof resourceWarnings]
                ?.description}
        </AlertDescription_Shadcn_>
      </Alert_Shadcn_>
      {/* <pre>{JSON.stringify(resourceWarnings, null, 2)}</pre> */}
    </div>
  )
}
