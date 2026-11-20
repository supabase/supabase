import { useEffect } from 'react'
import type { DataPort, Project } from 'surfaces/contract'
import { PROJECT_CREATION_STEPS, ProjectCard, projectCreationProgress } from 'surfaces/project'

import type { ToolCallSession } from '../host/connect'
import { useCreationStatus, useToolCall } from '../host/use-creation-status'
import { useLookup } from '../host/use-lookup'
import { ProjectConnection, studioUrl } from './ProjectConnection'

const text = (value: unknown) => (typeof value === 'string' ? value : undefined)

/** Inline hosts draw the card on their own surface: an outline, with no fill or shadow. */
export const INLINE_CARD = 'bg-transparent shadow-none'

export type ProjectCardData = Pick<
  DataPort,
  'getProject' | 'getOrganization' | 'getProjectUrl' | 'getPublishableKeys'
>

/**
 * The view for `create_project`: the project card, kept live. Before the
 * tool returns, it shows what was asked for and skeletons for the rest; then
 * the badge names the step the project is on until it is ready, and
 * connection details appear. Each status is shared with the agent as context,
 * so it knows when the project is ready without calling get_project itself.
 */
export function ProjectCardScreen({
  session: { toolCall, data, agent, pollIntervalMs },
}: {
  session: Omit<ToolCallSession<Project>, 'data'> & { data: ProjectCardData }
}) {
  const { call, input, canCallTools, canOpenLinks } = useToolCall(toolCall)
  const openLink = canOpenLinks ? agent.openLink : undefined

  const {
    data: project,
    isLoading,
    isDone,
    ...status
  } = useCreationStatus<Project>({
    noun: 'project',
    call,
    canCheck: canCallTools,
    read: (created) => data.getProject({ id: created.id }),
    steps: PROJECT_CREATION_STEPS,
    progress: projectCreationProgress,
    checkWith: 'get_project',
    intervalMs: pollIntervalMs,
  })
  const projectRef = project && (project.ref ?? project.id)

  // The organization's name is a nicety: on failure the card leaves it out.
  const organization =
    project?.organization_slug ?? project?.organization_id ?? text(input?.organization_id)
  const organizationName = useLookup(
    canCallTools ? organization : undefined,
    async () => (await data.getOrganization({ id: organization! })).name
  )

  useEffect(() => {
    if (!project) return
    agent.context?.publish({
      project: { id: project.id, name: project.name, status: project.status },
    })
  }, [agent, project?.id, project?.name, project?.status])

  // The dashboard has a project that failed to start (to delete it, or for
  // support), but nothing for one that was never created or was removed.
  const canOpenDashboard = !!projectRef && !!openLink && project.status !== 'REMOVED'

  const region = text(input?.region)
  const details = project
    ? [
        { label: 'Project ref', value: projectRef },
        { label: 'Region', value: project.region || 'Region unavailable' },
      ]
    : isLoading
      ? [{ label: 'Project ref' }, { label: 'Region', value: region }]
      : region
        ? [{ label: 'Region', value: region }]
        : []

  return (
    <ProjectCard
      {...status}
      className={INLINE_CARD}
      isLoading={isLoading}
      breadcrumbs={organizationName ? [organizationName] : undefined}
      name={
        project?.name ??
        text(input?.name) ??
        // A call that failed or was cancelled before the host sent its
        // arguments: nothing more is coming, so no skeleton.
        (isLoading ? undefined : 'New project')
      }
      details={details}
      onOpenDashboard={canOpenDashboard ? () => openLink(studioUrl(projectRef)) : undefined}
    >
      {isDone && projectRef && (
        <ProjectConnection
          projectRef={projectRef}
          data={data}
          canReachProject={canCallTools}
          onOpenLink={openLink}
        />
      )}
    </ProjectCard>
  )
}
