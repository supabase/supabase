import { useMemo } from 'react'

import { keepPreviousData } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { NoSearchResults } from 'components/ui/NoSearchResults'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import type { Organization } from 'types'
import { Card, cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { LoadingCardView, LoadingTableView, NoProjectsState } from './EmptyStates'
import { LoadMoreRows } from './LoadMoreRow'
import { ProjectCard } from './ProjectCard'
import { ProjectTableRow } from './ProjectTableRow'

export interface ProjectListProps {
  organization?: Organization
  rewriteHref?: (projectRef: string) => string
}

export const ProjectList = ({ organization: organization_, rewriteHref }: ProjectListProps) => {
  const { slug: urlSlug } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const [search] = useQueryState('search', parseAsString.withDefault(''))
  const debouncedSearch = useDebounce(search, 500)

  const [filterStatus, setFilterStatus] = useQueryState(
    'status',
    parseAsArrayOf(parseAsString, ',').withDefault([])
  )
  const [viewMode] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.PROJECTS_VIEW, 'grid')

  const organization = organization_ ?? selectedOrganization
  const slug = organization?.slug ?? urlSlug

  const {
    data,
    error: projectsError,
    isLoading: isLoadingProjects,
    isSuccess: isSuccessProjects,
    isError: isErrorProjects,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useOrgProjectsInfiniteQuery(
    {
      slug,
      search: search.length === 0 ? search : debouncedSearch,
      statuses: filterStatus,
    },
    {
      placeholderData: keepPreviousData,
    }
  )
  const orgProjects =
    useMemo(() => data?.pages.flatMap((page) => page.projects), [data?.pages]) || []

  const {
    isPending: _isLoadingPermissions,
    isError: isErrorPermissions,
    error: permissionsError,
  } = usePermissionsQuery()
  const { data: resourceWarnings } = useResourceWarningsQuery({ slug })

  // Move all hooks to the top to comply with Rules of Hooks
  const { data: integrations } = useOrgIntegrationsQuery({ orgSlug: organization?.slug })
  const { data: connections } = useGitHubConnectionsQuery({ organizationId: organization?.id })

  const isLoadingPermissions = IS_PLATFORM ? _isLoadingPermissions : false

  const isEmpty =
    debouncedSearch.length === 0 &&
    filterStatus.length === 0 &&
    (!orgProjects || orgProjects.length === 0)
  const sortedProjects = [...(orgProjects || [])].sort((a, b) => a.name.localeCompare(b.name))

  const noResultsFromSearch =
    debouncedSearch.length > 0 && isSuccessProjects && orgProjects.length === 0
  const noResultsFromStatusFilter =
    filterStatus.length > 0 && isSuccessProjects && orgProjects.length === 0

  const noResults = noResultsFromStatusFilter || noResultsFromSearch

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
      <Card className="flex-1 min-h-0 overflow-y-auto mb-8">
        <Table>
          {/* [Joshen] Ideally we can figure out sticky table headers here */}
          <TableHeader>
            <TableRow>
              <TableHead className={cn(noResults && 'text-foreground-muted')}>Project</TableHead>
              <TableHead className={cn(noResults && 'text-foreground-muted')}>Status</TableHead>
              <TableHead className={cn(noResults && 'text-foreground-muted')}>Compute</TableHead>
              <TableHead className={cn(noResults && 'text-foreground-muted')}>Region</TableHead>
              <TableHead className={cn(noResults && 'text-foreground-muted')}>Created</TableHead>
              <TableHead className={cn(noResults && 'text-foreground-muted')} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {noResultsFromStatusFilter ? (
              <TableRow className="[&>td]:hover:bg-inherit">
                <TableCell colSpan={5}>
                  <NoSearchResults
                    withinTableCell
                    label={
                      filterStatus.length === 0
                        ? `No projects found`
                        : `No ${filterStatus[0] === 'INACTIVE' ? 'paused' : 'active'} projects found`
                    }
                    description="Your search for projects with the specified status did not return any results"
                    onResetFilter={() => setFilterStatus([])}
                  />
                </TableCell>
              </TableRow>
            ) : noResultsFromSearch ? (
              <TableRow className="[&>td]:hover:bg-inherit">
                <TableCell colSpan={5}>
                  <NoSearchResults searchString={search} withinTableCell />
                </TableCell>
              </TableRow>
            ) : (
              <>
                {sortedProjects?.map((project) => (
                  <ProjectTableRow
                    key={project.ref}
                    project={project}
                    organization={organization}
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
                {hasNextPage && (
                  <LoadMoreRows
                    type="table"
                    isFetchingNextPage={isFetchingNextPage}
                    fetchNextPage={fetchNextPage}
                  />
                )}
              </>
            )}
          </TableBody>
        </Table>
      </Card>
    )
  }

  return (
    <>
      {noResultsFromStatusFilter ? (
        <NoSearchResults
          label={
            filterStatus.length === 0
              ? `No projects found`
              : `No ${filterStatus[0] === 'INACTIVE' ? 'paused' : 'active'} projects found`
          }
          description="Your search for projects with the specified status did not return any results"
          onResetFilter={() => setFilterStatus([])}
        />
      ) : noResultsFromSearch ? (
        <NoSearchResults searchString={search} />
      ) : (
        <div className="flex flex-col gap-y-2 md:gap-y-4 pb-6">
          <ul
            className={cn(
              'min-h-0 w-full mx-auto',
              'grid grid-cols-1 gap-2 md:gap-4',
              'sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
            )}
          >
            {sortedProjects?.map((project) => (
              <ProjectCard
                key={project.ref}
                slug={slug}
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
          {hasNextPage && (
            <LoadMoreRows
              type="card"
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
            />
          )}
        </div>
      )}
    </>
  )
}
