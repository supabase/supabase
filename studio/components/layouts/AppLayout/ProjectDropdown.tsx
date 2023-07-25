import Link from 'next/link'
import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import { useRef, useState } from 'react'
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
} from 'ui'

import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useSelectedOrganization, useSelectedProject } from 'hooks'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { Organization, Project } from 'types'
import { useParams } from 'common'

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
  organization,
  setOpen,
}: {
  project: Project
  organization?: Organization
  setOpen: (value: boolean) => void
}) => {
  const router = useRouter()
  const { ref } = useParams()
  const sanitizedRoute = sanitizeRoute(router.route, router.query)
  const isOrgBilling = !!organization?.subscription_id

  // [Joshen] Temp while we're interim between v1 and v2 billing
  let href = sanitizedRoute?.replace('[ref]', project.ref) ?? `/project/${project.ref}`
  if (href.endsWith('settings/addons') && !isOrgBilling) {
    href = href.replace('settings/addons', 'settings/billing/subscription')
  } else if (href.endsWith('settings/billing/subscription') && isOrgBilling) {
    href = href.replace('settings/billing/subscription', 'settings/addons')
  } else if (href.endsWith('settings/infrastructure') && !isOrgBilling) {
    href = href.replace('settings/infrastructure', 'settings/billing/usage')
  } else if (href.endsWith('settings/billing/usage') && !isOrgBilling) {
    href = href.replace('settings/billing/usage', 'settings/infrastructure')
  }

  return (
    <Link passHref href={href}>
      <CommandItem_Shadcn_
        asChild
        key={project.ref}
        value={project.name}
        className="cursor-pointer w-full flex items-center justify-between"
        onSelect={() => {
          router.push(href)
          setOpen(false)
        }}
        onClick={() => setOpen(false)}
      >
        <a>
          {project.name}
          {project.ref === ref && <IconCheck />}
        </a>
      </CommandItem_Shadcn_>
    </Link>
  )
}

const ProjectDropdown = () => {
  const router = useRouter()
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const projectNameRef = useRef<HTMLAnchorElement>(null)
  const { data: allProjects, isLoading: isLoadingProjects } = useProjectsQuery()

  const isOrgBilling = !!selectedOrganization?.subscription_id
  const { data: subscription, isSuccess } = useProjectSubscriptionV2Query(
    { projectRef: selectedProject?.ref },
    { enabled: !isOrgBilling }
  )
  const projects = allProjects
    ?.filter((x) => x.status !== PROJECT_STATUS.INACTIVE)
    .filter((x) => x.organization_id === selectedOrganization?.id)
    .sort((a, b) => a.name.localeCompare(b.name))

  const [open, setOpen] = useState(false)
  const popoverOffset = (projectNameRef.current?.offsetWidth ?? 0) + 12

  if (isLoadingProjects) {
    return <ShimmeringLoader className="w-[90px]" />
  }

  return IS_PLATFORM ? (
    <div className="flex items-center space-x-2 px-2">
      <Link href={`/project/${selectedProject?.ref}`}>
        <a ref={projectNameRef} className="flex items-center space-x-2">
          <p className="text-sm">{selectedProject?.name}</p>
          {isSuccess && !isOrgBilling && <Badge color="slate">{subscription?.plan.name}</Badge>}
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
        <PopoverContent_Shadcn_
          className="p-0"
          side="bottom"
          align="start"
          style={{ marginLeft: `-${popoverOffset}px` }}
        >
          <Command_Shadcn_>
            <CommandInput_Shadcn_ placeholder="Find project..." />
            <CommandList_Shadcn_>
              <CommandEmpty_Shadcn_>No projects found</CommandEmpty_Shadcn_>
              <CommandGroup_Shadcn_>
                {projects?.map((project) => (
                  <ProjectLink
                    key={project.ref}
                    project={project}
                    organization={selectedOrganization}
                    setOpen={setOpen}
                  />
                ))}
              </CommandGroup_Shadcn_>
              <CommandGroup_Shadcn_ className="border-t">
                <Link
                  passHref
                  href={`/new/${selectedOrganization?.slug}`}
                  onClick={() => {
                    setOpen(false)
                  }}
                >
                  <CommandItem_Shadcn_
                    asChild
                    className="cursor-pointer flex items-center space-x-2 w-full"
                    onSelect={() => {
                      setOpen(false)
                      router.push(`/new/${selectedOrganization?.slug}`)
                    }}
                  >
                    <a>
                      <IconPlus size={14} strokeWidth={1.5} />
                      <p>New project</p>
                    </a>
                  </CommandItem_Shadcn_>
                </Link>
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  ) : (
    <Button type="text">
      <span className="text-sm">{selectedProject?.name}</span>
    </Button>
  )
}

export default ProjectDropdown
