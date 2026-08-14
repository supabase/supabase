'use client'

import { Organization } from '~/data/organizations'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PlanId } from 'shared-data/plans'
import {
  Button,
  ButtonProps,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

interface UpgradePlanProps {
  organizations?: Organization[]
  onClick?: () => void
  size?: ButtonProps['size']
  planId: PlanId
}

const UpgradePlan = ({ organizations = [], onClick, size = 'large', planId }: UpgradePlanProps) => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button block size={size} variant="primary" onClick={onClick}>
          Upgrade now
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="pb-3">
          <DialogTitle>Upgrade organization</DialogTitle>
          <DialogDescription>
            Choose the organization you want to upgrade to a paid plan.
          </DialogDescription>
        </DialogHeader>

        <DialogSection className="py-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="default"
                role="combobox"
                size={'small'}
                aria-expanded={open}
                className="w-full justify-between"
                iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
              >
                {value === 'new-organization' ? (
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New organization
                  </span>
                ) : value ? (
                  organizations.find((organization) => organization.slug === value)?.name
                ) : (
                  'Select an organization...'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput placeholder="Select organization..." />
                <CommandList>
                  <CommandEmpty>No organizations found.</CommandEmpty>
                  <CommandGroup>
                    {organizations.map((organization) => (
                      <CommandItem
                        key={organization.slug}
                        value={organization.slug}
                        onSelect={(currentValue) => {
                          setValue(currentValue === value ? '' : currentValue)
                          setOpen(false)
                        }}
                        keywords={[organization.name]}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            value === organization.slug ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {organization.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      value="new-organization"
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? '' : currentValue)
                        setOpen(false)
                      }}
                      keywords={['Create a new organization']}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === 'new-organization' ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <Plus className="h-4 w-4 mr-2" /> Create a new organization
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </DialogSection>

        <DialogSection>
          <DialogDescription className="text-xs">
            Upon continuing, you will be redirected to the organization&apos;s billing page where
            you can upgrade to a paid plan.
          </DialogDescription>
        </DialogSection>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button disabled={!value} asChild>
            <Link
              href={
                value === 'new-organization'
                  ? `/dashboard/new?plan=${planId}`
                  : `/dashboard/org/${value}/billing?panel=subscriptionPlan`
              }
            >
              Continue
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UpgradePlan
