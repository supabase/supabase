import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from 'surfaces/common'
import type { DataPort, Project } from 'surfaces/contract'
import { isProjectChanging, ProjectCard } from 'surfaces/project'

import type { AgentHost } from '../host/app-context'

/** How often the status is read: often while it changes, then slowly to catch later changes. */
export const CHANGING_POLL_MS = 5_000
export const SETTLED_POLL_MS = 30_000

export function dashboardUrl(project: Project) {
  return `https://supabase.com/dashboard/project/${encodeURIComponent(project.ref ?? project.id)}`
}

function useDocumentVisible() {
  const [isVisible, setIsVisible] = useState(() => document.visibilityState !== 'hidden')
  useEffect(() => {
    const update = () => setIsVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return isVisible
}

/**
 * A project from a tool result, kept live: its status is read again on a timer
 * while the view is visible, so the user never needs to refresh. Each status
 * change is shared with the agent as context, so it knows when the project is
 * ready without calling get_project itself.
 */
export function ProjectCardScreen({
  initial,
  data,
  agent,
  changingPollMs = CHANGING_POLL_MS,
  settledPollMs = SETTLED_POLL_MS,
}: {
  initial: Project
  data: Pick<DataPort, 'getProject' | 'getOrganization'>
  agent: AgentHost
  changingPollMs?: number
  settledPollMs?: number
}) {
  const [project, setProject] = useState(initial)
  const [error, setError] = useState<string>()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [organizationName, setOrganizationName] = useState<string>()
  const inFlight = useRef(false)
  const isVisible = useDocumentVisible()
  const isChanging = isProjectChanging(project.status)
  const organization = initial.organization_slug ?? initial.organization_id

  const refresh = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setIsRefreshing(true)
    try {
      setProject(await data.getProject({ id: initial.id }))
      setError(undefined)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      inFlight.current = false
      setIsRefreshing(false)
    }
  }, [data, initial.id])

  // One timer per read, so a slow or failed read never stacks requests. Hidden views wait.
  useEffect(() => {
    if (!isVisible || isRefreshing) return
    const timer = window.setTimeout(
      () => void refresh(),
      isChanging ? changingPollMs : settledPollMs
    )
    return () => window.clearTimeout(timer)
  }, [isVisible, isRefreshing, isChanging, changingPollMs, settledPollMs, refresh, project, error])

  // The name is a nicety: on failure the card leaves the organization out.
  useEffect(() => {
    if (!organization) return
    let isCurrent = true
    data.getOrganization({ id: organization }).then(
      ({ name }) => isCurrent && setOrganizationName(name),
      () => {}
    )
    return () => {
      isCurrent = false
    }
  }, [data, organization])

  useEffect(() => {
    agent.context?.publish({
      project: { id: project.id, name: project.name, status: project.status },
    })
  }, [agent, project.id, project.name, project.status])

  return (
    <ProjectCard
      project={project}
      organizationName={organizationName}
      isFollowing={isChanging}
      isRefreshing={isRefreshing}
      error={error}
      onRefresh={() => void refresh()}
      onOpenDashboard={agent.openLink ? () => agent.openLink!(dashboardUrl(project)) : undefined}
    />
  )
}
