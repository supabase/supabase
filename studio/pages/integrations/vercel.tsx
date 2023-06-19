import { useMemo, useState } from 'react'

import { useParams } from 'common'
import ProjectLinker from 'components/interfaces/Integrations/ProjectLinker'
import { WizardLayout } from 'components/layouts'
import OrganizationPicker from 'components/ui/OrganizationPicker'
import { useVercelIntegrationCreateMutation } from 'data/integrations/vercel-integration-create-mutation'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useStore } from 'hooks'
import { EMPTY_ARR } from 'lib/void'
import { NextPageWithLayout, Organization } from 'types'
import { Button } from 'ui'

const VercelIntegration: NextPageWithLayout = () => {
  const { ui } = useStore()
  const { code, configurationId, next, teamId, source } = useParams()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [organizationIntegrationId, setOrganizationIntegrationId] = useState<string | null>(null)

  const { mutate, isLoading } = useVercelIntegrationCreateMutation({
    onSuccess({ id }) {
      setOrganizationIntegrationId(id)
    },
  })

  function onInstall() {
    const orgId = selectedOrg?.id
    if (!orgId) {
      return ui.setNotification({ category: 'error', message: 'Please select an organization' })
    }

    if (!code) {
      return ui.setNotification({ category: 'error', message: 'Vercel code missing' })
    }

    if (!configurationId) {
      return ui.setNotification({ category: 'error', message: 'Vercel Configuration ID missing' })
    }

    if (!source) {
      return ui.setNotification({
        category: 'error',
        message: 'Vercel Configuration source missing',
      })
    }

    const metadata = {}

    mutate({
      code,
      configurationId,
      orgId,
      metadata,
      source,
      teamId: teamId,
    })
  }

  const { data: supabaseProjectsData } = useProjectsQuery({
    enabled: organizationIntegrationId !== null,
  })
  const supabaseProjects = useMemo(
    () =>
      supabaseProjectsData
        ?.filter((project) => project.organization_id === selectedOrg?.id)
        .map((project) => ({ id: project.id.toString(), name: project.name })) ?? EMPTY_ARR,
    [selectedOrg?.id, supabaseProjectsData]
  )

  const { data: vercelProjectsData } = useVercelProjectsQuery(
    {
      orgId: selectedOrg?.id,
      orgSlug: selectedOrg?.slug,
      organization_integration_id: organizationIntegrationId,
    },
    { enabled: organizationIntegrationId !== null }
  )

  console.log('vercelProjectsData', vercelProjectsData)
  const vercelProjects = useMemo(() => vercelProjectsData ?? EMPTY_ARR, [vercelProjectsData])

  return (
    <div className="flex flex-col gap-4">
      <h1>Vercel Integration</h1>

      {organizationIntegrationId === null ? (
        <>
          <OrganizationPicker onSelectedOrgChange={setSelectedOrg} />

          <Button className="self-end" disabled={isLoading} loading={isLoading} onClick={onInstall}>
            Install
          </Button>
        </>
      ) : (
        <>
          <ProjectLinker
            organizationIntegrationId={organizationIntegrationId}
            foreignProjects={vercelProjects}
            supabaseProjects={supabaseProjects}
            onCreateConnections={() => {
              if (next) {
                window.location.href = next
              }
            }}
          />
        </>
      )}
    </div>
  )
}

VercelIntegration.getLayout = (page) => <WizardLayout>{page}</WizardLayout>

export default VercelIntegration
