import Link from 'next/link'
import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import { Badge, Button, Dropdown, IconCode, IconPlus, Popover } from 'ui'

import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization, useSelectedProject } from 'hooks'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { Organization, Project } from 'types'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'

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
        <Dropdown.Item
          className={
            selectedProject?.name === project.name ? 'font-bold bg-slate-400 dark:bg-slate-500' : ''
          }
        >
          {project.name}
        </Dropdown.Item>
      </a>
    </Link>
  )
}

const ProjectDropdown = ({ alt }: { alt?: boolean }) => {
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const { data: allProjects, isLoading: isLoadingProjects } = useProjectsQuery()
  const { data: allOrganizations } = useOrganizationsQuery()
  const selectedOrganizationSlug = selectedOrganization?.slug

  const isOrgBilling = !!selectedOrganization?.subscription_id
  const { data: subscription, isSuccess } = useProjectSubscriptionV2Query(
    { projectRef: selectedProject?.ref },
    { enabled: alt && !isOrgBilling }
  )

  if (isLoadingProjects && alt) {
    return <ShimmeringLoader className="w-[90px]" />
  }

  return IS_PLATFORM ? (
    <Dropdown
      side="bottom"
      align="start"
      overlay={
        <>
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
              <Dropdown.Item icon={<IconPlus size="tiny" />}>New project</Dropdown.Item>
            </a>
          </Link>
        </>
      }
    >
      <Button
        type="text"
        iconRight={
          alt ? <IconCode className="text-scale-1100 rotate-90" strokeWidth={2} size={12} /> : null
        }
      >
        <span className="text-sm">{selectedProject?.name}</span>
        {alt && isSuccess && !isOrgBilling && (
          <Badge color="slate" className="ml-2">
            {subscription?.plan.name}
          </Badge>
        )}
      </Button>
    </Dropdown>
  ) : (
    <Button type="text">
      <span className="text-sm">{selectedProject?.name}</span>
    </Button>
  )
}

export default ProjectDropdown
