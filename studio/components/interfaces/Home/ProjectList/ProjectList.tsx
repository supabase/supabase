import { groupBy } from 'lodash'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { Button, IconExternalLink, IconPlus, Modal } from 'ui'

import AlertError from 'components/ui/AlertError'
import {
  OverdueInvoicesResponse,
  useOverdueInvoicesQuery,
} from 'data/invoices/invoices-overdue-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { ResourceWarning, useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { IS_PLATFORM } from 'lib/constants'
import { makeRandomString } from 'lib/helpers'
import { useState } from 'react'
import { Organization, Project, ResponseError } from 'types'
import ProjectCard from './ProjectCard'
import ShimmeringCard from './ShimmeringCard'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useSelectedOrganization } from 'hooks'

export interface ProjectListProps {
  rewriteHref?: (projectRef: string) => string
}

const ProjectList = ({ rewriteHref }: ProjectListProps) => {
  const { data: organizations, isSuccess } = useOrganizationsQuery()
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
  const { data: resourceWarnings } = useResourceWarningsQuery()
  const { data: allOverdueInvoices } = useOverdueInvoicesQuery({ enabled: IS_PLATFORM })
  const projectsByOrg = groupBy(allProjects, 'organization_id')
  const isLoadingPermissions = IS_PLATFORM ? _isLoadingPermissions : false

  return isSuccess && organizations && organizations?.length > 0 ? (
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
            resourceWarnings={resourceWarnings ?? []}
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
  ) : (
    <NoProjectsState slug={''} />
  )
}

export default observer(ProjectList)

type OrganizationProjectsProps = {
  organization: Organization
  projects: Project[]
  overdueInvoices: OverdueInvoicesResponse[]
  resourceWarnings: ResourceWarning[]
  isLoadingPermissions: boolean
  isErrorPermissions: boolean
  permissionsError: ResponseError | null
  isLoadingProjects: boolean
  isErrorProjects: boolean
  projectsError: ResponseError | null
  rewriteHref?: (projectRef: string) => string
}

const OrganizationProjects = ({
  organization: { name, slug, subscription_id },
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
}: OrganizationProjectsProps) => {
  const organization = useSelectedOrganization()
  const isEmpty = !projects || projects.length === 0

  const { data: integrations } = useOrgIntegrationsQuery({ orgSlug: organization?.slug })
  const githubConnections = integrations
    ?.filter((integration) => integration.integration.name === 'GitHub')
    .flatMap((integration) => integration.connections)
  const vercelConnections = integrations
    ?.filter((integration) => integration.integration.name === 'Vercel')
    .flatMap((integration) => integration.connections)

  const [orgBillingMigrationModalVisible, setOrgBillingMigrationModalVisible] = useState(false)

  return (
    <div className="space-y-3" key={makeRandomString(5)}>
      <div className="flex space-x-4 items-center">
        <h4 className="text-lg flex items-center">{name}</h4>

        {!!overdueInvoices.length && (
          <div>
            <Button asChild type="danger">
              <Link href={`/org/${slug}/invoices`}>Outstanding Invoices</Link>
            </Button>
          </div>
        )}

        {!subscription_id && (
          <div>
            <Button onClick={() => setOrgBillingMigrationModalVisible(true)} type="warning">
              Action Required
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
            <NoProjectsState slug={slug} />
          ) : (
            projects?.map((project) => (
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

      <Modal
        closable
        hideFooter
        size="small"
        visible={orgBillingMigrationModalVisible}
        onCancel={() => setOrgBillingMigrationModalVisible(false)}
        header="We're upgrading our billing system"
      >
        <Modal.Content className="py-4 space-y-4">
          <div className="space-y-3">
            <p className="text-sm leading-normal">
              The organization "{name}" still uses the legacy project-based billing. We've recently
              made some big improvements to our billing system and require your action. To migrate
              to the new organization-based billing, head over to your{' '}
              <Link
                href={`/org/${slug}/billing`}
                className="text-sm text-green-900 transition hover:text-green-1000"
              >
                organization billing settings
              </Link>
              .
            </p>

            <p className="text-sm leading-normal">
              Please do this until the <span className="font-medium">18th of October</span>, as
              remaining organizations will be migrated.
            </p>

            <div className="space-x-3">
              <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                <Link
                  href="https://supabase.com/blog/organization-based-billing"
                  target="_blank"
                  rel="noreferrer"
                >
                  Announcement
                </Link>
              </Button>
              <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
                <Link
                  href="https://supabase.com/docs/guides/platform/org-based-billing"
                  target="_blank"
                  rel="noreferrer"
                >
                  Documentation
                </Link>
              </Button>
            </div>
          </div>
        </Modal.Content>
      </Modal>
    </div>
  )
}

const NoProjectsState = ({ slug }: { slug: string }) => {
  return (
    <div className="col-span-4 space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
      <div className="space-y-1">
        <p>No projects</p>
        <p className="text-sm text-foreground-light">Get started by creating a new project.</p>
      </div>
      <div>
        <Button asChild icon={<IconPlus />}>
          <Link href={`/new/${slug}`}>New Project</Link>
        </Button>
      </div>
    </div>
  )
}
