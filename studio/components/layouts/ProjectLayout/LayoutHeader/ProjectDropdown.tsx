import Link from 'next/link'
import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import {
  Button,
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconPlus,
  Popover,
} from 'ui'

import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization, useSelectedProject } from 'hooks'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { Organization, Project } from 'types'

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
}: {
  project: Project
  organization?: Organization
}) => {
  const router = useRouter()
  const selectedProject = useSelectedProject()
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
      <a className="block">
        <DropdownMenuItem_Shadcn_
          className={
            selectedProject?.name === project.name ? 'font-bold bg-slate-400 dark:bg-slate-500' : ''
          }
        >
          {project.name}
        </DropdownMenuItem_Shadcn_>
      </a>
    </Link>
  )
}

const ProjectDropdown = () => {
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const { data: allProjects, isLoading: isLoadingProjects } = useProjectsQuery()
  const { data: allOrganizations } = useOrganizationsQuery()
  const selectedOrganizationSlug = selectedOrganization?.slug

  if (isLoadingProjects) {
    return <ShimmeringLoader className="w-[90px]" />
  }

  return IS_PLATFORM ? (
    <DropdownMenu_Shadcn_>
      <DropdownMenuTrigger_Shadcn_>
        <Button type="text">
          <span className="text-sm">{selectedProject?.name}</span>
        </Button>
      </DropdownMenuTrigger_Shadcn_>
      <DropdownMenuContent_Shadcn_ side="bottom" align="start">
        {allProjects
          ?.filter((x) => x.status !== PROJECT_STATUS.INACTIVE)
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((x) => {
            const org = allOrganizations?.find((org) => org.id === x.organization_id)
            return <ProjectLink key={x.ref} project={x} organization={org} />
          })}
        <Popover.Separator />
        <Link href={`/new/${selectedOrganizationSlug}`}>
          <a className="block">
            <DropdownMenuItem_Shadcn_ className="space-x-2">
              <IconPlus size="tiny" />
              <p className="text-scale-1200 text-sm">New project</p>
            </DropdownMenuItem_Shadcn_>
          </a>
        </Link>
      </DropdownMenuContent_Shadcn_>
    </DropdownMenu_Shadcn_>
  ) : (
    <Button type="text">
      <span className="text-xs">{selectedProject?.name}</span>
    </Button>
  )
}

export default ProjectDropdown
