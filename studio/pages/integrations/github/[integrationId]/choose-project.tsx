import { useParams } from 'common'
import ProjectLinker from 'components/interfaces/Integrations/ProjectLinker'
import { Markdown } from 'components/interfaces/Markdown'
import GitHubIntegrationWindowLayout from 'components/layouts/IntegrationsLayout/GitHubIntegrationWindowLayout'
import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { useIntegrationGitHubConnectionsCreateMutation } from 'data/integrations/integrations-github-connections-create-mutation'
import { useGitHubReposQuery } from 'data/integrations/integrations-github-repos-query'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { EMPTY_ARR } from 'lib/void'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { NextPageWithLayout } from 'types'
import { IconBook, IconLifeBuoy, LoadingLine } from 'ui'

const GITHUB_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 98 96" className="w-6">
    <path
      fill="#ffffff"
      fillRule="evenodd"
      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
      clipRule="evenodd"
    />
  </svg>
)

const ChooseProjectGitHubPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { integrationId } = useParams()

  const { data: integrations } = useIntegrationsQuery()
  const { data: organizations } = useOrganizationsQuery()
  const { data: allProjects } = useProjectsQuery()
  const { data: allRepos } = useGitHubReposQuery({ integrationId })

  const integration = integrations?.find((integration) => integration.id === integrationId)
  const orgSlug = integration?.organization.slug
  const organization = organizations?.find((organization) => organization.slug === orgSlug)
  const projects = useMemo(
    () =>
      allProjects
        ?.filter((project) => project.organization_id === organization?.id)
        .map((project) => ({ id: project.id.toString(), name: project.name, ref: project.ref })) ??
      EMPTY_ARR,
    [allProjects, organization?.id]
  )

  const repos = useMemo(
    () =>
      allRepos?.map((repo) => ({
        id: repo.id.toString(),
        name: repo.full_name,
      })) ?? EMPTY_ARR,
    [allRepos]
  )

  const { mutate: createConnections, isLoading: isCreatingConnection } =
    useIntegrationGitHubConnectionsCreateMutation({
      onSuccess() {
        router.push(`/org/${orgSlug}/integrations`)
      },
    })

  return (
    <>
      <main className="overflow-auto flex flex-col h-full">
        <LoadingLine loading={isCreatingConnection} />
        <>
          <ScaffoldContainer className="flex flex-col gap-6 grow py-8">
            <header>
              <h1 className="text-xl text-scale-1200">
                Link a Supabase project to a GitHub repository
              </h1>
              <Markdown
                className="text-scale-900"
                // explain what this integration does
                content={`
This Supabase integration will allow you to link a Supabase project to a GitHub repository. This will allow you to deploy your database schema to your Supabase project.
`}
              />
            </header>
            <ProjectLinker
              organizationIntegrationId={integration?.id}
              foreignProjects={repos ?? EMPTY_ARR}
              supabaseProjects={projects}
              onCreateConnections={createConnections}
              installedConnections={integration?.connections}
              isLoading={isCreatingConnection}
              integrationIcon={GITHUB_ICON}
              choosePrompt="Choose GitHub Repo"
              onSkip={() => {
                router.push(`/org/${orgSlug}/integrations`)
              }}
            />
          </ScaffoldContainer>
        </>

        <ScaffoldDivider />
      </main>
      <ScaffoldContainer className="bg-body flex flex-row gap-6 py-6 border-t">
        <div className="flex items-center gap-2 text-xs text-scale-900">
          <IconBook size={16} /> Docs
        </div>
        <div className="flex items-center gap-2 text-xs text-scale-900">
          <IconLifeBuoy size={16} /> Support
        </div>
      </ScaffoldContainer>
    </>
  )
}

ChooseProjectGitHubPage.getLayout = (page) => (
  <GitHubIntegrationWindowLayout>{page}</GitHubIntegrationWindowLayout>
)

export default ChooseProjectGitHubPage
