import { useRouter } from 'next/router'
import { toJS } from 'mobx'
import { observer } from 'mobx-react-lite'
import { Button, Dropdown, IconPlus } from 'ui'

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
            .map((x) => {
              const slug = toJS(x.slug)

              return (
                <Dropdown.Item
                  key={slug}
                  onClick={() => {
                    if (!slug) {
                      // The user should not see this error as the page should
                      // be rerendered with the value of slug before they can click.
                      // It is just here in case they are the flash.
                      return ui.setNotification({
                        category: 'error',
                        message:
                          'Could not navigate to organization settings, please try again or contact support',
                      })
                    }

                    router.push({
                      pathname: `/org/[slug]/general`,
                      query: { slug },
                      hash: router.asPath.split('#')[1]?.toLowerCase(),
                    })
                  }}
                >
                  {x.name}
                </Dropdown.Item>
              )
            })}
          <Dropdown.Separator />
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
