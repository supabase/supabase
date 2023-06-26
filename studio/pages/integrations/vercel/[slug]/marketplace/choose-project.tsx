import { useMemo, useState } from 'react'

import { useParams } from 'common'
import ProjectLinker from 'components/interfaces/Integrations/ProjectLinker'

import { Markdown } from 'components/interfaces/Markdown'
import IntegrationWindowLayout from 'components/layouts/IntegrationWindowLayout'
import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { useVercelIntegrationCreateMutation } from 'data/integrations/vercel-integration-create-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useStore } from 'hooks'
import { EMPTY_ARR } from 'lib/void'
import { NextPageWithLayout, Organization } from 'types'
import { IconBook, IconLifeBuoy, LoadingLine } from 'ui'
import { useIntegrationsQuery } from 'data/integrations/integrations-github-repos-query'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useRouter } from 'next/router'

const VercelIntegration: NextPageWithLayout = () => {
  const { ui } = useStore()
  const router = useRouter()
  const { code, configurationId, next, teamId, source, externalId } = useParams()

  const [loading, setLoading] = useState<boolean>(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  // const [organizationIntegrationId, setOrganizationIntegrationId] = useState<string | undefined>(
  //   undefined
  // )

  const { slug } = router.query
  /**
   * Fetch the list of organization based integration installations for Vercel.
   *
   * Array of integrations installed on all
   */
  const { data: integrationData, isLoading: integrationDataLoading } = useOrgIntegrationsQuery({
    orgSlug: slug?.toString(),
  })

  console.log('integrationData', integrationData)

  const organizationIntegrationId = integrationData?.find(
    (x) => x.metadata?.configuration_id === configurationId
  )?.id

  console.log('organizationIntegrationId', organizationIntegrationId)

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
      organization_integration_id: organizationIntegrationId,
    },
    { enabled: organizationIntegrationId !== undefined }
  )

  console.log('vercelProjectsData', vercelProjectsData)

  const vercelProjects = useMemo(() => vercelProjectsData ?? EMPTY_ARR, [vercelProjectsData])

  return (
    <>
      <main className="overflow-auto flex flex-col h-full">
        <LoadingLine loading={loading} />
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
