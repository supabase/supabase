import { IS_PLATFORM } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  IconSearch,
  Input,
} from 'ui'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useIsFeatureEnabled } from 'hooks'
import { EMPTY_ARR } from 'lib/void'

interface HomePageActionsProps {
  organizations: { name: string; slug: string }[]
  search: string
  setSearch: (value: string) => void
}

const HomePageActions = ({
  organizations = EMPTY_ARR,
  search,
  setSearch,
}: HomePageActionsProps) => {
  const router = useRouter()

  const organizationCreationEnabled = useIsFeatureEnabled('organizations:create')
  const { isSuccess: orgsLoaded } = useOrganizationsQuery()

  return (
    <div className="flex gap-x-3">
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

      {IS_PLATFORM && organizationCreationEnabled && orgsLoaded && (
        <Button type="default" asChild>
          <Link href="/new" className="flex items-center gap-2">
            New organization
          </Link>
        </Button>
      )}

      <Input
        size="tiny"
        placeholder="Search for a project"
        icon={<IconSearch size={16} />}
        className="w-64 [&>div>div>div>input]:!pl-7 [&>div>div>div>div]:!pl-2"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
    </div>
  )
}
export default HomePageActions
