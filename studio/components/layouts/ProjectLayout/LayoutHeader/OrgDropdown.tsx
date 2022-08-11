import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Button, Dropdown, IconPlus, IconSettings } from '@supabase/ui'
import Link from 'next/link'

import { useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'

const OrgDropdown = () => {
  const router = useRouter()
  const { app, ui } = useStore()

  const sortedOrganizations: any[] = app.organizations.list()
  const selectedOrganization: any = ui.selectedOrganization

  return IS_PLATFORM ? (
    <Dropdown
      side="bottom"
      align="start"
      overlay={
        <>
          {sortedOrganizations
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((x) => (
              <Dropdown.Item key={x.slug}>
                <div className="flex items-center justify-between w-56">
                  <Link href="/">
                    <Button type="text" className="truncate pl-0 text-xs text-scale-1100">
                      {x.name}
                    </Button>
                  </Link>
                  <Link passHref href={`/org/${x.slug}/settings`}>
                    <Button icon={<IconSettings />} type="text" />
                  </Link>
                </div>
              </Dropdown.Item>
            ))}
          <Dropdown.Seperator />
          <Dropdown.Item icon={<IconPlus size="tiny" />} onClick={() => router.push(`/new`)}>
            New organization
          </Dropdown.Item>
        </>
      }
    >
      <Button as="span" type="text" size="tiny">
        {selectedOrganization.name}
      </Button>
    </Dropdown>
  ) : (
    <Button as="span" type="text" size="tiny">
      {selectedOrganization.name}
    </Button>
  )
}

export default observer(OrgDropdown)
