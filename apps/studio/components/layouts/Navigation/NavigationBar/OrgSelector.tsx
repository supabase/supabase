import { useBreakpoint, useParams } from 'common'
import { Boxes, ChevronsUpDown, Plus } from 'lucide-react'
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

import { OrgSelectorSheet } from './OrgSelectorSheet'
import { OrgCommandItem } from '@/components/layouts/AppLayout/OrgCommandItem'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export function OrgSelector() {
  const router = useRouter()
  const { slug: routeSlug } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: organizations, isPending: isLoadingOrganizations } = useOrganizationsQuery()
  const organizationCreationEnabled = useIsFeatureEnabled('organizations:create')

  const [open, setOpen] = useState(false)

  const slug = selectedOrganization?.slug
  const isPlatformOrg = selectedOrganization?.plan?.id === 'platform'
  const selectedOrgInitial = selectedOrganization?.name?.trim().charAt(0).toUpperCase() || 'O'
  const { data: projects } = useOrgProjectsInfiniteQuery(
    { slug, limit: 1 },
    { enabled: Boolean(slug) && !isPlatformOrg }
  )

  const numProjects = projects?.pages[0]?.pagination.count
  const projectsLabel = isPlatformOrg
    ? 'Platform'
    : typeof numProjects === 'number'
      ? `${numProjects} project${numProjects === 1 ? '' : 's'}`
      : 'No projects'

  const isMobile = useBreakpoint('md')

  if (isLoadingOrganizations) return <ShimmeringLoader className="ml-1 w-[120px]" />

  const triggerButton = (
    <SidebarMenuButton
      size="lg"
      className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground gap-2 h-auto text-left group px-1.5 py-1 touch-manipulation"
      onClick={isMobile ? () => setOpen(true) : undefined}
    >
      <span className="flex w-8 aspect-square shrink-0 items-center justify-center rounded-sm border bg-surface-100 text-xs font-medium text-foreground-lighter">
        {selectedOrgInitial}
      </span>
      <div className="flex min-w-0 flex-1 flex-col text-left -mb-0.5">
        <div className="truncate text-foreground font-medium leading-tight min-w-[100px] max-w-[250px]">
          {selectedOrganization?.name ?? 'Select organization'}
        </div>
        {selectedOrganization && (
          <div className="flex items-center gap-1 truncate text-foreground-light leading-tight text-xs">
            <Boxes className="shrink-0 size-3" strokeWidth={1.5} />
            <span>{projectsLabel}</span>
          </div>
        )}
      </div>
      <ChevronsUpDown
        strokeWidth={1}
        className="ml-auto text-foreground-light md:hidden md:group-hover:block w-4! h-4!"
      />
    </SidebarMenuButton>
  )

  if (isMobile) {
    return (
      <>
        <SidebarMenu className="shrink">
          <SidebarMenuItem>
            {isLoadingOrganizations ? <ShimmeringLoader className="p-2 w-[90px]" /> : triggerButton}
          </SidebarMenuItem>
        </SidebarMenu>
        <OrgSelectorSheet
          open={open}
          onOpenChange={setOpen}
          onClose={() => setOpen(false)}
          selectedOrganization={selectedOrganization ?? null}
        />
      </>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
          <PopoverTrigger_Shadcn_ asChild>{triggerButton}</PopoverTrigger_Shadcn_>
          <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
            <Command_Shadcn_>
              <CommandInput_Shadcn_ placeholder="Find organization..." />
              <CommandList_Shadcn_>
                <CommandEmpty_Shadcn_>No organizations found</CommandEmpty_Shadcn_>
                <CommandGroup_Shadcn_>
                  <ScrollArea
                    className={(organizations || []).length > 7 ? 'h-full md:h-[210px]' : ''}
                  >
                    {organizations?.map((org) => (
                      <OrgCommandItem
                        key={org.slug}
                        org={org}
                        selectedSlug={slug}
                        routePathname={router.pathname}
                        hasRouteSlug={!!routeSlug}
                        onClose={() => setOpen(false)}
                      />
                    ))}
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
