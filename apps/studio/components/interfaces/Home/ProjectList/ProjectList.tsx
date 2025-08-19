import { Plus } from 'lucide-react'
import Link from 'next/link'

import AlertError from 'components/ui/AlertError'
import NoSearchResults from 'components/ui/NoSearchResults'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { ProjectInfo, useProjectsQuery } from 'data/projects/projects-query'
import { ResourceWarning, useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from 'lib/constants'
import { makeRandomString } from 'lib/helpers'
import type { Organization, ResponseError } from 'types'
import {
  Button,
  Card,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from 'ui'
import ProjectCard from './ProjectCard'
import ProjectTableRow from './ProjectTableRow'
import ShimmeringCard from './ShimmeringCard'

export interface ProjectListProps {
  organization?: Organization
  rewriteHref?: (projectRef: string) => string
  search?: string
  filterStatus?: string[]
  resetFilterStatus?: () => void
  viewMode?: 'grid' | 'table'
}

const ProjectList = ({
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

  if (isLoadingProjects || !organization) {
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
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="animate-pulse h-4 bg-border rounded w-32"></div>
                  </TableCell>
                  <TableCell>
                    <div className="animate-pulse h-4 bg-border rounded w-16"></div>
                  </TableCell>
                  <TableCell>
                    <div className="animate-pulse h-4 bg-border rounded w-20"></div>
                  </TableCell>
                  <TableCell>
                    <div className="animate-pulse h-4 bg-border rounded w-24"></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )
    }

    return (
      <ul className="mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <ShimmeringCard />
        <ShimmeringCard />
      </ul>
    )
  }

  if (noResultsFromSearch) {
    return <NoSearchResults searchString={search} />
  }

  if (noResultsFromStatusFilter) {
    return (
      <div
        className={cn(
          'bg-surface-100 border border-default px-4 md:px-6 py-4 rounded flex items-center justify-between'
        )}
      >
        <div className="space-y-1">
          {/* [Joshen] Just keeping it simple for now unless we decide to extend this to other statuses */}
          <p className="text-sm text-foreground">
            {filterStatus.length === 0
              ? `No projects found`
              : `No ${filterStatus[0] === 'INACTIVE' ? 'paused' : 'active'} projects found`}
          </p>
          <p className="text-sm text-foreground-light">
            Your search for projects with the specified status did not return any results
          </p>
        </div>
        {resetFilterStatus !== undefined && (
          <Button type="default" onClick={() => resetFilterStatus()}>
            Reset filter
          </Button>
        )}
      </div>
    )
  }

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

  if (
    (search.length > 0 || (filterStatus !== undefined && filterStatus.length !== 2)) &&
    filteredProjectsByStatus.length === 0
  )
    return null

  if (isLoadingPermissions || isLoadingProjects) {
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
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="bg-surface-400 h-4 w-32"></Skeleton>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="bg-surface-400 h-4 w-16"></Skeleton>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="bg-surface-400 h-4 w-20"></Skeleton>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="bg-surface-400 h-4 w-20"></Skeleton>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="bg-surface-400 h-4 w-24"></Skeleton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )
    }

    return (
      <ul className="mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <ShimmeringCard />
        <ShimmeringCard />
      </ul>
    )
  }

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
        subject={`Failed to retrieve projects under ${organization.name}`}
        error={projectsError}
      />
    )
  }

  if (isEmpty) {
    return <NoProjectsState slug={organization.slug} />
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
            {filteredProjectsByStatus?.map((project) => (
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
            ))}
          </TableBody>
        </Table>
      </Card>
    )
  }

  return (
    <div className="space-y-3" key={organization.slug}>
      <ul className="mx-auto grid grid-cols-1 gap-2 md:gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
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
    </div>
  )
}

const NoProjectsState = ({ slug }: { slug: string }) => {
  const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  return (
    <div className="col-span-4 space-y-4 rounded-lg border border-dashed p-6 text-center">
      <div className="space-y-1">
        <p>No projects</p>
        <p className="text-sm text-foreground-light">Get started by creating a new project.</p>
      </div>

      {projectCreationEnabled && (
        <Button asChild icon={<Plus />}>
          <Link href={`/new/${slug}`}>New Project</Link>
        </Button>
      )}
    </div>
  )
}

export default ProjectList
