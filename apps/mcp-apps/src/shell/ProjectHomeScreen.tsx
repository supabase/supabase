import type { Bootstrap, Project } from '@supabase/mcp-server-supabase/apps'
import { ProjectHome } from 'surfaces/project'

import { useApp } from '../host/app-context'
import { askAgentFor } from '../host/project-prompts'
import { useNotebooks, useProjectOverview } from '../host/use-app-data'

/** Loads the project overview and renders the shared Home view with it. */
export function ProjectHomeScreen({
  project,
  context,
  refreshRevision,
}: {
  project: Project
  context: Bootstrap
  refreshRevision: number
}) {
  const { agent } = useApp()
  const overview = useProjectOverview(project, refreshRevision)
  const notebooks = useNotebooks(project, refreshRevision)
  return (
    <ProjectHome
      project={project}
      capabilities={context.capabilities}
      organizationName={
        context.organizations.find((org) => org.id === project.organization_id)?.name
      }
      overview={overview.value}
      onRefresh={overview.reload}
      // Notebooks are optional: a server without them, or a failed read, leaves the section out.
      notebooks={notebooks.value.status === 'error' ? undefined : notebooks.value}
      onRefreshNotebooks={notebooks.reload}
      onAsk={askAgentFor(agent.ask, context)}
    />
  )
}
