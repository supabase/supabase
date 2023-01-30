import Link from 'next/link'
import { observer } from 'mobx-react-lite'
import { Button, Dropdown, IconPlus, Popover } from 'ui'
import { useRouter } from 'next/router'
import { ParsedUrlQuery } from 'querystring'

import { useStore } from 'hooks'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'

// [Fran] the idea is to let users change projects without losing the current page,
// but at the same time we need to redirect correctly between urls that might be
// unique to a project e.g. '/project/projectRef/editor/tableId'
// Right now, I'm gonna assume that any router query after the projectId,
// is a unique project id/marker so we'll redirect the user to the
// highest common route with just projectRef in the router queries.

const sanitizeRoute = (route: string, routerQueries: ParsedUrlQuery) => {
  let queryArray = Object.entries(routerQueries)
  if (queryArray.length > 1) {
    return route.split('/').slice(0, 4).join('/')
  } else {
    return route
  }
}

const ProjectDropdown = () => {
  const { app, ui } = useStore()
  const selectedOrganizationProjects = app.projects.list()
  const selectedOrganizationSlug = ui.selectedOrganization?.slug
  const selectedProject: any = ui.selectedProject

  const router = useRouter()
  const sanitizedRoute = sanitizeRoute(router.route, router.query)

  return IS_PLATFORM ? (
    <Dropdown
      side="bottom"
      align="start"
      overlay={
        <>
          {selectedOrganizationProjects
            .filter((x: any) => x.status !== PROJECT_STATUS.INACTIVE)
            .sort((a: any, b: any) => a.name.localeCompare(b.name))
            .map((x: any) => (
              <Link
                key={x.ref}
                href={sanitizedRoute?.replace('[ref]', x.ref) ?? `/project/${x.ref}`}
                passHref
              >
                <a className="block">
                  <Dropdown.Item>{x.name}</Dropdown.Item>
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
      <Button as="span" type="text" size="tiny" className="my-1">
        {selectedProject.name}
      </Button>
    </Dropdown>
  ) : (
    <Button as="span" type="text" size="tiny">
      {selectedProject.name}
    </Button>
  )
}

export default observer(ProjectDropdown)
