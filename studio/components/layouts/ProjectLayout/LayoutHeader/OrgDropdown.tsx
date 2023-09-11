import { toJS } from 'mobx'
import { useRouter } from 'next/router'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useSelectedOrganization, useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { Button, Dropdown, IconPlus } from 'ui'

const OrgDropdown = () => {
  const router = useRouter()
  const { ui } = useStore()

  const { data: organizations } = useOrganizationsQuery()
  const selectedOrganization = useSelectedOrganization()

  return IS_PLATFORM ? (
    <Dropdown
      side="bottom"
      align="start"
      overlay={
        <>
          {organizations
            ?.sort((a, b) => a.name.localeCompare(b.name))
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
      <Button asChild type="text" size="tiny">
        <span>{selectedOrganization?.name}</span>
      </Button>
    </Dropdown>
  ) : (
    <Button asChild type="text" size="tiny">
      <span>{selectedOrganization?.name}</span>
    </Button>
  )
}

export default OrgDropdown
