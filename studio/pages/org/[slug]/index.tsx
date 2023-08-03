import Link from 'next/link'
import { Button, IconPlus } from 'ui'

import ProjectCard from 'components/interfaces/Home/ProjectList/ProjectCard'
import ShimmeringCard from 'components/interfaces/Home/ProjectList/ShimmeringCard'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks'
import { NextPageWithLayout } from 'types'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'

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
  const githubConnections = integrations
    ?.filter((integration) => integration.integration.name === 'GitHub')
    .flatMap((integration) => integration.connections)

  return (
    <ScaffoldContainer className="h-full overflow-y-auto">
      <ScaffoldSection>
        <div className="col-span-12 space-y-8">
          <Link href={`/new/${organization?.slug}`}>
            <a>
              <Button size="medium" type="default" iconRight={<IconPlus />}>
                New project
              </Button>
            </a>
          </Link>
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
                  <div className="col-span-4 space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                    <div className="space-y-1">
                      <p>No projects</p>
                      <p className="text-sm text-scale-1100">
                        Get started by creating a new project.
                      </p>
                    </div>
                    <div>
                      <Link href={`/new/${organization?.slug}`}>
                        <a>
                          <Button icon={<IconPlus />}>New Project</Button>
                        </a>
                      </Link>
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
