import AlertError from 'components/ui/AlertError'
import NoSearchResults from 'components/ui/NoSearchResults'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
import { makeRandomString } from 'lib/helpers'
import type { Organization } from 'types'
import { Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { LoadingCardView, LoadingTableView, NoFilterResults, NoProjectsState } from './EmptyStates'
import { ProjectCard } from './ProjectCard'
import { ProjectTableRow } from './ProjectTableRow'

export interface ProjectListProps {
  organization?: Organization
  rewriteHref?: (projectRef: string) => string
  search?: string
  filterStatus?: string[]
  resetFilterStatus?: () => void
  viewMode?: 'grid' | 'table'
}

export const ProjectList = ({
  search = '',
  organization: organization_,
  rewriteHref,
  filterStatus,
  resetFilterStatus,
  viewMode = 'grid',
}: ProjectListProps) => {
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const organization = organization_ ?? selectedOrganization

  const {
    data: allProjects = [],
    isLoading: isLoadingProjects,
    isSuccess: isSuccessProjects,
    isError: isErrorProjects,
    error: projectsError,
  } = useProjectsQuery()
  const {
    isLoading: _isLoadingPermissions,
    isError: isErrorPermissions,
    error: permissionsError,
  } = usePermissionsQuery()
  const { data: resourceWarnings } = useResourceWarningsQuery()

  // Move all hooks to the top to comply with Rules of Hooks
  const { data: integrations } = useOrgIntegrationsQuery({ orgSlug: organization?.slug })
  const { data: connections } = useGitHubConnectionsQuery({ organizationId: organization?.id })

  const orgProjects = allProjects.filter((x) => x.organization_slug === organization?.slug)
  const isLoadingPermissions = IS_PLATFORM ? _isLoadingPermissions : false

  const hasFilterStatusApplied = filterStatus !== undefined && filterStatus.length !== 2
  const noResultsFromSearch =
    search.length > 0 &&
    isSuccessProjects &&
    orgProjects.filter((project) => {
      return (
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.ref.includes(search.toLowerCase())
      )
    }).length === 0
  const noResultsFromStatusFilter =
    hasFilterStatusApplied &&
    isSuccessProjects &&
    orgProjects.filter((project) => filterStatus.includes(project.status)).length === 0

  const isEmpty = !orgProjects || orgProjects.length === 0
  const sortedProjects = [...(orgProjects || [])].sort((a, b) => a.name.localeCompare(b.name))
  const filteredProjects =
    search.length > 0
      ? sortedProjects.filter((project) => {
          return (
            project.name.toLowerCase().includes(search.toLowerCase()) ||
            project.ref.includes(search.toLowerCase())
          )
        })
      : sortedProjects

  const filteredProjectsByStatus =
    filterStatus !== undefined
      ? filterStatus.length === 2
        ? filteredProjects
        : filteredProjects.filter((project) => filterStatus.includes(project.status))
      : filteredProjects

  const githubConnections = connections?.map((connection) => ({
    id: String(connection.id),
    added_by: {
      id: String(connection.user?.id),
      primary_email: connection.user?.primary_email ?? '',
      username: connection.user?.username ?? '',
    },
    foreign_project_id: String(connection.repository.id),
    supabase_project_ref: connection.project.ref,
    organization_integration_id: 'unused',
    inserted_at: connection.inserted_at,
    updated_at: connection.updated_at,
    metadata: {
      name: connection.repository.name,
    } as any,
  }))
  const vercelConnections = integrations
    ?.filter((integration) => integration.integration.name === 'Vercel')
    .flatMap((integration) => integration.connections)

  if (isErrorPermissions) {
    return (
      <AlertError
        subject="Failed to retrieve permissions for your account"
        error={permissionsError}
      />
    )
  }

  if (isErrorProjects) {
    return (
      <AlertError
        subject={`Failed to retrieve projects under ${organization?.name}`}
        error={projectsError}
      />
    )
  }

  if (isLoadingPermissions || isLoadingProjects || !organization) {
    return viewMode === 'table' ? <LoadingTableView /> : <LoadingCardView />
  }

  if (isEmpty) {
    return <NoProjectsState slug={organization?.slug ?? ''} />
  }

  if (viewMode === 'table') {
    return (
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Compute</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {noResultsFromStatusFilter ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <NoFilterResults
                    filterStatus={filterStatus}
                    resetFilterStatus={resetFilterStatus}
                    className="border-0"
                  />
                </TableCell>
              </TableRow>
            ) : noResultsFromSearch ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <NoSearchResults searchString={search} className="border-0" />
                </TableCell>
              </TableRow>
            ) : (
              filteredProjectsByStatus?.map((project) => (
                <ProjectTableRow
                  key={project.ref}
                  project={project}
                  rewriteHref={rewriteHref ? rewriteHref(project.ref) : undefined}
                  resourceWarnings={resourceWarnings?.find(
                    (resourceWarning) => resourceWarning.project === project.ref
                  )}
                  githubIntegration={githubConnections?.find(
                    (connection) => connection.supabase_project_ref === project.ref
                  )}
                  vercelIntegration={vercelConnections?.find(
                    (connection) => connection.supabase_project_ref === project.ref
                  )}
                />
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    )
  }

  return (
    <>
      {noResultsFromStatusFilter ? (
        <NoFilterResults filterStatus={filterStatus} resetFilterStatus={resetFilterStatus} />
      ) : noResultsFromSearch ? (
        <NoSearchResults searchString={search} />
      ) : (
        <ul className="w-full mx-auto grid grid-cols-1 gap-2 md:gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredProjectsByStatus?.map((project) => (
            <ProjectCard
              key={makeRandomString(5)}
              project={project}
              rewriteHref={rewriteHref ? rewriteHref(project.ref) : undefined}
              resourceWarnings={resourceWarnings?.find(
                (resourceWarning) => resourceWarning.project === project.ref
              )}
              githubIntegration={githubConnections?.find(
                (connection) => connection.supabase_project_ref === project.ref
              )}
              vercelIntegration={vercelConnections?.find(
                (connection) => connection.supabase_project_ref === project.ref
              )}
            />
          ))}
        </ul>
      )}
    </>
  )
}
