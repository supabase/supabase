import { getHasInstalledObject } from 'components/layouts/IntegrationsLayout/Integrations.utils'
import { useIntegrationsQuery } from 'data/integrations/integrations-query'
import { IntegrationName } from 'data/integrations/integrations.types'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useMemo, useRef, useState } from 'react'

import { Organization } from 'types'
import {
  Badge,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconChevronDown,
  IconHexagon,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

export interface OrganizationPickerProps {
  integrationName: IntegrationName
  configurationId?: string
  selectedOrg: Organization | null
  onSelectedOrgChange: (organization: Organization) => void
}

const OrganizationPicker = ({
  integrationName,
  configurationId,
  selectedOrg,
  onSelectedOrgChange,
}: OrganizationPickerProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  const { data: integrationData } = useIntegrationsQuery()
  const { data: organizationsData, isLoading: isLoadingOrganization } = useOrganizationsQuery()

  const installed = useMemo(
    () =>
      integrationData && organizationsData
        ? getHasInstalledObject({
            integrationName,
            integrationData,
            organizationsData,
            installationId: configurationId,
          })
        : {},
    [configurationId, integrationData, integrationName, organizationsData]
  )

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
            loading={isLoadingOrganization}
            disabled={isLoadingOrganization}
            iconRight={
              <span className="grow flex justify-end">
                <IconChevronDown className={''} />
              </span>
            }
          >
            <span className="flex gap-2">
              <span className="truncate">{selectedOrg?.name}</span>
              {selectedOrg && configurationId && installed[selectedOrg.slug] && (
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
            <CommandInput_Shadcn_ placeholder="Search organizations..." />
            <CommandList_Shadcn_>
              <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                {organizationsData?.map((org) => {
                  return (
                    <CommandItem_Shadcn_
                      value={org.slug}
                      key={org.slug}
                      className="flex gap-2 items-center"
                      onSelect={(slug) => {
                        const org = organizationsData?.find(
                          (org) => org.slug.toLowerCase() === slug.toLowerCase()
                        )
                        if (org) {
                          onSelectedOrgChange(org)
                        }

                        setOpen(false)
                      }}
                    >
                      <IconHexagon />
                      <span className="truncate">{org.name}</span>{' '}
                      {configurationId && installed[org.slug] && (
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

export default OrganizationPicker
