'use client'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useOrgProjectsInfiniteQuery } from 'data/projects/org-projects-infinite-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { ChevronsUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Button,
  Command_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
} from 'ui'

import { useV2Params } from '@/app/v2/V2ParamsContext'

export function V2OrgProjectSelector() {
  const router = useRouter()
  const { orgSlug, projectRef } = useV2Params()
  const [open, setOpen] = useState(false)

  const { data: orgs } = useOrganizationsQuery()
  const selectedOrg = orgs?.find((o) => o.slug === orgSlug)
  const { data: project } = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: Boolean(projectRef) }
  )
  const { data: projectsData } = useOrgProjectsInfiniteQuery(
    { slug: orgSlug, limit: 50 },
    { enabled: open && Boolean(orgSlug) }
  )
  const projects = projectsData?.pages?.flatMap((p) => p.projects) ?? []

  const handleSelectProject = (ref: string) => {
    if (!orgSlug) return
    setOpen(false)
    router.push(`/v2/project/${ref}/data/tables`)
  }

  const handleSelectOrg = (slug: string) => {
    setOpen(false)
    router.push(`/v2/org/${slug}`)
  }

  return (
    <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type="text" size="tiny" className="gap-1 text-foreground font-medium h-7 px-2">
          <span className="text-foreground-lighter text-xs truncate max-w-[120px]">
            {selectedOrg?.name ?? orgSlug ?? 'Org'}
          </span>
          <span className="text-foreground truncate max-w-[140px]">
            / {project?.name ?? projectRef ?? 'Project'}
          </span>
          <ChevronsUpDown className="h-3 w-3 text-foreground-lighter shrink-0" />
        </Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ className="w-[280px] p-0" align="start">
        <Command_Shadcn_>
          <CommandInput_Shadcn_ placeholder="Search org or project..." />
          <CommandList_Shadcn_>
            <CommandGroup_Shadcn_ heading="Organizations">
              {orgs?.map((org) => (
                <CommandItem_Shadcn_
                  key={org.id}
                  value={`${org.name} ${org.slug}`}
                  onSelect={() => handleSelectOrg(org.slug)}
                >
                  {org.name}
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
            {orgSlug && (
              <CommandGroup_Shadcn_ heading="Projects">
                {projects.map((proj) => (
                  <CommandItem_Shadcn_
                    key={proj.ref}
                    value={`${proj.name} ${proj.ref}`}
                    onSelect={() => handleSelectProject(proj.ref)}
                  >
                    {proj.name}
                  </CommandItem_Shadcn_>
                ))}
              </CommandGroup_Shadcn_>
            )}
          </CommandList_Shadcn_>
        </Command_Shadcn_>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
