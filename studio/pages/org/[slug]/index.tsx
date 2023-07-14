import ProjectCard from 'components/interfaces/Home/ProjectList/ProjectCard'
import ShimmeringCard from 'components/interfaces/Home/ProjectList/ShimmeringCard'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization } from 'hooks'
import Link from 'next/link'
import { NextPageWithLayout } from 'types'
import { Button, IconPlus } from 'ui'

const ProjectsPage: NextPageWithLayout = () => {
  const {
    data: allProjects,
    error: projectsError,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
    isSuccess: isSuccessProjects,
  } = useProjectsQuery()
  const organization = useSelectedOrganization()
  const projects = allProjects?.filter((project) => project.organization_id === organization?.id)

  if (!organization) {
    // Return a 404 page
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12 space-y-4">
          <div className="flex items-center space-x-6">
            <h4 className="text-lg">Projects</h4>
            <Link href={`/new/${organization?.slug}`}>
              <a>
                <Button icon={<IconPlus />}>New project</Button>
              </a>
            </Link>
          </div>
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
            <ul className="mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {projects?.map((project) => (
                <ProjectCard key={project.ref} project={project} />
              ))}
            </ul>
          )}
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

ProjectsPage.getLayout = (page) => <AppLayout>{page}</AppLayout>

export default ProjectsPage
