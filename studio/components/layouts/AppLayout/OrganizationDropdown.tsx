import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Badge,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconCode,
  IconPlus,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useFlag, useSelectedOrganization } from 'hooks'

const OrganizationDropdown = () => {
  const router = useRouter()
  const orgCreationV2 = useFlag('orgcreationv2')
  const selectedOrganization = useSelectedOrganization()
  const { data: organizations, isLoading: isLoadingOrganizations } = useOrganizationsQuery()

  const slug = selectedOrganization?.slug
  const orgName = selectedOrganization?.name
  const { data, isSuccess } = useOrgSubscriptionQuery({ orgSlug: slug })

  const [open, setOpen] = useState(false)

  if (isLoadingOrganizations) {
    return <ShimmeringLoader className="w-[90px]" />
  }

  return (
    <div className="flex items-center space-x-2 px-2">
      <Link href={`/org/${slug}`}>
        <a className="flex items-center space-x-2">
          <p className="text-sm">{orgName}</p>
          {isSuccess && <Badge color="slate">{data?.plan.name}</Badge>}
        </a>
      </Link>

      <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="text"
            className="px-1"
            icon={<IconCode className="text-scale-1100 rotate-90" strokeWidth={2} size={12} />}
          />
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
          <Command_Shadcn_>
            <CommandInput_Shadcn_ placeholder="Find organization..." />
            <CommandList_Shadcn_>
              <CommandEmpty_Shadcn_>No results found.</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                {organizations?.map((org) => {
                  const href = router.pathname.includes('[slug]')
                    ? router.pathname.replace('[slug]', org.slug)
                    : router.pathname.includes('[ref]/settings')
                    ? `/org/${org.slug}/general`
                    : `/org/${org.slug}`
                  return (
                    <CommandItem_Shadcn_
                      key={org.slug}
                      value={org.name}
                      className="cursor-pointer"
                      onSelect={() => {
                        setOpen(false)
                      }}
                    >
                      <Link passHref href={href}>
                        <a className="w-full">{org.name}</a>
                      </Link>
                    </CommandItem_Shadcn_>
                  )
                })}
              </CommandGroup_Shadcn_>
              <CommandGroup_Shadcn_ className="border-t">
                <CommandItem_Shadcn_ className="cursor-pointer" onSelect={() => setOpen(false)}>
                  <Link passHref href={orgCreationV2 ? `/new-with-subscription` : `/new`}>
                    <a className="flex items-center space-x-2 w-full">
                      <IconPlus size={14} strokeWidth={1.5} />
                      <p>New organization</p>
                    </a>
                  </Link>
                </CommandItem_Shadcn_>
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  )
}

export default OrganizationDropdown
