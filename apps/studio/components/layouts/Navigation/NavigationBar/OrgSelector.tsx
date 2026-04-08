import { useBreakpoint, useParams } from 'common'
import { Boxes, ChevronsUpDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import {
  cn,
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
import { useIsNavigationV2Enabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { OrgCommandItem } from '@/components/layouts/AppLayout/OrgCommandItem'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export function OrgSelector({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const router = useRouter()
  const { slug: routeSlug } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: organizations, isPending: isLoadingOrganizations } = useOrganizationsQuery()
  const organizationCreationEnabled = useIsFeatureEnabled('organizations:create')
  const isNavigationV2 = useIsNavigationV2Enabled()

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

  if (isLoadingOrganizations)
    return (
      <ShimmeringLoader
        className={cn(
          'ml-1 w-[120px]',
          isNavigationV2 && 'ml-0 h-10 w-full rounded-md',
          isCollapsed && 'min-w-0 max-w-full'
        )}
      />
    )

  const collapsedTooltipContent = isCollapsed ? (
    <div className="max-w-[280px] text-left text-sm">
      <div className="flex min-w-0 flex-1 flex-col pl-0.5 pr-1 text-left">
        <div className="truncate font-medium leading-tight text-foreground-light group-hover:text-foreground">
          {selectedOrganization?.name ?? 'Select organization'}
        </div>
        {selectedOrganization && (
          <div className="flex items-center gap-1 truncate text-xs leading-tight text-foreground-lighter group-hover:text-foreground-light">
            <Boxes className="size-3 shrink-0" strokeWidth={1.5} />
            <span className="min-w-0 truncate">{projectsLabel}</span>
          </div>
        )}
      </div>
    </div>
  ) : null

  const triggerButton = (
    <SidebarMenuButton
      size="lg"
      hasIcon={!isCollapsed}
      tooltip={
        isCollapsed
          ? {
              children: collapsedTooltipContent,
              className: 'p-1',
            }
          : undefined
      }
      className={cn(
        'group/org-selector touch-manipulation text-left data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-transparent',
        isCollapsed
          ? 'h-9 gap-1 !bg-transparent !px-0.5 !py-0.5 overflow-visible'
          : 'h-9 gap-2 px-1.5 py-1'
      )}
      onClick={isMobile ? () => setOpen(true) : undefined}
    >
      {!isCollapsed ? (
        <>
          <div className="flex min-w-0 flex-1 flex-col pl-0.5 text-left">
            <div className="min-w-[100px] max-w-[250px] truncate font-medium leading-tight text-foreground-light group-hover/org-selector:text-foreground">
              {selectedOrganization?.name ?? 'Select organization'}
            </div>
            {selectedOrganization && (
              <div className="flex items-center gap-1 truncate text-xs leading-tight text-foreground-lighter group-hover/org-selector:text-foreground-light">
                <Boxes className="size-3 shrink-0" strokeWidth={1.5} />
                <span className="min-w-0 truncate">{projectsLabel}</span>
              </div>
            )}
          </div>
          <div className="p-1 rounded-md group-hover/org-selector:bg-surface-200 hover:!bg-selection group-hover/org-selector:text-foreground">
            <ChevronsUpDown
              strokeWidth={1.5}
              className={cn(
                'ml-auto !h-4 !w-4 text-foreground-lighter group-hover:text-foreground-light',
                isCollapsed && 'hidden'
              )}
            />
          </div>
        </>
      ) : (
        <div className="relative flex h-8 aspect-square shrink-0 items-center bg-background-muted group-hover:border-stronger justify-center rounded border border-strong text-xs">
          <ChevronsUpDown strokeWidth={1.5} className="!h-4 !w-4 text-foreground-lighter" />
        </div>
      )}
    </SidebarMenuButton>
  )

  if (isMobile) {
    return (
      <>
        <SidebarMenu className="flex-shrink">
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
          <PopoverContent_Shadcn_
            className="p-0"
            side="bottom"
            align={isCollapsed ? 'center' : 'start'}
          >
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
