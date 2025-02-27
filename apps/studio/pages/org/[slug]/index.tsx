import { Plus } from 'lucide-react'
import Link from 'next/link'

import { NoProjectsOnPaidOrgInfo } from 'components/interfaces/Billing/NoProjectsOnPaidOrgInfo'
import ProjectCard from 'components/interfaces/Home/ProjectList/ProjectCard'
import ShimmeringCard from 'components/interfaces/Home/ProjectList/ShimmeringCard'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { useGitHubConnectionsQuery } from 'data/integrations/github-connections-query'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import type { NextPageWithLayout } from 'types'
import { Button } from 'ui'

const ProjectsPage: NextPageWithLayout = () => {
  const {
    data: allProjects,
    error: projectsError,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
    isSuccess: isSuccessProjects,
  } = useProjectsQuery()

  const organization = useSelectedOrganization()
  const projects = allProjects
    ?.filter((project) => project.organization_id === organization?.id)
    .sort((a, b) => a.name.localeCompare(b.name))

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

  return (
    <ScaffoldContainer className="h-full overflow-y-auto">
      <ScaffoldSection>
        <div className="col-span-12 space-y-8">
          <NoProjectsOnPaidOrgInfo organization={organization} />

          <div>
            <Button asChild size="medium" type="default" iconRight={<Plus />}>
              <Link href={`/new/${organization?.slug}`}>New project</Link>
            </Button>
          </div>
          <div className="space-y-4">
            <h4 className="text-lg">Projects</h4>
            {isLoadingProjects && (
              <ul className="mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                <ShimmeringCard />
                <ShimmeringCard />
              </ul>
            )}
            {isErrorProjects && (
              <AlertError error={projectsError} subject="Failed to retrieve projects" />
            )}
            {isSuccessProjects && (
              <>
                {(projects?.length ?? 0) === 0 ? (
                  <div className="col-span-4 space-y-4 rounded-lg border border-muted border-dashed p-6 text-center">
                    <div className="space-y-1">
                      <p>No projects</p>
                      <p className="text-sm text-foreground-light">
                        Get started by creating a new project.
                      </p>
                    </div>
                    <div>
                      <Button asChild icon={<Plus />}>
                        <Link href={`/new/${organization?.slug}`}>New Project</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <ul className="mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {projects?.map((project) => (
                      <ProjectCard
                        key={project.ref}
                        project={project}
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
            )}
          </div>
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

ProjectsPage.getLayout = (page) => <AppLayout>{page}</AppLayout>

export default ProjectsPage
