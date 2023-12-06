import { useRouter } from 'next/router'

import { useIsFeatureEnabled } from 'hooks'
import { EMPTY_ARR } from 'lib/void'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from 'ui'
import Link from 'next/link'
import { IS_PLATFORM } from 'common'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'

const OrganizationDropdown = ({
  organizations = EMPTY_ARR,
}: {
  organizations: { name: string; slug: string }[]
}) => {
  const router = useRouter()

  const organizationCreationEnabled = useIsFeatureEnabled('organizations:create')
  const { isSuccess: orgsLoaded } = useOrganizationsQuery()

  return (
    <div className="flex gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="primary">
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
          </>
        </DropdownMenuContent>
      </DropdownMenu>

      {IS_PLATFORM && organizationCreationEnabled && orgsLoaded && organizations.length !== 0 && (
        <Button type="default" asChild>
          <Link href="/new" className="flex items-center gap-2 w-full">
            New organization
          </Link>
        </Button>
      )}
    </div>
  )
}
export default OrganizationDropdown
