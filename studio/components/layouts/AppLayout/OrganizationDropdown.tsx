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
  IconCheck,
  IconCode,
  IconPlus,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'

import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks'

interface OrganizationDropdownProps {
  isNewNav?: boolean
}

const OrganizationDropdown = ({ isNewNav = false }: OrganizationDropdownProps) => {
  const router = useRouter()
  const selectedOrganization = useSelectedOrganization()
  const { data: organizations, isLoading: isLoadingOrganizations } = useOrganizationsQuery()

  const slug = selectedOrganization?.slug
  const orgName = selectedOrganization?.name
  const isOrgBilling = !!selectedOrganization?.subscription_id
  const { data: subscription, isSuccess } = useOrgSubscriptionQuery(
    { orgSlug: slug },
    { enabled: isOrgBilling }
  )

  const [open, setOpen] = useState(false)

  if (isLoadingOrganizations) {
    return <ShimmeringLoader className="w-[90px]" />
  }

  return (
    <div className="flex items-center px-2">
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <div className="flex items-center space-x-2 cursor-pointer">
            <Button
              type="text"
              className="pr-2"
              iconRight={
                <IconCode className="text-foreground-light rotate-90" strokeWidth={2} size={12} />
              }
            >
              <div className="flex items-center space-x-2">
                <p className={isNewNav ? 'text-sm' : 'text-xs'}>{orgName}</p>
                {isSuccess && <Badge color="scale">{subscription?.plan.name}</Badge>}
              </div>
            </Button>
          </div>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
          <Command_Shadcn_>
            <CommandInput_Shadcn_ placeholder="Find organization..." />
            <CommandList_Shadcn_>
              <CommandEmpty_Shadcn_>No organizations found</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                <ScrollArea className={(organizations || []).length > 7 ? 'h-[210px]' : ''}>
                  {organizations?.map((org) => {
                    const href = router.pathname.includes('[slug]')
                      ? router.pathname.replace('[slug]', org.slug)
                      : isNewNav
                      ? `/org/${org.slug}`
                      : `/org/${org.slug}/general`
                    return (
                      <Link passHref href={href} key={org.slug}>
                        <CommandItem_Shadcn_
                          asChild
                          value={`${org.name} - ${org.slug}`}
                          className="cursor-pointer w-full flex items-center justify-between"
                          onSelect={() => {
                            setOpen(false)
                            router.push(href)
                          }}
                          onClick={() => setOpen(false)}
                        >
                          <a>
                            {org.name}
                            {org.slug === slug && <IconCheck />}
                          </a>
                        </CommandItem_Shadcn_>
                      </Link>
                    )
                  })}
                </ScrollArea>
              </CommandGroup_Shadcn_>
              <CommandGroup_Shadcn_ className="border-t">
                <Link passHref href="/new">
                  <CommandItem_Shadcn_
                    asChild
                    className="cursor-pointer flex items-center space-x-2 w-full"
                    onSelect={(e) => {
                      setOpen(false)
                      router.push(`/new`)
                    }}
                    onClick={() => setOpen(false)}
                  >
                    <a>
                      <IconPlus size={14} strokeWidth={1.5} />
                      <p>New organization</p>
                    </a>
                  </CommandItem_Shadcn_>
                </Link>
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  )
}

export default OrganizationDropdown
