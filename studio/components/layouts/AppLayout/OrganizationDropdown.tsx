import { useRouter } from 'next/router'
import { Button, Dropdown, IconChevronDown, IconChevronsDown, IconCode, IconPlus } from 'ui'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useFlag, useSelectedOrganization, useStore } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import Link from 'next/link'

const OrganizationDropdown = () => {
  const router = useRouter()
  const { ui } = useStore()
  const { data: organizations } = useOrganizationsQuery()
  const selectedOrganization = useSelectedOrganization()
  const orgCreationV2 = useFlag('orgcreationv2')

  return IS_PLATFORM ? (
    <Dropdown
      side="bottom"
      align="start"
      overlay={
        <>
          {organizations
            ?.sort((a, b) => a.name.localeCompare(b.name))
            .map((x) => {
              // [Joshen] Improvement: maintain URL if navigating in between org pages
              return (
                <Link key={x.slug} href={`/org/${x.slug}`}>
                  <a>
                    <Dropdown.Item>{x.name}</Dropdown.Item>
                  </a>
                </Link>
              )
            })}
          <Dropdown.Separator />
          <Link href="/new">
            <a>
              <Dropdown.Item icon={<IconPlus size="tiny" />}>New organization</Dropdown.Item>
            </a>
          </Link>
          {orgCreationV2 && (
            <Link href="/new-with-subscription">
              <a>
                <Dropdown.Item icon={<IconPlus size="tiny" />}>New organization V2</Dropdown.Item>
              </a>
            </Link>
          )}
        </>
      }
    >
      <Button
        type="text"
        iconRight={<IconCode className="text-scale-1100 rotate-90" strokeWidth={2} size={12} />}
      >
        <span className="text-sm">{selectedOrganization?.name}</span>
      </Button>
    </Dropdown>
  ) : (
    <Button type="text">
      <span className="text-sm">{selectedOrganization?.name}</span>
    </Button>
  )
}

export default OrganizationDropdown
