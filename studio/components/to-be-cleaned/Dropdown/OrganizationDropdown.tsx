import { useRouter } from 'next/router'

import { useIsFeatureEnabled } from 'hooks'
import { EMPTY_ARR } from 'lib/void'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconPlus,
} from 'ui'

const OrganizationDropdown = ({
  organizations = EMPTY_ARR,
}: {
  organizations: { name: string; slug: string }[]
}) => {
  const router = useRouter()

  const organizationCreationEnabled = useIsFeatureEnabled('organizations:create')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button asChild>
          <span>New project</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="center">
        <>
          <DropdownMenuLabel>Choose organization</DropdownMenuLabel>
          {organizations
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((x) => (
              <DropdownMenuItem key={x.slug} onClick={() => router.push(`/new/${x.slug}`)}>
                {x.name}
              </DropdownMenuItem>
            ))}
          {organizationCreationEnabled && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="space-x-2" onClick={() => router.push(`/new`)}>
                <IconPlus size="tiny" />
                <p>New organization</p>
              </DropdownMenuItem>
            </>
          )}
        </>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
export default OrganizationDropdown
