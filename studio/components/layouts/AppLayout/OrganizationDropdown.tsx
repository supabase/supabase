import Link from 'next/link'
import { Badge, Button, Dropdown, IconCode, IconPlus } from 'ui'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useFlag, useSelectedOrganization } from 'hooks'
import { IS_PLATFORM } from 'lib/constants'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'

const OrganizationDropdown = () => {
  const { data: organizations, isLoading: isLoadingOrganizations } = useOrganizationsQuery()
  const selectedOrganization = useSelectedOrganization()
  const orgCreationV2 = useFlag('orgcreationv2')

  const slug = selectedOrganization?.slug
  const orgName = selectedOrganization?.name
  const { data, isSuccess } = useOrgSubscriptionQuery({ orgSlug: slug })

  if (isLoadingOrganizations) {
    return <ShimmeringLoader className="w-[90px]" />
  }

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
        <span className="text-sm">{orgName}</span>
        {isSuccess && (
          <Badge color="slate" className="ml-2">
            {data?.plan.name}
          </Badge>
        )}
      </Button>
    </Dropdown>
  ) : (
    <Button type="text">
      <span className="text-sm">{orgName}</span>
    </Button>
  )
}

export default OrganizationDropdown
