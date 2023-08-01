import { useRouter } from 'next/router'
import { useMemo } from 'react'

import { useParams } from 'common'
import ProjectLinker from 'components/interfaces/Integrations/ProjectLinker'
import { Markdown } from 'components/interfaces/Markdown'
import GitHubIntegrationWindowLayout from 'components/layouts/IntegrationsLayout/GitHubIntegrationWindowLayout'
import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { useIntegrationGitHubConnectionsCreateMutation } from 'data/integrations/integrations-github-connections-create-mutation'
import { useGitHubReposQuery } from 'data/integrations/integrations-github-repos-query'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { BASE_PATH } from 'lib/constants'
import { EMPTY_ARR } from 'lib/void'
import { NextPageWithLayout } from 'types'
import { IconBook, IconLifeBuoy, LoadingLine } from 'ui'

const GITHUB_ICON = (
  <img
    src={`${BASE_PATH}/img/icons/github-icon-dark.svg`}
    alt="GitHub Icon"
    className="w-6 text-red-500"
  />
)

const ChooseProjectGitHubPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { integrationId, slug, organizationSlug } = useParams()
  const orgSlug = slug ?? organizationSlug

  const { data: integrations } = useOrgIntegrationsQuery({
    orgSlug,
  })
  const { data: organizations } = useOrganizationsQuery()
  const { data: allProjects } = useProjectsQuery()
  const { data: allRepos } = useGitHubReposQuery({ integrationId })

  const integration = integrations?.find((integration) => integration.id === integrationId)
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
