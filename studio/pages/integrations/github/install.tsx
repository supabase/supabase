import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import GitHubIntegrationWindowLayout from 'components/layouts/IntegrationsLayout/GitHubIntegrationWindowLayout'
import { ScaffoldColumn, ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { useGitHubIntegrationCreateMutation } from 'data/integrations/github-integration-create-mutation'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { IntegrationName } from 'data/integrations/integrations.types'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useStore } from 'hooks'
import { useGitHubIntegrationInstallationState } from 'state/github-integration-installation'
import { NextPageWithLayout, Organization } from 'types'
import { Alert, Badge, Button, IconBook, IconHexagon, IconLifeBuoy, Listbox, LoadingLine } from 'ui'

/**
 * Organization type with `installationInstalled` added
 */
interface OrganizationsResponseWithInstalledData extends Organization {
  installationInstalled?: boolean
}

const GitHubIntegration: NextPageWithLayout = () => {
  const router = useRouter()
  const { ui } = useStore()
  const { installation_id: installationId } = useParams()
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [organizationIntegrationId, setOrganizationIntegrationId] = useState<string | null>(null)

  const snapshot = useGitHubIntegrationInstallationState()

  /**
   * Fetch the list of organization based integration installations for GitHub.
   *
   * Array of integrations installed on all
   */
  const { data: integrationData } = useIntegrationsQuery()

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
      ? integrationData
          .filter((x) => x.integration.name === 'Vercel')
          .map((x) => x.organization.slug)
      : []

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

  const { mutate, isLoading: isLoadingGitHubIntegrationCreateMutation } =
    useGitHubIntegrationCreateMutation({
      onSuccess({ id }) {
        setOrganizationIntegrationId(id)

        router.push({
          pathname: `/integrations/github/${id}/choose-project`,
          query: router.query,
        })
      },
      onError(error: any) {
        ui.setNotification({
          category: 'error',
          message: `Creating GitHub integration failed: ${error.message}`,
        })
      },
    })

  function onInstall() {
    const orgSlug = selectedOrg?.slug

    const installedIntegration = integrationData?.find(
      (x) =>
        x.organization.slug === orgSlug &&
        x.metadata !== undefined &&
        'installation_id' in x.metadata &&
        String(x.metadata?.installation_id) === String(installationId)
    )
    const isIntegrationInstalled = Boolean(installedIntegration)

    if (!orgSlug) {
      return ui.setNotification({ category: 'error', message: 'Please select an organization' })
    }

    if (!installationId) {
      return ui.setNotification({ category: 'error', message: 'GitHub Installation ID is missing' })
    }

    /**
     * Only install if instgration hasn't already been installed
     */
    if (!isIntegrationInstalled) {
      mutate({
        installationId: Number(installationId),
        orgSlug,
        metadata: {},
      })
    } else {
      router.push({
        pathname: `/integrations/github/${installedIntegration?.id}/choose-project`,
        query: router.query,
      })
    }
  }

  const dataLoading = isLoadingGitHubIntegrationCreateMutation || isLoadingOrganizationsQuery

  return (
    <>
      <main className="overflow-auto flex flex-col h-full bg">
        <LoadingLine loading={isLoadingGitHubIntegrationCreateMutation} />
        {organizationIntegrationId === null && (
          <>
            <ScaffoldContainer className="flex flex-col gap-6 grow py-8">
              <ScaffoldColumn className="mx-auto">
                <h1 className="text-xl text-scale-1200">Choose organization</h1>
                <>
                  <Markdown content={`Choose the Supabase organization you wish to install in`} />
                  <OrganizationPicker
                    integrationName="GitHub"
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
                      disabled={isLoadingGitHubIntegrationCreateMutation}
                      loading={isLoadingGitHubIntegrationCreateMutation}
                      onClick={onInstall}
                    >
                      Install integration
                    </Button>
                  </div>
                </>
              </ScaffoldColumn>
            </ScaffoldContainer>
            <ScaffoldContainer className="flex flex-col gap-6 py-3">
              <Alert
                withIcon
                variant="info"
                title="You can uninstall this Integration at any time."
              >
                <Markdown
                  content={`Remove this integration at any time via GitHub or the Supabase dashboard.`}
                />
              </Alert>
            </ScaffoldContainer>
          </>
        )}

        <ScaffoldDivider />
      </main>
      <ScaffoldContainer className="bg-body flex flex-row gap-6 py-6">
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

GitHubIntegration.getLayout = (page) => (
  <GitHubIntegrationWindowLayout>{page}</GitHubIntegrationWindowLayout>
)

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
  dataLoading,
  organizationsWithInstalledData,
}: OrganizationPickerProps) => {
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

export default GitHubIntegration
