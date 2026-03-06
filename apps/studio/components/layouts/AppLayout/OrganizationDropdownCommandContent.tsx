import PartnerIcon from 'components/ui/PartnerIcon'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import type { Organization } from 'types'
import {
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  ScrollArea,
} from 'ui'

import { OrgCommandItem } from './OrgCommandItem'

export interface OrganizationDropdownCommandContentProps {
  embedded: boolean
  className?: string
  organizations: Organization[]
  selectedSlug: string | undefined
  routePathname: string
  hasRouteSlug: boolean
  organizationCreationEnabled: boolean
  onClose: () => void
}

export function OrganizationDropdownCommandContent({
  embedded,
  className,
  organizations,
  selectedSlug,
  routePathname,
  hasRouteSlug,
  organizationCreationEnabled,
  onClose,
}: OrganizationDropdownCommandContentProps) {
  const orgList = (
    <>
      {organizations?.map((org) => (
        <OrgCommandItem
          key={org.slug}
          org={org}
          selectedSlug={selectedSlug}
          routePathname={routePathname}
          hasRouteSlug={hasRouteSlug}
          onClose={onClose}
          compactPadding={!embedded}
        />
      ))}
    </>
  )

  if (embedded) {
    return (
      <Command_Shadcn_ className={cn(className, 'flex flex-col flex-1 min-h-0 overflow-hidden')}>
        <div className="flex items-center gap-2 shrink-0 border-b p-2">
          <Button type="text" block size="small" asChild>
            <Link
              href="/organizations"
              className="text-xs text-foreground-light hover:text-foreground"
              onClick={onClose}
            >
              All Organizations
            </Link>
          </Button>
          {organizationCreationEnabled && (
            <Button
              type="default"
              block
              size="small"
              asChild
              icon={<Plus size={14} strokeWidth={1.5} />}
            >
              <Link
                href="/new"
                className="text-xs text-foreground-light hover:text-foreground"
                onClick={onClose}
              >
                New organization
              </Link>
            </Button>
          )}
        </div>
        <CommandInput_Shadcn_
          placeholder="Find organization..."
          wrapperClassName="shrink-0"
          className="text-base sm:text-sm"
        />
        <CommandList_Shadcn_ className="flex flex-col flex-1 min-h-0 overflow-y-auto p-1 !max-h-none">
          <CommandEmpty_Shadcn_>No organizations found</CommandEmpty_Shadcn_>
          <CommandGroup_Shadcn_ className="min-h-0">{orgList}</CommandGroup_Shadcn_>
        </CommandList_Shadcn_>
      </Command_Shadcn_>
    )
  }

  return (
    <Command_Shadcn_ className={className}>
      <CommandInput_Shadcn_ placeholder="Find organization..." />
      <CommandList_Shadcn_>
        <CommandEmpty_Shadcn_>No organizations found</CommandEmpty_Shadcn_>
        <CommandGroup_Shadcn_>
          <ScrollArea className={(organizations || []).length > 7 ? 'md:h-[210px]' : ''}>
            {orgList}
          </ScrollArea>
        </CommandGroup_Shadcn_>
        <CommandSeparator_Shadcn_ />
        <CommandGroup_Shadcn_>
          <CommandItem_Shadcn_ className="cursor-pointer w-full" onSelect={() => onClose()}>
            <Link href="/organizations" className="flex items-center gap-2 w-full">
              All Organizations
            </Link>
          </CommandItem_Shadcn_>
        </CommandGroup_Shadcn_>
        {organizationCreationEnabled && (
          <>
            <CommandSeparator_Shadcn_ />
            <CommandGroup_Shadcn_>
              <CommandItem_Shadcn_ className="cursor-pointer w-full" onSelect={() => onClose()}>
                <Link href="/new" className="flex items-center gap-2 w-full">
                  <Plus size={14} strokeWidth={1.5} />
                  <p>New organization</p>
                </Link>
              </CommandItem_Shadcn_>
            </CommandGroup_Shadcn_>
          </>
        )}
      </CommandList_Shadcn_>
    </Command_Shadcn_>
  )
}
