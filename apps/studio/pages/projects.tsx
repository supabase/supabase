import { useQueryClient } from '@tanstack/react-query'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { CreateProjectModal } from 'components/interfaces/Projects/CreateProjectModal'
import { ProjectCard } from 'components/interfaces/Projects/ProjectCard'
import type { StudioProject } from 'components/interfaces/Projects/ProjectCard'
import AlertError from 'components/ui/AlertError'
import { withAuth } from 'hooks/misc/withAuth'
import { Plus } from 'lucide-react'
import type { NextPageWithLayout } from 'types'
import { Button, Skeleton } from 'ui'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const PROJECTS_QUERY_KEY = ['platform', 'projects'] as const

function useProjects() {
  return useQuery<StudioProject[]>({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch('/api/platform/projects')
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`)
      }
      return response.json()
    },
  })
}

const ProjectsPage: NextPageWithLayout = () => {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: projects = [], error, isPending: isLoading, isError, refetch } = useProjects()

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY })
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection isFullWidth className="flex flex-col gap-y-6">
        <div className="flex items-center justify-between gap-x-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Projects</h1>
            <p className="text-sm text-foreground-light mt-0.5">
              Manage your multi-tenant Supabase projects. Open a project dashboard to reach
              credentials, invite codes, admin tables, functions, and logs quickly.
            </p>
          </div>
          <Button icon={<Plus />} type="primary" onClick={() => setShowCreateModal(true)}>
            New Project
          </Button>
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[100px] rounded-md" />
            <Skeleton className="h-[100px] rounded-md" />
            <Skeleton className="h-[100px] rounded-md" />
          </div>
        )}

        {isError && (
          <AlertError
            error={error as any}
            subject="Failed to load projects"
            action={
              <Button type="default" onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        )}

        {!isLoading && !isError && projects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-foreground-light mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto mb-3 opacity-40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="text-base font-medium text-foreground">No projects yet</p>
              <p className="text-sm text-foreground-light mt-1">
                Create your first project to get started
              </p>
            </div>
            <Button icon={<Plus />} type="primary" onClick={() => setShowCreateModal(true)}>
              Create first project
            </Button>
          </div>
        )}

        {!isLoading && !isError && projects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </ScaffoldSection>

      <CreateProjectModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </ScaffoldContainer>
  )
}

ProjectsPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout hideMobileMenu headerTitle="Projects">
      <PageLayout title="Projects" className="max-w-[1200px] lg:px-6 mx-auto">
        {page}
      </PageLayout>
    </DefaultLayout>
  </AppLayout>
)

export default withAuth(ProjectsPage)
