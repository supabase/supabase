import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useState } from 'react'
import { Organization } from 'types'
import { Listbox } from 'ui'

export interface OrganizationPickerProps {
  label?: string
  onSelectedOrgChange?: (org: Organization) => void
}

const OrganizationPicker = ({
  label = 'Choose an organization',
  onSelectedOrgChange,
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

  if (isLoading) {
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
      {data?.map((org) => {
        return (
          <Listbox.Option key={org.id} value={org.slug} label={org.name}>
            {org.name}
          </Listbox.Option>
        )
      })}
    </Listbox>
  )
}

export default OrganizationPicker
