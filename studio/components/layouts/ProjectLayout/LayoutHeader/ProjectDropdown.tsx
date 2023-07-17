import Link from 'next/link'
import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'
import { Button, Dropdown, IconCode, IconPlus, Popover } from 'ui'

import { useProjectsQuery } from 'data/projects/projects-query'
import { useSelectedOrganization, useSelectedProject } from 'hooks'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'

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

interface ProjectDropdownProps {
  alt?: boolean
}

const ProjectDropdown = ({ alt }: ProjectDropdownProps) => {
  const selectedOrganization = useSelectedOrganization()
  const selectedProject = useSelectedProject()
  const { data: allProjects, isLoading: isLoadingProjects } = useProjectsQuery()
  const selectedOrganizationSlug = selectedOrganization?.slug
  const router = useRouter()
  const sanitizedRoute = sanitizeRoute(router.route, router.query)

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
            .map((x) => (
              <Link
                key={x.ref}
                href={sanitizedRoute?.replace('[ref]', x.ref) ?? `/project/${x.ref}`}
                passHref
              >
                <a className="block">
                  <Dropdown.Item
                    className={
                      selectedProject?.name === x.name
                        ? 'font-bold bg-slate-400 dark:bg-slate-500'
                        : ''
                    }
                  >
                    {x.name}
                  </Dropdown.Item>
                </a>
              </Link>
            ))}
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
      </Button>
    </Dropdown>
  ) : (
    <Button type="text">
      <span className="text-sm">{selectedProject?.name}</span>
    </Button>
  )
}

export default ProjectDropdown
