import { useMemo, useState } from 'react'

import { useParams } from 'common'
import ProjectLinker from 'components/interfaces/Integrations/ProjectLinker'
import { Markdown } from 'components/interfaces/Markdown'
import IntegrationWindowLayout from 'components/layouts/IntegrationWindowLayout'
import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { useOrgIntegrationsQuery } from 'data/integrations/integrations-query-org-only'
import { useVercelProjectsQuery } from 'data/integrations/integrations-vercel-projects-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { EMPTY_ARR } from 'lib/void'
import { NextPageWithLayout, Organization } from 'types'
import { IconBook, IconLifeBuoy, LoadingLine } from 'ui'

const VercelIntegration: NextPageWithLayout = () => {
  const { slug, configurationId, next, organizationSlug } = useParams()

  const [loading, setLoading] = useState<boolean>(false)

  /**
   * Fetch the list of organization based integration installations for Vercel.
   *
   * Array of integrations installed on all
   */
  const { data: integrationData, isLoading: integrationDataLoading } = useOrgIntegrationsQuery({
    orgSlug: slug,
  })

  const { data, isLoading: isLoadingOrganizationsQuery } = useOrganizationsQuery({
    enabled: slug !== undefined,
  })

  const organization = data?.find((organization: Organization) => organization.slug === slug)

  const integration = integrationData?.find((x) => x.metadata?.configuration_id === configurationId)

  const { data: supabaseProjectsData } = useProjectsQuery({
    enabled: integration?.id !== undefined,
  })

  const supabaseProjects = useMemo(
    () =>
      supabaseProjectsData
        ?.filter((project) => project.organization_id === organization?.id)
        .map((project) => ({ id: project.id.toString(), name: project.name, ref: project.ref })) ??
      EMPTY_ARR,
    [organizationSlug, supabaseProjectsData]
  )

  const { data: vercelProjectsData } = useVercelProjectsQuery(
    {
      organization_integration_id: integration?.id,
    },
    { enabled: integration?.id !== undefined }
  )

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
This Supabase integration manages your environment variables automatically to provide the latest keys in the unlikely event that you will need to refresh your JWT token.
`}
              />
            </header>
            <ProjectLinker
              organizationIntegrationId={integration?.id}
              foreignProjects={vercelProjects}
              supabaseProjects={supabaseProjects}
              onCreateConnections={() => {
                if (next) {
                  window.location.href = next
                }
              }}
              installedConnections={integration?.connections}
              setLoading={setLoading}
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
