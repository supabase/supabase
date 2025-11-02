import { Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import { OrganizationCard } from 'components/interfaces/Organization/OrganizationCard'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainerLegacy, ScaffoldTitle } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import NoSearchResults from 'components/ui/NoSearchResults'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { withAuth } from 'hooks/misc/withAuth'
import { NextPageWithLayout } from 'types'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CriticalIcon,
  Skeleton,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

const OrganizationsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const { error: orgNotFoundError, org: orgSlug } = useParams()
  const orgNotFound = orgNotFoundError === 'org_not_found'

  const { data: organizations = [], error, isLoading, isError, isSuccess } = useOrganizationsQuery()

  const organizationCreationEnabled = useIsFeatureEnabled('organizations:create')
  const filteredOrganizations =
    search.length === 0
      ? organizations
      : organizations?.filter(
          (x) => x.name.toLowerCase().includes(search) || x.slug.toLowerCase().includes(search)
        )

  useEffect(() => {
    // If there are no organizations, force the user to create one
    // unless the user is on the not found page
    if (isSuccess && organizations.length <= 0 && !orgNotFound) {
      router.push('/new')
    }
  }, [isSuccess, organizations])

  return (
    <ScaffoldContainerLegacy>
      {orgNotFound && (
        <Alert_Shadcn_ variant="destructive">
          <CriticalIcon />
          <AlertTitle_Shadcn_>Organization not found</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            That organization (<code>{orgSlug}</code>) does not exist or you don't have access to
            it.
          </AlertDescription_Shadcn_>
          <AlertDescription_Shadcn_ className="mt-3">
            If you think this is an error, please reach out to the org owner to get access.
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
      <ScaffoldTitle>Your Organizations</ScaffoldTitle>

      {organizations.length === 0 && orgNotFound && (
        <p className="-mt-4">You don't have any organizations yet. Create one to get started.</p>
      )}

      <div className="flex items-center gap-x-2 md:gap-x-3">
        {organizationCreationEnabled && (
          <Button asChild type="primary" className="w-min">
            <Link href={`/new`}>New organization</Link>
          </Button>
        )}

        {organizations.length > 0 && (
          <Input
            size="tiny"
            placeholder="Search for an organization"
            icon={<Search size={16} />}
            className="w-full flex-1 md:w-64 [&>div>div>div>input]:!pl-7 [&>div>div>div>div]:!pl-2"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        )}
      </div>

      {search.length > 0 && filteredOrganizations.length === 0 && (
        <NoSearchResults searchString={search} />
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && (
          <>
            <Skeleton className="h-[62px] rounded-md" />
            <Skeleton className="h-[62px] rounded-md" />
            <Skeleton className="h-[62px] rounded-md" />
          </>
        )}
        {isError && <AlertError error={error} subject="Failed to load organizations" />}
        {isSuccess &&
          filteredOrganizations.map((org) => <OrganizationCard key={org.id} organization={org} />)}
      </div>
    </ScaffoldContainerLegacy>
  )
}

OrganizationsPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Organizations">{page}</DefaultLayout>
  </AppLayout>
)

export default withAuth(OrganizationsPage)
