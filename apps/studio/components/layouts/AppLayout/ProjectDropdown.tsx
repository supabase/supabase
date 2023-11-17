import Link from 'next/link'
import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import { useState } from 'react'

import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useIsFeatureEnabled, useSelectedOrganization, useSelectedProject } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { Organization, Project } from 'types'
import {
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

// [Fran] the idea is to let users change projects without losing the current page,
// but at the same time we need to redirect correctly between urls that might be
// unique to a project e.g. '/project/projectRef/editor/tableId'
// Right now, I'm gonna assume that any router query after the projectId,
// is a unique project id/marker so we'll redirect the user to the
// highest common route with just projectRef in the router queries.

export const sanitizeRoute = (route: string, routerQueries: ParsedUrlQuery) => {
  const queryArray = Object.entries(routerQueries)

  if (queryArray.length > 1) {
    // [Joshen] Ideally we shouldn't use hard coded numbers, but temp workaround
    // for storage bucket route since its longer
    const isStorageBucketRoute = 'bucketId' in routerQueries
    return route
      .split('/')
      .slice(0, isStorageBucketRoute ? 5 : 4)
      .join('/')
  } else {
    return route
  }
}

const ProjectLink = ({
  project,
  setOpen,
}: {
  project: Project
  organization?: Organization
  setOpen: (value: boolean) => void
}) => {
  const router = useRouter()
  const { ref } = useParams()
  const sanitizedRoute = sanitizeRoute(router.route, router.query)

  // [Joshen] Temp while we're interim between v1 and v2 billing
  let href = sanitizedRoute?.replace('[ref]', project.ref) ?? `/project/${project.ref}`

  return (
    <CommandItem_Shadcn_
      key={project.ref}
      value={`${project.name}-${project.ref}`}
      className="cursor-pointer w-full"
      onSelect={() => {
        router.push(href)
        setOpen(false)
      }}
      onClick={() => setOpen(false)}
    >
      <Link href={href} className="w-full flex items-center justify-between">
        {project.name}
        {project.ref === ref && <IconCheck />}
      </Link>
    </CommandItem_Shadcn_>
  )
}

interface ProjectDropdownProps {
  isNewNav?: boolean
}

const ProjectDropdown = ({ isNewNav = false }: ProjectDropdownProps) => {
  const router = useRouter()
  const { ref } = useParams()
  const projectDetails = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const { data: allProjects, isLoading: isLoadingProjects } = useProjectsQuery()

  const projectCreationEnabled = useIsFeatureEnabled('projects:create')

  const isBranch = projectDetails?.parentRef !== projectDetails?.ref

  const projects = isNewNav
    ? allProjects
        ?.filter((x) => x.organization_id === selectedOrganization?.id)
        .sort((a, b) => a.name.localeCompare(b.name))
    : allProjects?.sort((a, b) => a.name.localeCompare(b.name))
  const selectedProject = isBranch
    ? projects?.find((project) => project.ref === projectDetails?.parentRef)
    : projects?.find((project) => project.ref === ref)

  const [open, setOpen] = useState(false)

  if (isLoadingProjects || !selectedProject) {
    return <ShimmeringLoader className="w-[90px]" />
  }

  return IS_PLATFORM ? (
    <div className="flex items-center px-2">
      <Popover_Shadcn_ open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="text"
            className="pr-2"
            iconRight={
              <IconCode className="text-foreground-light rotate-90" strokeWidth={2} size={12} />
            }
          >
            <div className="flex items-center space-x-2">
              <p className={isNewNav ? 'text-sm' : 'text-xs'}>{selectedProject?.name}</p>
            </div>
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0" side="bottom" align="start">
          <Command_Shadcn_>
            <CommandInput_Shadcn_ placeholder="Find project..." />
            <CommandList_Shadcn_>
              <CommandEmpty_Shadcn_>No projects found</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                <ScrollArea className={(projects || []).length > 7 ? 'h-[210px]' : ''}>
                  {projects?.map((project) => (
                    <ProjectLink key={project.ref} project={project} setOpen={setOpen} />
                  ))}
                </ScrollArea>
              </CommandGroup_Shadcn_>
              {projectCreationEnabled && (
                <CommandGroup_Shadcn_ className="border-t">
                  <CommandItem_Shadcn_
                    className="cursor-pointer w-full"
                    onSelect={() => {
                      setOpen(false)
                      router.push(`/new/${selectedOrganization?.slug}`)
                    }}
                    onClick={() => setOpen(false)}
                  >
                    <Link
                      href={`/new/${selectedOrganization?.slug}`}
                      onClick={() => {
                        setOpen(false)
                      }}
                      className="w-full flex items-center gap-2"
                    >
                      <IconPlus size={14} strokeWidth={1.5} />
                      <p>New project</p>
                    </Link>
                  </CommandItem_Shadcn_>
                </CommandGroup_Shadcn_>
              )}
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  ) : (
    <Button type="text">
      <span className={isNewNav ? 'text-sm' : 'text-xs'}>{selectedProject?.name}</span>
    </Button>
  )
}

export default ProjectDropdown
