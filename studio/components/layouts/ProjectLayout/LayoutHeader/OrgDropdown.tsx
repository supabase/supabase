import { toJS } from 'mobx'
import { useRouter } from 'next/router'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useSelectedOrganization, useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import {
  Button,
  DropdownMenuContent_Shadcn_,
  DropdownMenuItem_Shadcn_,
  DropdownMenuSeparator_Shadcn_,
  DropdownMenuTrigger_Shadcn_,
  DropdownMenu_Shadcn_,
  IconPlus,
} from 'ui'

const OrgDropdown = () => {
  const router = useRouter()
  const { ui } = useStore()

  const { data: organizations } = useOrganizationsQuery()
  const selectedOrganization = useSelectedOrganization()

  return IS_PLATFORM ? (
    <DropdownMenu_Shadcn_>
      <DropdownMenuTrigger_Shadcn_>
        <Button asChild type="text" size="tiny">
          <span>{selectedOrganization?.name}</span>
        </Button>
      </DropdownMenuTrigger_Shadcn_>
      <DropdownMenuContent_Shadcn_ side="bottom" align="start">
        {organizations
          ?.sort((a, b) => a.name.localeCompare(b.name))
          .map((x) => {
            const slug = toJS(x.slug)

            return (
              <DropdownMenuItem_Shadcn_
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
                <p className="text-scale-1200 text-sm">{x.name}</p>
              </DropdownMenuItem_Shadcn_>
            )
          })}
        <DropdownMenuSeparator_Shadcn_ />

        <DropdownMenuItem_Shadcn_ onClick={() => router.push(`/new`)}>
          <IconPlus size="tiny" />
          <p className="text-scale-1200 text-sm">New organization</p>
        </DropdownMenuItem_Shadcn_>
      </DropdownMenuContent_Shadcn_>
    </DropdownMenu_Shadcn_>
  ) : (
    <Button asChild type="text" size="tiny">
      <span>{selectedOrganization?.name}</span>
    </Button>
  )
}

export default OrgDropdown
