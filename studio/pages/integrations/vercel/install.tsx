import { useParams } from 'common'
import { Markdown } from 'components/interfaces/Markdown'
import IntegrationWindowLayout from 'components/layouts/IntegrationWindowLayout'
import { ScaffoldColumn, ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { IntegrationName } from 'data/integrations/integrations.types'
import { useVercelIntegrationCreateMutation } from 'data/integrations/vercel-integration-create-mutation'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useStore } from 'hooks'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { useVercelIntegrationInstallationState } from 'state/vercel-integration-installation'
import { NextPageWithLayout, Organization } from 'types'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconAlertTriangle,
  IconBook,
  IconChevronDown,
  IconHexagon,
  IconInfo,
  IconLifeBuoy,
  LoadingLine,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

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
  const [selectedOrg, setSelectedOrg] = useState<OrganizationsResponseWithInstalledData | null>(
    null
  )
  const [organizationIntegrationId, setOrganizationIntegrationId] = useState<string | null>(null)

  const snapshot = useVercelIntegrationInstallationState()

  const flow: VercelIntegrationFlow = externalId ? 'marketing' : 'deploy-button'

  /**
   * Fetch the list of organization based integration installations for Vercel.
   *
   * Array of integrations installed on all
   */
  const { data: integrationData, isLoading: integrationDataLoading } = useIntegrationsQuery()

  const { data: organizationsData, isLoading: isLoadingOrganizationsQuery } =
    useOrganizationsQuery()

  useEffect(() => {
    if (organizationsData !== undefined && integrationData !== undefined) {
      const firstOrg = organizationsWithInstalls(organizationsData)?.[0]

      if (firstOrg && selectedOrg === null) {
        setSelectedOrg(firstOrg)
        snapshot.setSelectedOrganizationSlug(firstOrg.slug)
        router.query.organizationSlug = firstOrg.slug
      }
    }
  }, [organizationsData, integrationData])

  /**
   * Find installedConnections
   */
  function organizationsWithInstalls(organizations?: OrganizationsResponseWithInstalledData[]) {
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

    return organizations
      ? organizations?.map((org) => {
          return {
            ...org,
            installationInstalled: flatInstalledConnectionsIds.includes(org.slug) ? true : false,
          }
        })
      : []
  }

  /**
   * Organizations with extra `installationInstalled` attribute
   *
   * Used to show label/badge and allow/disallow installing
   *
   */
  const organizationsWithInstalledData: OrganizationsResponseWithInstalledData[] =
    organizationsWithInstalls(organizationsData)

  /**
   * Handle the correct route change based on whether the vercel integration
   * is following the 'marketplace' flow or 'deploy button' flow.
   *
   */
  function handleRouteChange() {
    const orgSlug = selectedOrg?.slug

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

  const { mutate, isLoading: isLoadingVercelIntegrationCreateMutation } =
    useVercelIntegrationCreateMutation({
      onSuccess({ id }) {
        const orgSlug = selectedOrg?.slug

        setOrganizationIntegrationId(id)

        handleRouteChange()
      },
      onError(error: any) {
        ui.setNotification({
          category: 'error',
          message: `Creating Vercel integration failed: ${error.message}`,
        })
      },
    })

  function onInstall() {
    const orgSlug = selectedOrg?.slug

    const isIntegrationInstalled = organizationsWithInstalledData.some(
      (x) => x.slug === orgSlug && x.installationInstalled
    )

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
    } else {
      handleRouteChange()
    }
  }

  const dataLoading = isLoadingVercelIntegrationCreateMutation || isLoadingOrganizationsQuery

  const disableInstallationForm =
    (isLoadingVercelIntegrationCreateMutation && !dataLoading) ||
    // disables installation button if integration is already installed and it is Marketplace flow
    (selectedOrg && selectedOrg?.installationInstalled && source === 'marketplace' && !dataLoading)
      ? true
      : false

  return (
    <>
      <main className="overflow-auto flex flex-col h-full">
        <LoadingLine loading={isLoadingVercelIntegrationCreateMutation} />
        {organizationIntegrationId === null && (
          <>
            <ScaffoldContainer className="flex flex-col gap-6 grow py-8">
              <ScaffoldColumn className="mx-auto w-full max-w-md">
                <h1 className="text-xl text-scale-1200">Choose organization</h1>
                <>
                  <Markdown content={`Choose the Supabase organization you wish to install in`} />
                  <OrganizationPicker
                    integrationName="Vercel"
                    organizationsWithInstalledData={organizationsWithInstalledData}
                    onSelectedOrgChange={(e: string) => {
                      const org = organizationsWithInstalledData?.find((org) => org.slug === e)

                      if (org) {
                        setSelectedOrg(org)
                        router.query.organizationSlug = org.slug
                      }
                    }}
                    selectedOrg={selectedOrg}
                    dataLoading={dataLoading}
                  />
                  {disableInstallationForm && (
                    <Alert_Shadcn_ variant="warning">
                      <IconAlertTriangle className="h-4 w-4" strokeWidth={2} />
                      <AlertTitle_Shadcn_>
                        Vercel Integration is already installed.
                      </AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_>
                        You will need to choose another organization to install the integration.
                      </AlertDescription_Shadcn_>
                    </Alert_Shadcn_>
                  )}
                  <div className="flex flex-row w-full justify-end">
                    <Button
                      size="medium"
                      className="self-end"
                      disabled={disableInstallationForm}
                      loading={isLoadingVercelIntegrationCreateMutation}
                      onClick={onInstall}
                    >
                      Install integration
                    </Button>
                  </div>
                </>
              </ScaffoldColumn>
            </ScaffoldContainer>
            <ScaffoldContainer className="flex flex-col gap-6 py-3">
              <Alert_Shadcn_ variant="default">
                <IconInfo className="h-4 w-4" strokeWidth={2} />
                <AlertTitle_Shadcn_>
                  You can uninstall this Integration at any time.
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  Remove this integration at any time via Vercel or the Supabase dashboard.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
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

VercelIntegration.getLayout = (page) => <IntegrationWindowLayout>{page}</IntegrationWindowLayout>

export interface OrganizationPickerProps {
  label?: string
  onSelectedOrgChange: (slug: string) => void
  integrationName: IntegrationName
  dataLoading: boolean
  organizationsWithInstalledData: OrganizationsResponseWithInstalledData[]
  selectedOrg: OrganizationsResponseWithInstalledData | null
}

const OrganizationPicker = ({
  label = 'Choose an organization',
  onSelectedOrgChange,
  selectedOrg,
  dataLoading,
  organizationsWithInstalledData,
}: OrganizationPickerProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  return (
    <>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            ref={ref}
            type="default"
            size="medium"
            block
            className="justify-start"
            icon={<IconHexagon />}
            loading={dataLoading}
            disabled={dataLoading}
            iconRight={
              <span className="grow flex justify-end">
                <IconChevronDown className={''} />
              </span>
            }
          >
            <span className="flex gap-2">
              <span className="truncate">{selectedOrg?.name}</span>
              {selectedOrg?.installationInstalled && (
                <Badge color="scale">Integration Installed</Badge>
              )}
            </span>
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_
          className="p-0 w-full"
          side="bottom"
          align="center"
          style={{ width: ref.current?.offsetWidth }}
        >
          <Command_Shadcn_>
            <CommandInput_Shadcn_ placeholder="Search organization..." />
            <CommandList_Shadcn_>
              <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                {organizationsWithInstalledData?.map((org) => {
                  return (
                    <CommandItem_Shadcn_
                      value={org.slug}
                      key={org.slug}
                      className="flex gap-2 items-center"
                      onSelect={(slug) => {
                        if (slug) onSelectedOrgChange(slug)
                        setOpen(false)
                      }}
                    >
                      <IconHexagon />
                      <span className="truncate">{org.name}</span>{' '}
                      {org?.installationInstalled && (
                        <Badge color="scale" className="!flex-none">
                          Integration Installed
                        </Badge>
                      )}
                    </CommandItem_Shadcn_>
                  )
                })}
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </>
  )
}

export default VercelIntegration
