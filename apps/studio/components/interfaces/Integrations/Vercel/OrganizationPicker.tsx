import { ChevronDown } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import {
  Badge,
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

import { getHasInstalledObject } from '@/components/layouts/IntegrationsLayout/Integrations.utils'
import PartnerIcon from '@/components/ui/PartnerIcon'
import { useIntegrationsQuery } from '@/data/integrations/integrations-query'
import type { IntegrationName } from '@/data/integrations/integrations.types'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import type { Organization } from '@/types'

export interface OrganizationPickerProps {
  integrationName: IntegrationName
  configurationId?: string
  selectedOrg: Organization | null
  onSelectedOrgChange: (organization: Organization) => void
  disabled?: boolean
}

const OrganizationPicker = ({
  integrationName,
  configurationId,
  selectedOrg,
  onSelectedOrgChange,
  disabled,
}: OrganizationPickerProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)

  const { data: integrationData } = useIntegrationsQuery()
  const { data: organizationsData, isPending: isLoadingOrganization } = useOrganizationsQuery()

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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="default"
            size="medium"
            block
            className="justify-start"
            loading={isLoadingOrganization}
            disabled={disabled}
            iconRight={
              <span className="grow flex justify-end">
                <ChevronDown />
              </span>
            }
          >
            <div className="flex gap-2">
              <span className={cn('truncate', !selectedOrg && 'text-foreground-light')}>
                {selectedOrg?.name ? selectedOrg?.name : 'Choose an organization'}
              </span>
              {selectedOrg && configurationId && installed[selectedOrg.slug] && (
                <Badge>Integration Installed</Badge>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-full" side="bottom" align="center" sameWidthAsTrigger>
          <Command>
            <CommandInput placeholder="Search organizations..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {organizationsData?.map((org) => {
                  return (
                    <CommandItem
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
                      <PartnerIcon organization={org} />
                      <span className="truncate">{org.name}</span>{' '}
                      {configurationId && installed[org.slug] && (
                        <Badge className="flex-none!">Integration Installed</Badge>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}

export default OrganizationPicker
