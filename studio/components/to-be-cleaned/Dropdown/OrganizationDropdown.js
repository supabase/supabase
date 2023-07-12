import { useRouter } from 'next/router'

import { useFlag } from 'hooks'
import { Button, Dropdown, IconPlus } from 'ui'

const OrganizationDropdown = ({ organizations }) => {
  const router = useRouter()

  const orgCreationV2 = useFlag('orgcreationv2')

  return (
    <Dropdown
      side="bottom"
      align="center"
      overlay={
        <>
          <Dropdown.Label>Choose organization</Dropdown.Label>
          {organizations
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((x) => (
              <Dropdown.Item
                key={x.slug}
                label={x.name}
                onClick={() => router.push(`/new/${x.slug}`)}
              >
                {x.name}
              </Dropdown.Item>
            ))}
          <Dropdown.Separator />
          <Dropdown.Item icon={<IconPlus size="tiny" />} onClick={() => router.push(`/new`)}>
            New organization
          </Dropdown.Item>
          {orgCreationV2 && (
            <Dropdown.Item
              icon={<IconPlus size="tiny" />}
              onClick={() => router.push(`/new-with-subscription`)}
            >
              New organization V2
            </Dropdown.Item>
          )}
        </>
      }
    >
      <Button asChild>
        <span>New project</span>
      </Button>
    </Dropdown>
  )
}
export default OrganizationDropdown
