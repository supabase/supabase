import { useParams } from 'common'
import PartnerIcon from 'components/ui/PartnerIcon'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Boxes, Check, ChevronsUpDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

export function OrgSelector() {
  const router = useRouter()
  const { slug: routeSlug } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: organizations, isPending: isLoadingOrganizations } = useOrganizationsQuery()
  const organizationCreationEnabled = useIsFeatureEnabled('organizations:create')

  const [open, setOpen] = useState(false)

  const slug = selectedOrganization?.slug
  const selectedOrgInitial = selectedOrganization?.name?.trim().charAt(0).toUpperCase() || 'O'
  const { data: projects } = useOrgProjectsInfiniteQuery(
    { slug, limit: 1 },
    { enabled: Boolean(slug) }
  )

  const numProjects = projects?.pages[0]?.pagination.count
  const projectsLabel =
    typeof numProjects === 'number'
      ? `${numProjects} project${numProjects === 1 ? '' : 's'}`
      : 'No projects'

  if (isLoadingOrganizations) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="px-2 py-2">
            <ShimmeringLoader className="w-full py-3" />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger_Shadcn_ asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground gap-2 h-auto text-left group px-1.5 py-1"
            >
              <span className="flex w-8 aspect-square shrink-0 items-center justify-center rounded border bg-surface-100 text-xs font-medium text-foreground-lighter">
                {selectedOrgInitial}
              </span>
              <div className="text-left min-w-0 -mb-0.5">
                <div className="truncate text-foreground font-medium leading-tight -mb-0.5">
                  {selectedOrganization?.name ?? 'Select organization'}
                </div>
                <div className="flex items-center gap-1 truncate text-foreground-light leading-tight">
                  <Boxes size={12} />
                  <span>{projectsLabel}</span>
                </div>
              </div>
              <ChevronsUpDown
                strokeWidth={1}
                className="ml-auto text-foreground-light hidden group-hover:block !w-4 !h-4"
              />
            </SidebarMenuButton>
          </PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
            <Command_Shadcn_>
              <CommandInput_Shadcn_ placeholder="Find organization..." />
              <CommandList_Shadcn_>
                <CommandEmpty_Shadcn_>No organizations found</CommandEmpty_Shadcn_>
                <CommandGroup_Shadcn_>
                  <ScrollArea className={(organizations || []).length > 7 ? 'h-[210px]' : ''}>
                    {organizations?.map((org) => {
                      const href = routeSlug
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
                    onSelect={() => {
                      setOpen(false)
                      router.push('/organizations')
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
                        onSelect={() => {
                          setOpen(false)
                          router.push('/new')
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
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
