import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_ } from 'ui'
import { IS_PLATFORM } from '@/lib/constants'
import { useSelfHostedProjects } from '@/hooks/useMultiDatabaseProjects'

/**
 * MultiDatabaseBanner
 *
 * Shown in self-hosted mode when more than one database is registered in the
 * project registry. Reminds users they can use the project switcher to navigate
 * between databases.
 *
 * Returns null in platform mode or when only one database is configured.
 */
export function MultiDatabaseBanner() {
  const { data: projects, isLoading } = useSelfHostedProjects()

  if (IS_PLATFORM || isLoading || !projects || projects.length <= 1) return null

  return (
    <Alert_Shadcn_ variant="default" className="mb-4">
      <AlertTitle_Shadcn_>Multi-Database Mode Active</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        {projects.length} databases configured. Use the project switcher in the sidebar to navigate
        between them.
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}