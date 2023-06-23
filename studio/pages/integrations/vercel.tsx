import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import ProjectLinker from 'components/interfaces/Integrations/ProjectLinker'

import { Markdown } from 'components/interfaces/Markdown'
import IntegrationWindowLayout from 'components/layouts/IntegrationWindowLayout'
import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import OrganizationPicker from 'components/ui/OrganizationPicker'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { useVercelIntegrationCreateMutation } from 'data/integrations/vercel-integration-create-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useStore } from 'hooks'
import { EMPTY_ARR } from 'lib/void'
import { NextPageWithLayout, Organization } from 'types'
import { Alert, Button, IconBook, IconLifeBuoy, LoadingLine } from 'ui'
import { useRouter } from 'next/router'

const VercelIntegration: NextPageWithLayout = () => {
  const router = useRouter()

  useEffect(() => {
    router.push({ pathname: '/integrations/vercel/install', query: router.query })
  }, [router])

  /**
   *
   * remove everything here
   */
  const { ui } = useStore()
  const { code, configurationId, next, teamId, source, externalId } = useParams()
  const params = useParams()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [organizationIntegrationId, setOrganizationIntegrationId] = useState<string | null>(null)

  const { mutate, isLoading } = useVercelIntegrationCreateMutation({
    onSuccess({ id }) {
      setOrganizationIntegrationId(id)
    },
  })

  console.log('params', params)
  console.log('externalId', externalId)

  function onInstall() {
    const orgSlug = selectedOrg?.slug
    if (!orgSlug) {
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
      orgSlug,
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
        .map((project) => ({ id: project.id.toString(), name: project.name, ref: project.ref })) ??
      EMPTY_ARR,
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
    <>
      <main className="overflow-auto flex flex-col h-full">
        <LoadingLine loading={isLoading} />
        {organizationIntegrationId === null && (
          <>
            <ScaffoldContainer className="max-w-md flex flex-col gap-6 grow py-8">
              <h1 className="text-xl text-scale-1200">Install Integration</h1>
              <>
                <Markdown content={`Choose the Supabase Organization you wish to install to`} />
                <OrganizationPicker onSelectedOrgChange={setSelectedOrg} />
                <div className="flex flex-row w-full justify-end">
                  <Button
                    size="medium"
                    className="self-end"
                    disabled={isLoading}
                    loading={isLoading}
                    onClick={onInstall}
                  >
                    Install integration
                  </Button>
                </div>
              </>
            </ScaffoldContainer>
            <ScaffoldContainer className="flex flex-col gap-6 py-3">
              <Alert
                withIcon
                variant="info"
                title="You can uninstall this Integration at any time."
              >
                <Markdown
                  content={`You can remove this integration at any time either via Vercel or the Supabase dashboard.`}
                />
              </Alert>
            </ScaffoldContainer>
          </>
        )}

        {organizationIntegrationId !== null && (
          <>
            <ScaffoldContainer className="flex flex-col gap-6 grow py-8">
              <header>
                <h1 className="text-xl text-scale-1200">
                  Link a Supabase project to a Vercel project
                </h1>
                <Markdown
                  className="text-scale-900"
                  content={`
This Supabase integration manages your envioemnt variables automatically to provide the latest keys in the unlikely event that you will need to refresh your JWT token.
`}
                />
              </header>
              {/* <ProjectLinker
              organizationIntegrationId={organizationIntegrationId}
              foreignProjects={vercelProjects}
              supabaseProjects={supabaseProjects}
              onCreateConnections={() => {
                if (next) {
                  window.location.href = next
                }
              }}
            /> */}

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
            </ScaffoldContainer>
          </>
        )}
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

VercelIntegration.getLayout = (page) => <IntegrationWindowLayout>{page}</IntegrationWindowLayout>

export default VercelIntegration
