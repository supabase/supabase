import { PermissionAction } from '@supabase/shared-types/out/constants'
import { groupBy } from 'lodash'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { Badge, Button, IconPlus } from 'ui'

import AlertError from 'components/ui/AlertError'
import {
  OverdueInvoicesResponse,
  useOverdueInvoicesQuery,
} from 'data/invoices/invoices-overdue-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useCheckPermissions } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { makeRandomString } from 'lib/helpers'
import { Organization, Project, ResponseError } from 'types'
import ProjectCard from './ProjectCard'
import ShimmeringCard from './ShimmeringCard'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'

export interface ProjectListProps {
  rewriteHref?: (projectRef: string) => string
}

const ProjectList = ({ rewriteHref }: ProjectListProps) => {
  const { data: organizations } = useOrganizationsQuery()
  const {
    data: allProjects,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
    error: projectsError,
  } = useProjectsQuery()
  const {
    isLoading: _isLoadingPermissions,
    isError: isErrorPermissions,
    error: permissionsError,
  } = usePermissionsQuery()
  const { data: allOverdueInvoices } = useOverdueInvoicesQuery({ enabled: IS_PLATFORM })
  const projectsByOrg = groupBy(allProjects, 'organization_id')
  const isLoadingPermissions = IS_PLATFORM ? _isLoadingPermissions : false

  return (
    <>
      {organizations?.map((organization) => {
        return (
          <OrganizationProjects
            key={organization.id}
            organization={organization}
            projects={projectsByOrg[organization.id]}
            overdueInvoices={(allOverdueInvoices ?? []).filter(
              (it) => it.organization_id === organization.id
            )}
            rewriteHref={rewriteHref}
            isLoadingPermissions={isLoadingPermissions}
            isErrorPermissions={isErrorPermissions}
            permissionsError={permissionsError}
            isLoadingProjects={isLoadingProjects}
            isErrorProjects={isErrorProjects}
            projectsError={projectsError}
          />
        )
      })}
    </>
  )
}

export default observer(ProjectList)

type OrganizationProjectsProps = {
  organization: Organization
  projects: Project[]
  overdueInvoices: OverdueInvoicesResponse[]
  isLoadingPermissions: boolean
  isErrorPermissions: boolean
  permissionsError: ResponseError | null
  isLoadingProjects: boolean
  isErrorProjects: boolean
  projectsError: ResponseError | null
  rewriteHref?: (projectRef: string) => string
}

const OrganizationProjects = ({
  organization: { id, name, slug, subscription_id },
  projects,
  overdueInvoices,
  isLoadingPermissions,
  isErrorPermissions,
  permissionsError,
  isLoadingProjects,
  isErrorProjects,
  projectsError,
  rewriteHref,
}: OrganizationProjectsProps) => {
  const isEmpty = !projects || projects.length === 0
  const canReadProjects = useCheckPermissions(PermissionAction.READ, 'projects', undefined, id)

  return (
    <div className="space-y-3" key={makeRandomString(5)}>
      <div className="flex space-x-4 items-center">
        <h4 className="text-lg flex items-center">
          {name}
          {subscription_id ? <Badge className="ml-3">V2</Badge> : <></>}
        </h4>

        {!!overdueInvoices.length && (
          <div>
            <Link href={`/org/${slug}/invoices`}>
              <a>
                <Button type="danger">Outstanding Invoices</Button>
              </a>
            </Link>
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
          ) : !canReadProjects ? (
            <div className="col-span-4 space-y-4 rounded-lg border-2 border-dashed border-gray-300 py-8 px-6 text-center">
              <div className="space-y-1">
                <p>You need additional permissions to view projects from this organization</p>
                <p className="text-sm text-scale-1100">
                  Contact your organization owner or administrator for assistance.
                </p>
              </div>
            </div>
          ) : isEmpty ? (
            <div className="col-span-4 space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
              <div className="space-y-1">
                <p>No projects</p>
                <p className="text-sm text-scale-1100">Get started by creating a new project.</p>
              </div>
              <div>
                <Link href={`/new/${slug}`}>
                  <a>
                    <Button icon={<IconPlus />}>New Project</Button>
                  </a>
                </Link>
              </div>
            </div>
          ) : (
            projects?.map((project) => (
              <ProjectCard
                key={makeRandomString(5)}
                project={project}
                rewriteHref={rewriteHref ? rewriteHref(project.ref) : undefined}
              />
            ))
          )}
        </ul>
      )}
    </div>
  )
}
