import { Boxes, Check, ChevronsUpDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import PartnerIcon from 'components/ui/PartnerIcon'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import {
  Badge,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  cn,
} from 'ui'

export const OrganizationDropdown = () => {
  const router = useRouter()
  const { slug: routeSlug } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: organizations, isLoading: isLoadingOrganizations } = useOrganizationsQuery()

  const organizationCreationEnabled = useIsFeatureEnabled('organizations:create')

  const slug = selectedOrganization?.slug
  const orgName = selectedOrganization?.name

  const [open, setOpen] = useState(false)

  if (isLoadingOrganizations) {
    return <ShimmeringLoader className="w-[90px]" />
  }

  return (
    <>
      <Link
        href={slug ? `/org/${slug}` : '/organizations'}
        className="flex items-center gap-2 flex-shrink-0 text-sm"
      >
        <Boxes size={14} strokeWidth={1.5} className="text-foreground-lighter" />
        <span
          className={cn(
            'max-w-32 lg:max-w-none truncate hidden md:block',
            !!selectedOrganization ? 'text-foreground' : 'text-foreground-lighter'
          )}
        >
          {orgName ?? 'Select an organization'}
        </span>
        {!!selectedOrganization && (
          <Badge variant="default">{selectedOrganization?.plan.name}</Badge>
        )}
      </Link>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="text"
            className={cn('px-1.5 py-4 [&_svg]:w-5 [&_svg]:h-5 ml-1')}
            iconRight={<ChevronsUpDown strokeWidth={1.5} />}
          />
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
          <Command_Shadcn_>
            <CommandInput_Shadcn_ placeholder="Find organization..." />
            <CommandList_Shadcn_>
              <CommandEmpty_Shadcn_>No organizations found</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                <ScrollArea className={(organizations || []).length > 7 ? 'h-[210px]' : ''}>
                  {organizations?.map((org) => {
                    const href = !!routeSlug
                      ? router.pathname.replace('[slug]', org.slug)
                      : `/org/${org.slug}`

                    return (
                      <CommandItem_Shadcn_
                        key={org.slug}
                        value={`${org.name.replaceAll('"', '')} - ${org.slug}`}
                        className="cursor-pointer w-full"
                        onSelect={() => {
                          setOpen(false)
                          router.push(href)
                        }}
                        onClick={() => setOpen(false)}
                      >
                        <Link href={href} className="w-full flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{org.name}</span>
                            <PartnerIcon organization={org} />
                          </div>
                          {org.slug === slug && <Check size={16} />}
                        </Link>
                      </CommandItem_Shadcn_>
                    )
                  })}
                </ScrollArea>
              </CommandGroup_Shadcn_>
              <CommandSeparator_Shadcn_ />
              <CommandGroup_Shadcn_>
                <CommandItem_Shadcn_
                  className="cursor-pointer w-full"
                  onSelect={(e) => {
                    setOpen(false)
                    router.push(`/organizations`)
                  }}
                  onClick={() => setOpen(false)}
                >
                  <Link href="/organizations" className="flex items-center gap-2 w-full">
                    <p>All Organizations</p>
                  </Link>
                </CommandItem_Shadcn_>
              </CommandGroup_Shadcn_>
              {organizationCreationEnabled && (
                <>
                  <CommandSeparator_Shadcn_ />
                  <CommandGroup_Shadcn_>
                    <CommandItem_Shadcn_
                      className="cursor-pointer w-full"
                      onSelect={(e) => {
                        setOpen(false)
                        router.push(`/new`)
                      }}
                      onClick={() => setOpen(false)}
                    >
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
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </>
  )
}
