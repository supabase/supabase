import type { DataPort } from 'surfaces/contract'
import { ConnectionDetails } from 'surfaces/project'

import { useConnectionDetails } from '../host/use-connection-details'

/** The project's page in the Supabase dashboard (Studio). */
export const studioUrl = (projectRef: string) =>
  `https://supabase.com/dashboard/project/${encodeURIComponent(projectRef)}`

/**
 * Connection details for a project (or branch) that is ready, along the
 * bottom of its card. UI-only: nothing here is shared with the agent.
 */
export function ProjectConnection({
  projectRef,
  data,
  canReachProject,
  onOpenLink,
}: {
  projectRef: string
  data: Pick<DataPort, 'getProjectUrl' | 'getPublishableKeys'>
  canReachProject: boolean
  /** Absent when the host can't open links: the Studio link is offered to copy instead. */
  onOpenLink?: (url: string) => void
}) {
  const { connection, open } = useConnectionDetails({
    projectRef,
    data,
    canRead: canReachProject,
  })
  const projectUrl = studioUrl(projectRef)
  return (
    <ConnectionDetails
      connection={connection}
      onOpen={open}
      projectUrl={projectUrl}
      connectUrl={`${projectUrl}?showConnect=true`}
      onOpenLink={onOpenLink}
    />
  )
}
