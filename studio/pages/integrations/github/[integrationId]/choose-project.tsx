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
  const { integrationId, slug, organizationSlug, state: projectRef } = useParams()
  const orgSlug = slug ?? organizationSlug

  const { data: integrations } = useOrgIntegrationsQuery({
    orgSlug,
  })
  const { data: organizations } = useOrganizationsQuery()
  const { data: allProjects, isLoading: isLoadingSupabaseProjectsData } = useProjectsQuery()
  const { data: allRepos, isLoading: isLoadingGithubReposData } = useGitHubReposQuery({
    integrationId,
  })

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

  function onDone() {
    if (projectRef) {
      router.push(`/project/${projectRef}?enableBranching=true`)
    } else {
      router.push(`/org/${orgSlug}/integrations`)
    }
  }

  const { mutate: createConnections, isLoading: isCreatingConnection } =
    useIntegrationGitHubConnectionsCreateMutation({
      onSuccess: onDone,
    })

  return (
    <>
      <main className="overflow-auto flex flex-col h-full">
        <LoadingLine loading={isCreatingConnection} />
        <>
          <ScaffoldContainer className="flex flex-col gap-6 grow py-8">
            <header>
              <h1 className="text-xl text-foreground">
                Link a Supabase project to a GitHub repository
              </h1>
              <Markdown
                className="text-foreground-lighter"
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
              onSkip={onDone}
              loadingForeignProjects={isLoadingGithubReposData}
              loadingSupabaseProjects={isLoadingSupabaseProjectsData}
              defaultSupabaseProjectRef={projectRef}
            />
          </ScaffoldContainer>
        </>

        <ScaffoldDivider />
      </main>
      <ScaffoldContainer className="bg-background flex flex-row gap-6 py-6 border-t">
        <div className="flex items-center gap-2 text-xs text-foreground-lighter">
          <IconBook size={16} /> Docs
        </div>
        <div className="flex items-center gap-2 text-xs text-foreground-lighter">
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
