import Link from 'next/link'
import { observer } from 'mobx-react-lite'
import { Button, Dropdown, Divider, IconPlus } from '@supabase/ui'

import { useStore } from 'hooks'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { useRouter } from 'next/router'

const ProjectDropdown = () => {
  const { app, ui } = useStore()
  const selectedOrganizationProjects = app.projects.list()
  const selectedOrganizationSlug = ui.selectedOrganization?.slug
  const selectedProject: any = ui.selectedProject
  const router = useRouter()
  const currentRoute = router?.route

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
              <Link key={x.ref} href={currentRoute?.replace('[ref]', x.ref) ?? `/project/${x.ref}`}>
                <a className="block">
                  <Dropdown.Item>{x.name}</Dropdown.Item>
                </a>
              </Link>
            ))}
          <Divider light />
          <Link href={`/new/${selectedOrganizationSlug}`}>
            <a className="block">
              <Dropdown.Item icon={<IconPlus size="tiny" />}>New project</Dropdown.Item>
            </a>
          </Link>
        </>
      }
    >
      <Button as="span" type="text" size="tiny">
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
