import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useSidePanelsStateSnapshot } from 'state/side-panels'
import { Badge, Button, Card, CardContent } from 'ui'

export const AutomaticBranchingRow = () => {
  const { ref: projectRef } = useParams()
  const project = useSelectedProject()
  const org = useSelectedOrganization()
  const sidePanelsStateSnapshot = useSidePanelsStateSnapshot()

  const isBranch = project?.parent_project_ref !== undefined

  // Permissions for reading and creating GitHub connections
  const canReadGitHubConnection = useCheckPermissions(
    PermissionAction.READ,
    'integrations.github_connections'
  )
  const canCreateGitHubConnection = useCheckPermissions(
    PermissionAction.CREATE,
    'integrations.github_connections'
  )

  const { data: allConnections } = useGitHubConnectionsQuery({ organizationId: org?.id })

  // Determine automatic branching status
  const baseProjectRef = isBranch ? project?.parent_project_ref : projectRef
  const { data: branches } = useBranchesQuery(
    { projectRef: baseProjectRef },
    { enabled: Boolean(baseProjectRef) }
  )

  const prodBranch = branches?.find((b) => b.is_default) ?? branches?.[0]

  const { data: projects } = useProjectsQuery()
  const baseProject = isBranch
    ? projects?.find((p) => p.ref === project?.parent_project_ref)
    : project

  // Filter connections for current (base) project
  const connections =
    allConnections?.filter((connection) =>
      isBranch
        ? connection.project.ref === project?.parent_project_ref
        : connection.project.ref === projectRef
    ) ?? []

  const autoBranchingEnabled =
    connections.length > 0 &&
    Boolean(baseProject?.is_branch_enabled) &&
    Boolean(prodBranch?.git_branch && prodBranch.git_branch.trim().length > 0)

  /*
    If the user does not have permission to read GitHub connections, we simply do not
    render the row. The surrounding page should handle showing a more global
    NoPermission component if needed.
  */
  if (!canReadGitHubConnection) {
    return null
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-6">
        {/* Left: label and description */}
        <div className="flex-1">
          <h5 className="text-foreground mb-1 text-sm">Automatic Branching</h5>
          <p className="text-sm text-foreground-light">
            Create a Supabase branch for every GitHub branch and sync them on commit and merge.
          </p>
        </div>

        {/* Right: status badge + configure button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {autoBranchingEnabled ? (
            <Badge variant="brand">Enabled</Badge>
          ) : (
            <Badge variant="default">Disabled</Badge>
          )}

          <Button
            type="default"
            onClick={() => sidePanelsStateSnapshot.setGithubConnectionsOpen(true)}
            disabled={isBranch || (!canCreateGitHubConnection && connections.length === 0)}
          >
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
