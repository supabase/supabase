import { useEffect } from 'react'
import type { Branch, DataPort } from 'surfaces/contract'
import { BRANCH_CREATION_STEPS, branchCreationProgress, ProjectCard } from 'surfaces/project'

import type { ToolCallSession } from '../host/connect'
import type { ToolCallSnapshot } from '../host/tool-call-store'
import { useCreationStatus, useToolCall } from '../host/use-creation-status'
import { useLookup } from '../host/use-lookup'
import { INLINE_CARD } from './ProjectCardScreen'
import { ProjectConnection, studioUrl } from './ProjectConnection'

const text = (value: unknown) => (typeof value === 'string' ? value : undefined)

/**
 * A server scoped to the parent project takes no `project_id` for
 * `create_branch`, and rejects calls for any other project, the branch's own
 * included.
 */
const isServerScoped = (input: Record<string, unknown> | undefined) =>
  input !== undefined && input.project_id === undefined

/** The project a scoped connection is locked to: the branch's parent, once known. */
export function branchScopedProjectId({ call, input }: ToolCallSnapshot<Branch>) {
  return isServerScoped(input) && call.status === 'ready' ? call.data.parent_project_ref : null
}

export type BranchCardData = Pick<
  DataPort,
  'listBranches' | 'getProject' | 'getOrganization' | 'getProjectUrl' | 'getPublishableKeys'
>

/**
 * The view for `create_branch`: the same card as `create_project`, kept
 * live, with the branch's organization and project above its name. While the
 * branch sets up, the badge names the step it's on.
 */
export function BranchCardScreen({
  session: { toolCall, data, agent, pollIntervalMs },
}: {
  session: Omit<ToolCallSession<Branch>, 'data'> & { data: BranchCardData }
}) {
  const { call, input, canCallTools, canOpenLinks } = useToolCall(toolCall)
  const openLink = canOpenLinks ? agent.openLink : undefined
  const serverScoped = isServerScoped(input)

  const {
    data: branch,
    isLoading,
    isDone,
    ...status
  } = useCreationStatus<Branch>({
    noun: 'branch',
    call,
    // Reading the branch depends on the arguments (whether the server is scoped).
    canCheck: canCallTools && !!input,
    read: async (created) => {
      // On a scoped connection the data port leaves `project_id` out.
      const { branches } = await data.listBranches({ project_id: created.parent_project_ref })
      const found = branches.find((branch) => branch.id === created.id)
      if (!found) throw new Error('Branch not found in list_branches')
      return found
    },
    steps: BRANCH_CREATION_STEPS,
    progress: branchCreationProgress,
    checkWith: 'list_branches',
    intervalMs: pollIntervalMs,
  })

  // Organization and project names are a nicety: if they can't be read (a
  // scoped server has no `get_project`, say), the card leaves them out.
  const parentRef = branch?.parent_project_ref ?? text(input?.project_id)
  const breadcrumbs = useLookup(canCallTools ? parentRef : undefined, async () => {
    const parent = await data.getProject({ id: parentRef! })
    const organization = await data
      .getOrganization({ id: (parent.organization_slug ?? parent.organization_id)! })
      .catch(() => undefined)
    return organization ? [organization.name, parent.name] : [parent.name]
  })

  useEffect(() => {
    if (!branch) return
    agent.context?.publish({
      branch: { id: branch.id, name: branch.name, status: branch.status },
    })
  }, [agent, branch?.id, branch?.name, branch?.status])

  return (
    <ProjectCard
      {...status}
      className={INLINE_CARD}
      isLoading={isLoading}
      breadcrumbs={breadcrumbs}
      name={
        branch?.name ??
        text(input?.name) ??
        // A call that failed or was cancelled before the host sent its
        // arguments: nothing more is coming, so no skeleton.
        (isLoading ? undefined : 'New branch')
      }
      details={
        branch
          ? [{ label: 'Branch project ref', value: branch.project_ref }]
          : isLoading
            ? [{ label: 'Branch project ref' }]
            : []
      }
      onOpenDashboard={
        branch && openLink ? () => openLink(studioUrl(branch.project_ref)) : undefined
      }
    >
      {isDone && branch && (
        <ProjectConnection
          projectRef={branch.project_ref}
          data={data}
          canReachProject={canCallTools && !serverScoped}
          onOpenLink={openLink}
        />
      )}
    </ProjectCard>
  )
}
