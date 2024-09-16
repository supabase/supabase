import { groupBy } from 'lodash'
import { Plus } from 'lucide-react'
import Link from 'next/link'

import AlertError from 'components/ui/AlertError'
import NoSearchResults from 'components/ui/NoSearchResults'
import PartnerIcon from 'components/ui/PartnerIcon'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import {
  OverdueInvoicesResponse,
  useOverdueInvoicesQuery,
} from 'data/invoices/invoices-overdue-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { ProjectInfo, useProjectsQuery } from 'data/projects/projects-query'
import { ResourceWarning, useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { makeRandomString } from 'lib/helpers'
import type { Organization, ResponseError } from 'types'
import { Button, cn } from 'ui'
import ProjectCard from './ProjectCard'
import ShimmeringCard from './ShimmeringCard'

export interface ProjectListProps {
  rewriteHref?: (projectRef: string) => string
  search: string
  filterStatus?: string[]
  resetFilterStatus?: () => void
}

const ProjectList = ({
  search,
  rewriteHref,
  filterStatus,
  resetFilterStatus,
}: ProjectListProps) => {
  const { data: organizations, isLoading, isSuccess } = useOrganizationsQuery()
  const {
    data: allProjects,
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
  const { data: allOverdueInvoices } = useOverdueInvoicesQuery({ enabled: IS_PLATFORM })
  const projectsByOrg = groupBy(allProjects, 'organization_id')
  const isLoadingPermissions = IS_PLATFORM ? _isLoadingPermissions : false

  const hasFilterStatusApplied = filterStatus !== undefined && filterStatus.length !== 2
  const noResultsFromSearch =
    search.length > 0 &&
    isSuccessProjects &&
    allProjects.filter((project) => {
      return (
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.ref.includes(search.toLowerCase())
      )
    }).length === 0
  const noResultsFromStatusFilter =
    hasFilterStatusApplied &&
    isSuccessProjects &&
    allProjects.filter((project) => filterStatus.includes(project.status)).length === 0

  if (isLoading) {
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
          'bg-surface-100 border border-default px-6 py-4 rounded flex items-center justify-between'
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

  return isSuccess && organizations && organizations?.length > 0 ? (
    <>
      {organizations?.map((organization) => {
        return (
          <OrganizationProjects
            key={organization.slug}
            organization={organization}
            projects={projectsByOrg[organization.id]}
            overdueInvoices={(allOverdueInvoices ?? []).filter(
              (it) => it.organization_id === organization.id
            )}
            resourceWarnings={resourceWarnings ?? []}
            rewriteHref={rewriteHref}
            isLoadingPermissions={isLoadingPermissions}
            isErrorPermissions={isErrorPermissions}
            permissionsError={permissionsError}
            isLoadingProjects={isLoadingProjects}
            isErrorProjects={isErrorProjects}
            projectsError={projectsError}
            search={search}
            filterStatus={filterStatus}
          />
        )
      })}
    </>
  ) : (
    <NoProjectsState slug={''} />
  )
}

export default ProjectList

type OrganizationProjectsProps = {
  organization: Organization
  projects: ProjectInfo[]
  overdueInvoices: OverdueInvoicesResponse[]
  resourceWarnings: ResourceWarning[]
  isLoadingPermissions: boolean
  isErrorPermissions: boolean
  permissionsError: ResponseError | null
  isLoadingProjects: boolean
  isErrorProjects: boolean
  projectsError: ResponseError | null
  rewriteHref?: (projectRef: string) => string
  search: string
  filterStatus?: string[]
}

const OrganizationProjects = ({
  organization,
  projects,
  overdueInvoices,
  resourceWarnings,
  isLoadingPermissions,
  isErrorPermissions,
  permissionsError,
  isLoadingProjects,
  isErrorProjects,
  projectsError,
  rewriteHref,
  search,
  filterStatus,
}: OrganizationProjectsProps) => {
  const isEmpty = !projects || projects.length === 0
  const sortedProjects = [...(projects || [])].sort((a, b) => a.name.localeCompare(b.name))
  const filteredProjects =
    search.length > 0
      ? sortedProjects.filter((project) => {
          return (
            project.name.toLowerCase().includes(search.toLowerCase()) ||
            project.ref.includes(search.toLowerCase())
          )
        })
      : sortedProjects

  // [Joshen] Just a UI thing, but we take all projects other than paused as "active"
  const filteredProjectsByStatus =
    filterStatus !== undefined
      ? filterStatus.length === 2
        ? filteredProjects
        : filteredProjects.filter((project) => filterStatus.includes(project.status))
      : filteredProjects

  const { data: integrations } = useOrgIntegrationsQuery({ orgSlug: organization?.slug })
  const { data: connections } = useGitHubConnectionsQuery({ organizationId: organization?.id })
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

  return (
    <div className="space-y-3" key={organization.slug}>
      <div className="flex space-x-4 items-center">
        <div className="flex items-center gap-2">
          <h4 className="text-lg flex items-center">{organization.name}</h4>{' '}
          <PartnerIcon organization={organization} />
        </div>
        {!!overdueInvoices.length && (
          <div>
            <Button asChild type="danger">
              <Link href={`/org/${organization.slug}/invoices`}>Outstanding Invoices</Link>
            </Button>
          </div>
        )}
        {organization?.restriction_status === 'grace_period' && (
          <div>
            <Button asChild type="warning">
              <Link href={`/org/${organization.slug}/billing`}>Grace Period</Link>
            </Button>
          </div>
        )}
        {organization?.restriction_status === 'grace_period_over' && (
          <div>
            <Button asChild type="warning">
              <Link href={`/org/${organization.slug}/billing`}>Grace Period Over</Link>
            </Button>
          </div>
        )}
        {organization?.restriction_status === 'restricted' && (
          <div>
            <Button asChild type="danger">
              <Link href={`/org/${organization.slug}/billing`}>Services Restricted</Link>
            </Button>
          </div>
        )}
      </div>

      {isLoadingPermissions || isLoadingProjects ? (
        <ul className="mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <ShimmeringCard />
          <ShimmeringCard />
        </ul>
      ) : (
        <ul className="mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {isErrorPermissions ? (
            <div className="col-span-3">
              <AlertError
                subject="Failed to retrieve permissions for your account"
                error={permissionsError}
              />
            </div>
          ) : isErrorProjects ? (
            <div className="col-span-3">
              <AlertError
                subject={`Failed to retrieve projects under ${name}`}
                error={projectsError}
              />
            </div>
          ) : isEmpty ? (
            <NoProjectsState slug={organization.slug} />
          ) : (
            filteredProjectsByStatus?.map((project) => (
              <ProjectCard
                key={makeRandomString(5)}
                project={project}
                rewriteHref={rewriteHref ? rewriteHref(project.ref) : undefined}
                resourceWarnings={resourceWarnings.find(
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
        </ul>
      )}
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
