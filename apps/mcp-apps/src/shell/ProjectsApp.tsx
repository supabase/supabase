import { ChevronRight, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { errorMessage, type AgentRequest } from 'surfaces/common'
import type { Bootstrap, Project } from 'surfaces/contract'
import { projectChecks, ProjectList, projectStatusBadge } from 'surfaces/project'
import { Badge, Button, ToggleGroup, ToggleGroupItem } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { useApp } from '../host/app-context'
import { agentRequestMessage, projectChatPrompt, projectPageContext } from '../host/project-prompts'
import { CreateProjectDialog } from './CreateProjectDialog'
import { OpenResourceDialog } from './OpenResourceDialog'
import { ProjectExplorer, type ProjectView } from './ProjectExplorer'
import { ProjectHomeScreen } from './ProjectHomeScreen'
import { parseRoute, type ProjectRoute } from './routes'

const HEALTH_PROMPT =
  "Check this project's health. Inspect available project status, database diagnostics, logs, and advisors using read-only checks. Summarize any issues and recommended next steps. Do not change the project."

/** A failed load or action, shown above the current screen. */
interface ShellError {
  title: string
  message: string
  /** True when retrying means refreshing the project list. */
  canRetry?: boolean
}

const isBrowsable = (data: Bootstrap, project: Project) =>
  data.capabilities.database && ['ACTIVE_HEALTHY', 'UNKNOWN'].includes(project.status)

/** The global sidebar app: project list, then a project's workspace. */
export function ProjectsApp({
  initial,
  initialRoute,
  registerRoute,
}: {
  initial: Bootstrap
  initialRoute: string
  registerRoute: (onRoute: (path: string) => void) => void
}) {
  const dataPort = useApp().data
  const host = useApp().agent
  const [data, setData] = useState(initial)
  const [project, setProject] = useState<Project>()
  const [route, setRoute] = useState<ProjectRoute | null>(parseRoute(initialRoute))
  const [dialog, setDialog] = useState<'create' | 'open' | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState<ShellError>()
  const [isLoading, setIsLoading] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  const [refreshRevision, setRefreshRevision] = useState(0)
  // A deep link to a table opens the Explorer; otherwise a project starts on Home.
  const [view, setView] = useState<ProjectView>(route?.table ? 'database' : 'home')
  const busy = useRef(false)
  const asking = useRef(false)

  // Pages without the explorer publish their own context; the workspace publishes richer context.
  useEffect(() => {
    if (!project || !isBrowsable(data, project))
      host.context?.publish({
        ...projectPageContext(project, data),
        view: project ? 'project' : 'projects',
      })
  }, [project, data, host])

  useEffect(() => registerRoute((path) => setRoute(parseRoute(path))), [registerRoute])

  // Deep links may name a project the list did not include (scoped tokens).
  useEffect(() => {
    if (!route) return
    const matches = (p: Project) => p.id === route.projectId || p.ref === route.projectId
    const found = data.projects.find(matches)
    if (found) {
      setProject(found)
      setError(undefined)
      return
    }
    let isCurrent = true
    dataPort
      .bootstrap({ project_ref: route.projectId })
      .then((next) => {
        if (!isCurrent) return
        const linked = next.projects.find(matches)
        if (!linked) throw new Error('The linked project is not available on this connection.')
        setData((previous) => ({ ...previous, projects: [...previous.projects, linked] }))
        setProject(linked)
        setError(undefined)
      })
      .catch((e) => {
        if (isCurrent) setError({ title: 'Failed to open project', message: errorMessage(e) })
      })
    return () => {
      isCurrent = false
    }
  }, [route, data.projects, dataPort])

  async function handleRefresh() {
    if (busy.current) return
    busy.current = true
    setIsLoading(true)
    setError(undefined)
    try {
      const next = await dataPort.bootstrap({
        ...(data.discovery?.projectRef ? { project_ref: data.discovery.projectRef } : {}),
        ...(data.discovery?.organizationSlug
          ? { organization_slug: data.discovery.organizationSlug }
          : {}),
      })
      setData(next)
      setRefreshRevision((value) => value + 1)
      if (project) setProject(next.projects.find((p) => p.id === project.id))
    } catch (e) {
      setError({ title: 'Failed to refresh projects', message: errorMessage(e), canRetry: true })
    } finally {
      busy.current = false
      setIsLoading(false)
    }
  }

  async function askAbout(target: Project, prompt: string, sentNotice?: string) {
    if (asking.current || !host.ask) return
    asking.current = true
    setIsAsking(true)
    setError(undefined)
    try {
      await host.ask(projectChatPrompt(target, data, prompt))
      if (sentNotice) setNotice(sentNotice)
    } catch (e) {
      setError({ title: `Failed to send to ${host.agentName}`, message: errorMessage(e) })
    } finally {
      asking.current = false
      setIsAsking(false)
    }
  }

  /** Checks sent from the project list, with a confirmation once they reach chat. */
  async function handleListAsk(request: AgentRequest) {
    if (asking.current || !host.ask) return
    asking.current = true
    setIsAsking(true)
    setError(undefined)
    setNotice('')
    try {
      const { text, attachment } = agentRequestMessage(request, data)
      await host.ask(text, attachment)
      if (request.type === 'project-check') {
        const check = projectChecks.find((item) => item.id === request.check)
        setNotice(`${check?.title ?? 'Check'} for ${request.project.name} sent to chat.`)
      }
    } catch (e) {
      setError({ title: `Failed to send to ${host.agentName}`, message: errorMessage(e) })
    } finally {
      asking.current = false
      setIsAsking(false)
    }
  }

  function handleBack() {
    setView('home')
    setProject(undefined)
    setRoute(null)
    setError(undefined)
  }

  const notices = [...(notice ? [notice] : []), ...(data.notices ?? [])]

  return (
    <main className="flex h-full flex-col bg-background">
      {project && (
        <>
          <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b px-3">
            <div className="flex min-w-0 items-center gap-3">
              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
                <button
                  className="text-foreground-light hover:text-foreground"
                  onClick={handleBack}
                >
                  Projects
                </button>
                <ChevronRight size={14} className="text-foreground-lighter" />
                <h1 className="truncate text-foreground" title={project.name}>
                  {project.name}
                </h1>
              </nav>
              {isBrowsable(data, project) && (
                <ToggleGroup
                  type="single"
                  variant="segmented"
                  size="tiny"
                  tone="text"
                  value={view}
                  allowDeselect={false}
                  aria-label="Project view"
                  onValueChange={(value) => {
                    if (value === 'home' || value === 'database' || value === 'logs') setView(value)
                  }}
                >
                  <ToggleGroupItem value="home">Home</ToggleGroupItem>
                  <ToggleGroupItem value="database">Database</ToggleGroupItem>
                  {data.capabilities.logs && <ToggleGroupItem value="logs">Logs</ToggleGroupItem>}
                </ToggleGroup>
              )}
            </div>
            <div className="flex items-center gap-2">
              {data.capabilities.readOnly && <Badge>Read-only</Badge>}
              <Badge variant={projectStatusBadge(project.status).variant}>
                {projectStatusBadge(project.status).label}
              </Badge>
              <Button
                variant="default"
                size="tiny"
                disabled={!host.ask || isAsking}
                title={
                  host.ask
                    ? `Check project health with ${host.agentName}`
                    : 'This host does not support sending a message to the agent'
                }
                aria-label={`Check project health with ${host.agentName}`}
                onClick={() => void askAbout(project, HEALTH_PROMPT)}
              >
                Check health
              </Button>
              <Button
                variant="text"
                size="tiny"
                aria-label="Refresh project"
                disabled={isLoading}
                onClick={() => void handleRefresh()}
                icon={<RefreshCw size={14} />}
              />
            </div>
          </header>
          {error && (
            <div className="px-3 pt-3">
              <Admonition
                type="warning"
                title={error.title}
                description={`Error: ${error.message}`}
              />
            </div>
          )}
          {!isBrowsable(data, project) && (
            <div className="min-h-0 flex-1 overflow-auto">
              <ProjectHomeScreen
                key={project.id}
                project={project}
                context={data}
                refreshRevision={refreshRevision}
              />
            </div>
          )}
          {isBrowsable(data, project) && (
            <ProjectExplorer
              key={project.id}
              view={view}
              onViewChange={setView}
              project={project}
              context={data}
              refreshRevision={refreshRevision}
              initialSchema={route?.schema ?? undefined}
              initialTable={route?.table ?? undefined}
            />
          )}
        </>
      )}
      {!project && (
        <ProjectList
          projects={data.projects}
          organizations={data.organizations}
          capabilities={data.capabilities}
          isLoading={isLoading}
          error={
            error && {
              title: error.title,
              message: error.message,
              onRetry: error.canRetry ? () => void handleRefresh() : undefined,
            }
          }
          notices={notices}
          isAsking={isAsking}
          onOpenProject={(next) => {
            setView('home')
            setProject(next)
            setRoute(null)
          }}
          onRefresh={() => void handleRefresh()}
          onCreate={() => {
            setNotice('')
            setDialog('create')
          }}
          onOpenResource={() => setDialog('open')}
          onAsk={host.ask ? handleListAsk : undefined}
        />
      )}
      {dialog === 'open' && (
        <OpenResourceDialog
          onClose={() => setDialog(null)}
          onOpened={(next) => {
            setData(next)
            setProject(next.discovery?.projectRef ? next.projects[0] : undefined)
            setRoute(null)
            setError(undefined)
            setDialog(null)
          }}
        />
      )}
      {dialog === 'create' && (
        <CreateProjectDialog
          data={data}
          onClose={() => setDialog(null)}
          onSent={() => {
            setDialog(null)
            setNotice(
              'Project brief sent. Follow the setup in your chat, then refresh to see the new project.'
            )
          }}
        />
      )}
    </main>
  )
}
