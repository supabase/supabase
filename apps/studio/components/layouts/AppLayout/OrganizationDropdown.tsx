import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
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
  IconCheck,
  IconPlus,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
} from 'ui'
import { ChevronsUpDown } from 'lucide-react'

interface OrganizationDropdownProps {
  isNewNav?: boolean
}

const OrganizationDropdown = ({ isNewNav = false }: OrganizationDropdownProps) => {
  const router = useRouter()
  const selectedOrganization = useSelectedOrganization()
  const { data: organizations, isLoading: isLoadingOrganizations } = useOrganizationsQuery()

  const organizationCreationEnabled = useIsFeatureEnabled('organizations:create')

  const slug = selectedOrganization?.slug
  const orgName = selectedOrganization?.name
  const { data: subscription, isSuccess } = useOrgSubscriptionQuery({ orgSlug: slug })

  const [open, setOpen] = useState(false)

  if (isLoadingOrganizations) {
    return <ShimmeringLoader className="w-[90px]" />
  }

  return (
    <div className="flex items-center px-2 py-1">
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <div className="flex items-center space-x-2 cursor-pointer">
            <Button type="text" className="pr-2" iconRight={<ChevronsUpDown />}>
              <div className="flex items-center space-x-2">
                <p className={isNewNav ? 'text-sm' : 'text-xs'}>{orgName}</p>
                {isSuccess && <Badge variant="default">{subscription?.plan.name}</Badge>}
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
                          {org.name}
                          {org.slug === slug && <IconCheck />}
                        </Link>
                      </CommandItem_Shadcn_>
                    )
                  })}
                </ScrollArea>
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
                        <IconPlus size={14} strokeWidth={1.5} />
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
    </div>
  )
}

export default OrganizationDropdown
