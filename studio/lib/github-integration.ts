import { useParams } from 'common'
import { useGitHubIntegrationCreateMutation } from 'data/integrations/github-integration-create-mutation'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useEffect, useState } from 'react'

export function useGitHubIntegrationAutoInstall(callback?: (id: string, orgSlug: string) => void) {
  const { installation_id: installationId, state: projectRef } = useParams()
  const shouldAttemptInstall = projectRef !== undefined && installationId !== undefined

  const [isAutoInstalling, setIsAutoInstalling] = useState(false)

  const { data: projects, isSuccess: isProjectsSuccess } = useProjectsQuery({
    enabled: shouldAttemptInstall,
  })
  const { data: organizations, isSuccess: isOrganizationsSuccess } = useOrganizationsQuery({
    enabled: shouldAttemptInstall,
  })

  const { mutate: createIntegration } = useGitHubIntegrationCreateMutation()

  useEffect(() => {
    async function autoInstall() {
      if (shouldAttemptInstall) {
        setIsAutoInstalling(true)
      }

      if (projectRef && isProjectsSuccess && isOrganizationsSuccess) {
        const project = projects.find((x) => x.ref === projectRef)
        const organization = organizations.find((x) => x.id === project?.organization_id)

        if (project && organization) {
          createIntegration(
            {
              installationId: Number(installationId),
              orgSlug: organization.slug,
              metadata: {
                supabaseConfig: {
                  supabaseDirectory: '/supabase',
                },
              },
            },
            {
              onSuccess({ id }) {
                setIsAutoInstalling(false)

                callback?.(id, organization.slug)
              },
              onError() {
                setIsAutoInstalling(false)
              },
            }
          )
        } else {
          setIsAutoInstalling(false)
        }
      }
    }

    autoInstall()
  }, [
    callback,
    createIntegration,
    installationId,
    isOrganizationsSuccess,
    isProjectsSuccess,
    organizations,
    projectRef,
    projects,
    shouldAttemptInstall,
  ])

  return isAutoInstalling
}
