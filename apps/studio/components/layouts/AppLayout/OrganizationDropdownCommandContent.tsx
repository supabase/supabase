import { Plus } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  cn,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  ScrollArea,
} from 'ui'

import { OrgCommandItem } from './OrgCommandItem'
import type { Organization } from '@/types'

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
      <Command className={cn(className, 'flex flex-col flex-1 min-h-0 overflow-hidden')}>
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
        <CommandInput
          placeholder="Find organization..."
          wrapperClassName="shrink-0"
          className="text-base sm:text-sm"
        />
        <CommandList className="flex flex-col flex-1 min-h-0 overflow-y-auto p-1 max-h-none!">
          <CommandEmpty>No organizations found</CommandEmpty>
          <CommandGroup className="min-h-0">{orgList}</CommandGroup>
        </CommandList>
      </Command>
    )
  }

  return (
    <Command className={className}>
      <CommandInput placeholder="Find organization..." />
      <CommandList>
        <CommandEmpty>No organizations found</CommandEmpty>
        <CommandGroup>
          <ScrollArea className={(organizations || []).length > 7 ? 'md:h-[210px]' : ''}>
            {orgList}
          </ScrollArea>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup>
          <CommandItem className="cursor-pointer w-full" onSelect={() => onClose()}>
            <Link href="/organizations" className="flex items-center gap-2 w-full">
              All Organizations
            </Link>
          </CommandItem>
        </CommandGroup>
        {organizationCreationEnabled && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem className="cursor-pointer w-full" onSelect={() => onClose()}>
                <Link href="/new" className="flex items-center gap-2 w-full">
                  <Plus size={14} strokeWidth={1.5} />
                  <p>New organization</p>
                </Link>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  )
}
