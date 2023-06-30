import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import IntegrationWindowLayout from 'components/layouts/IntegrationWindowLayout'
import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { IntegrationName } from 'data/integrations/integrations.types'
import { useVercelIntegrationCreateMutation } from 'data/integrations/vercel-integration-create-mutation'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useStore } from 'hooks'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useVercelIntegrationInstallationState } from 'state/vercel-integration-installation'
import { NextPageWithLayout, Organization } from 'types'
import { Alert, Badge, Button, IconBook, IconHexagon, IconLifeBuoy, Listbox, LoadingLine } from 'ui'

/**
 * Organization type with `installationInstalled` added
 */
interface OrganizationsResponseWithInstalledData extends Organization {
  installationInstalled?: boolean
}

/**
 * Variations of the Vercel integration flow.
 * They require different UI and logic.
 *
 * Deploy Button - the flow that starts from the Deploy Button - https://vercel.com/docs/integrations#deploy-button
 * Marketplace - the flow that starts from the Marketplace - https://vercel.com/integrations
 *
 */
export type VercelIntegrationFlow = 'deploy-button' | 'marketing'

const VercelIntegration: NextPageWithLayout = () => {
  const router = useRouter()
  const { ui } = useStore()
  const { code, configurationId, next, teamId, source, externalId } = useParams()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [organizationIntegrationId, setOrganizationIntegrationId] = useState<string | null>(null)

  const snapshot = useVercelIntegrationInstallationState()

  const flow: VercelIntegrationFlow = externalId ? 'marketing' : 'deploy-button'

  /**
   * Fetch the list of organization based integration installations for Vercel.
   *
   * Array of integrations installed on all
   */
  const { data: integrationData, isLoading: integrationDataLoading } = useIntegrationsQuery()

  const { data: organizationsData, isLoading: isLoadingOrganizationsQuery } = useOrganizationsQuery(
    {
      onSuccess(organizations) {
        const firstOrg = organizations?.[0]
        if (firstOrg && selectedOrg === null) {
          setSelectedOrg(firstOrg)
          snapshot.setSelectedOrganizationSlug(firstOrg.slug)
          router.query.organizationSlug = firstOrg.slug
        }
      },
    }
  )

  /**
   * Flat array of org slugs that have integration installed
   *
   */
  const flatInstalledConnectionsIds: string[] | [] =
    integrationData && integrationData.length > 0
      ? integrationData?.map((x) => x.organization.slug)
      : []

  console.log('flatInstalledConnectionsIds', flatInstalledConnectionsIds)

  /**
   * Organizations with extra `installationInstalled` attribute
   *
   * Used to show label/badge and allow/disallow installing
   *
   */
  const organizationsWithInstalledData: OrganizationsResponseWithInstalledData[] = organizationsData
    ? organizationsData.map((org) => {
        return {
          ...org,
          installationInstalled: flatInstalledConnectionsIds.includes(org.slug) ? true : false,
        }
      })
    : []

  const { mutate, isLoading: isLoadingVercelIntegrationCreateMutation } =
    useVercelIntegrationCreateMutation({
      onSuccess({ id }) {
        setOrganizationIntegrationId(id)
      },
    })

  function onInstall() {
    const orgSlug = selectedOrg?.slug

    const isIntegrationInstalled = organizationsWithInstalledData.find(
      (x) => x.slug === orgSlug && x.installationInstalled
    )
      ? true
      : false

    console.log('isIntegrationInstalled', isIntegrationInstalled)

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

    /**
     * Only install if instgration hasn't already been installed
     */
    if (!isIntegrationInstalled) {
      mutate({
        code,
        configurationId,
        orgSlug,
        metadata: {},
        source,
        teamId: teamId,
      })
    }

    if (externalId) {
      router.push({
        pathname: `/integrations/vercel/${orgSlug}/deploy-button/new-project`,
        query: router.query,
      })
    } else {
      router.push({
        pathname: `/integrations/vercel/${orgSlug}/marketplace/choose-project`,
        query: router.query,
      })
    }
  }

  const dataLoading = isLoadingVercelIntegrationCreateMutation || isLoadingOrganizationsQuery

  return (
    <>
      <main className="overflow-auto flex flex-col h-full">
        <LoadingLine loading={isLoadingVercelIntegrationCreateMutation} />
        {organizationIntegrationId === null && (
          <>
            <ScaffoldContainer className="max-w-md flex flex-col gap-6 grow py-8">
              <h1 className="text-xl text-scale-1200">Choose organization</h1>
              <>
                <Markdown content={`Choose the Supabase Organization you wish to install to`} />
                <OrganizationPicker
                  integrationName="Vercel"
                  organizationsWithInstalledData={organizationsWithInstalledData}
                  onSelectedOrgChange={(e) => {
                    router.query.organizationSlug = e.slug
                    setSelectedOrg(e)
                  }}
                  dataLoading={dataLoading}
                />
                <div className="flex flex-row w-full justify-end">
                  <Button
                    size="medium"
                    className="self-end"
                    disabled={isLoadingVercelIntegrationCreateMutation}
                    loading={isLoadingVercelIntegrationCreateMutation}
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
                  content={`Remove this integration at any time either via Vercel or the Supabase dashboard.`}
                />
              </Alert>
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

export interface OrganizationPickerProps {
  label?: string
  onSelectedOrgChange?: (org: Organization) => void
  integrationName: IntegrationName
  dataLoading: boolean
  organizationsWithInstalledData: OrganizationsResponseWithInstalledData[]
}

const OrganizationPicker = ({
  label = 'Choose an organization',
  onSelectedOrgChange,
  integrationName,
  dataLoading,
  organizationsWithInstalledData,
}: OrganizationPickerProps) => {
  const { ui } = useStore()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)

  const { data, isLoading } = useOrganizationsQuery({
    onSuccess(organizations) {
      const firstOrg = organizations?.[0]
      if (firstOrg && selectedOrg === null) {
        setSelectedOrg(firstOrg)
        onSelectedOrgChange?.(firstOrg)
      }
    },
  })

  function _onSelectedOrgChange(slug: string) {
    const org = data?.find((org) => org.slug === slug)

    if (org) {
      setSelectedOrg(org)
      onSelectedOrgChange?.(org)
    }
  }

  if (dataLoading) {
    return (
      <Listbox label={label} value="loading" disabled>
        <Listbox.Option key="loading" value="loading" label="Loading...">
          Loading...
        </Listbox.Option>
      </Listbox>
    )
  }

  return (
    <Listbox label={label} value={selectedOrg?.slug} onChange={_onSelectedOrgChange}>
      {organizationsWithInstalledData?.map((org) => {
        const label = (
          <div className="flex gap-3 items-center">
            {org.name}
            {org.installationInstalled && <Badge color="scale">Integration Installed</Badge>}
          </div>
        )
        return (
          <Listbox.Option
            key={org.id}
            value={org.slug}
            // @ts-expect-error
            label={label}
            addOnBefore={({ active, selected }: any) => <IconHexagon />}
          >
            {label}
          </Listbox.Option>
        )
      })}
    </Listbox>
  )
}

export default VercelIntegration
