import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { IntegrationName } from 'data/integrations/integrations.types'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useState } from 'react'
import { Organization } from 'types'
import { Badge, IconHexagon, Listbox } from 'ui'

export interface OrganizationPickerProps {
  label?: string
  onSelectedOrgChange?: (org: Organization) => void
  integrationName: IntegrationName
}

const OrganizationPicker = ({
  label = 'Choose an organization',
  onSelectedOrgChange,
  integrationName,
}: OrganizationPickerProps) => {
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)

  /**
   * array of integrations installed on all
   */
  const { data: integrationData, isLoading: integrationDataLoading } = useIntegrationsQuery()

  /**
   * filter integrations to match integrationName
   */
  const vercelIntegrationsInstalled = integrationData?.filter(
    (integration) => integration.integration.name === 'Vercel'
  )

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

  if (isLoading || integrationDataLoading) {
    return (
      <Listbox label={label} value="loading" disabled>
        <Listbox.Option key="loading" value="loading" label="Loading...">
          Loading...
        </Listbox.Option>
      </Listbox>
    )
  }

  /**
   * Organization type with `installationInstalled` added
   */
  interface OrganizationsResponseWithInstalledData extends Organization {
    installationInstalled?: boolean
  }

  /**
   * A flat array of org slugs that have integration installed
   */
  const flatInstalledConnectionsIds =
    integrationData && integrationData.length > 0
      ? integrationData?.map((x) => x.organization.slug)
      : []

  /**
   * Organizations with extra `installationInstalled` attribute
   * Used to show label/badge and allow/disallow installing
   */
  const organizationsWithInstalledData: OrganizationsResponseWithInstalledData[] = data
    ? data.map((org) => {
        return {
          ...org,
          installationInstalled: !flatInstalledConnectionsIds.includes(org.slug) ? true : false,
        }
      })
    : []

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

export default OrganizationPicker
