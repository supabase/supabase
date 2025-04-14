import { Boxes, Check, ChevronsUpDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import { useNewLayout } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import PartnerIcon from 'components/ui/PartnerIcon'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
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
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  cn,
} from 'ui'

const OrganizationDropdown = () => {
  const newLayoutPreview = useNewLayout()

  const router = useRouter()
  const { slug: routeSlug } = useParams()
  const selectedOrganization = useSelectedOrganization()
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
      {newLayoutPreview && (
        <Link href={`/org/${slug}`} className="flex items-center gap-2 flex-shrink-0 text-sm">
          <Boxes size={14} strokeWidth={1.5} className="text-foreground-lighter" />
          <span className="text-foreground max-w-32 lg:max-w-none truncate hidden md:block">
            {orgName}
          </span>
          <Badge variant="default">{selectedOrganization?.plan.name}</Badge>
        </Link>
      )}
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          {newLayoutPreview ? (
            <Button
              type="text"
              className={cn('px-0.25 [&_svg]:w-5 [&_svg]:h-5 ml-1')}
              iconRight={<ChevronsUpDown strokeWidth={1.5} />}
            />
          ) : (
            <Button type="text" className="pr-2" iconRight={<ChevronsUpDown />}>
              <div className="flex items-center space-x-2">
                <p className={'text-xs'}>{orgName}</p>
                <Badge variant="default">{selectedOrganization?.plan.name}</Badge>
              </div>
            </Button>
          )}
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
              {newLayoutPreview && (
                <>
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
                </>
              )}
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

export default OrganizationDropdown
