import type {
  Capabilities,
  NotebookSummary,
  Project,
  ProjectOverview,
} from '@supabase/mcp-server-supabase/apps'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import type { AskAgent, Loadable } from '../common'
import { IssuesList } from './issues-list'
import { NotebooksList } from './notebooks-list'
import { ProjectActivity } from './project-activity'
import { ProjectChecks } from './project-checks'
import { ProjectHero, ProjectLimits, ProjectStats } from './project-identity'

export interface ProjectHomeProps {
  project: Project
  /** What this connection allows, so Home can explain missing data. */
  capabilities: Capabilities
  /** Shown above the project name. */
  organizationName?: string
  /** The host's read of the project overview; `idle` when the connection has none. */
  overview: Loadable<ProjectOverview>
  /** Asks the host to load the overview again. */
  onRefresh: () => void
  /** The host's read of saved notebooks. Omit when the connection has none; the section is hidden. */
  notebooks?: Loadable<NotebookSummary[]>
  /** Asks the host to load the notebooks again. */
  onRefreshNotebooks?: () => void
  /** Sends a check or finding review to the agent. Omit when the host cannot. */
  onAsk?: AskAgent
}

export function ProjectHome({
  project,
  capabilities,
  organizationName,
  overview: overviewState,
  onRefresh,
  notebooks,
  onRefreshNotebooks,
  onAsk,
}: ProjectHomeProps) {
  const hasOverview = overviewState.status !== 'idle'
  const isLoading = overviewState.status === 'loading'
  const overview = overviewState.status === 'success' ? overviewState.data : undefined
  const loadError = overviewState.status === 'error' ? overviewState.message : undefined
  const traffic = overview?.traffic.status === 'ready' ? overview.traffic.data : undefined

  function trafficUnavailableMessage() {
    if (!hasOverview) return 'Project overview data is not available on this connection.'
    if (overview?.traffic.status === 'unavailable') return overview.traffic.message
    return loadError
  }

  // One issue per failing check across categories, like Studio's Issues page.
  const issues =
    overview?.security.status === 'ready' && overview.performance.status === 'ready'
      ? {
          count: overview.security.data.issues.length + overview.performance.data.issues.length,
          isCapped: overview.security.data.truncated || overview.performance.data.truncated,
        }
      : undefined
  const users = overview?.users?.status === 'ready' ? overview.users.data.total : undefined

  return (
    <section
      aria-label="Project home"
      className="@container flex min-h-0 flex-1 justify-center overflow-auto px-4 @3xl:px-6"
    >
      {/* Vertical padding sits on the content so the scroll container keeps it at the bottom. */}
      <div className="flex w-full min-w-0 max-w-[760px] flex-col gap-10 py-10">
        <ProjectHero
          project={project}
          organizationName={organizationName}
          capabilities={capabilities}
        />
        <ProjectLimits project={project} capabilities={capabilities} />
        <ProjectStats traffic={traffic} isLoading={isLoading} issues={issues} users={users} />
        <div className="space-y-2">
          <ProjectActivity
            traffic={traffic}
            isLoading={isLoading}
            unavailableMessage={trafficUnavailableMessage()}
          />
          {loadError && (
            <Admonition
              type="warning"
              title="Failed to load project overview"
              description={`Error: ${loadError}`}
              actions={
                <Button variant="default" size="tiny" onClick={onRefresh}>
                  Retry
                </Button>
              }
            />
          )}
        </div>
        <IssuesList
          project={project}
          issues={overviewState}
          onRefresh={hasOverview ? onRefresh : undefined}
          onAsk={onAsk}
        />
        {notebooks && (
          <NotebooksList
            project={project}
            notebooks={notebooks}
            onRefresh={onRefreshNotebooks}
            onAsk={onAsk}
          />
        )}
        <ProjectChecks project={project} onAsk={onAsk} />
      </div>
    </section>
  )
}
