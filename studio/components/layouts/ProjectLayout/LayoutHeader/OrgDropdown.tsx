import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Button, Dropdown, Divider, IconPlus } from '@supabase/ui'

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
              <Dropdown.Item key={x.slug} onClick={() => router.push(`/org/${x.slug}/settings`)}>
                {x.name}
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
