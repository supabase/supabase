import { ChevronDownIcon } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  CheckIcon,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { Organization } from '@/types'

export const OrganizationSelect = ({
  organization: selectedOrganization,
  onOrganizationChange,
}: {
  organization: Organization
  onOrganizationChange: (slug: string) => void
}) => {
  const [open, setOpen] = useState(false)
  const { data } = useOrganizationsQuery()

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="organization" className="text-foreground text-sm">
        Organization
      </Label>
      <Popover open={open} onOpenChange={(open) => setOpen(open)}>
        <PopoverTrigger asChild>
          <Button
            id="organization"
            aria-expanded={open}
            data-state={open ? 'open' : 'closed'}
            type="button"
            role="combobox"
            className="justify-between"
            size="small"
            iconRight={<ChevronDownIcon />}
          >
            {selectedOrganization.name}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-(--radix-popover-trigger-width) p-0">
          <Command>
            <CommandInput placeholder="Search organization..." />
            <CommandList>
              <CommandEmpty>No organization found.</CommandEmpty>
              <CommandGroup>
                {(data ?? []).map((organization) => (
                  <CommandItem
                    key={organization.id}
                    value={organization.slug}
                    keywords={[organization.name]}
                    onSelect={() => {
                      onOrganizationChange(organization.slug)
                      setOpen(false)
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedOrganization.slug === organization.slug
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {organization.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
