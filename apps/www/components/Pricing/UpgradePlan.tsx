'use client'

import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { PlanId } from 'shared-data/plans'

import {
  Button,
  ButtonProps,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  DialogTrigger,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'
import { Organization } from '~/data/organizations'

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
        <Button block size={size} type="primary" onClick={onClick}>
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
          <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
            <PopoverTrigger_Shadcn_ asChild>
              <Button
                type="default"
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
            </PopoverTrigger_Shadcn_>
            <PopoverContent_Shadcn_ className="w-[300px] p-0">
              <Command_Shadcn_>
                <CommandInput_Shadcn_ placeholder="Select organization..." />
                <CommandList_Shadcn_>
                  <CommandEmpty_Shadcn_>No organizations found.</CommandEmpty_Shadcn_>
                  <CommandGroup_Shadcn_>
                    {organizations.map((organization) => (
                      <CommandItem_Shadcn_
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
                      </CommandItem_Shadcn_>
                    ))}
                  </CommandGroup_Shadcn_>
                  <CommandSeparator_Shadcn_ />
                  <CommandGroup_Shadcn_>
                    <CommandItem_Shadcn_
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
                    </CommandItem_Shadcn_>
                  </CommandGroup_Shadcn_>
                </CommandList_Shadcn_>
              </Command_Shadcn_>
            </PopoverContent_Shadcn_>
          </Popover_Shadcn_>
        </DialogSection>

        <DialogSection>
          <DialogDescription className="text-xs">
            Upon continuing, you will be redirected to the organization&apos;s billing page where
            you can upgrade to a paid plan.
          </DialogDescription>
        </DialogSection>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="outline">Cancel</Button>
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
