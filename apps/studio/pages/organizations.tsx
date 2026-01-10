import { Plus, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useParams } from 'common'
import { NoOrganizationsState } from 'components/interfaces/Home/ProjectList/EmptyStates'
import { OrganizationCard } from 'components/interfaces/Organization/OrganizationCard'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { NoSearchResults } from 'components/ui/NoSearchResults'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { withAuth } from 'hooks/misc/withAuth'
import type { NextPageWithLayout } from 'types'
import { Button, Skeleton } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { Input } from 'ui-patterns/DataInputs/Input'

const OrganizationsPage: NextPageWithLayout = () => {
  const [search, setSearch] = useState('')
  const { error: orgNotFoundError, org: orgSlug } = useParams()
  const orgNotFound = orgNotFoundError === 'org_not_found'

  const {
    data: organizations = [],
    error,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useOrganizationsQuery()

  const organizationCreationEnabled = useIsFeatureEnabled('organizations:create')
  const filteredOrganizations =
    search.length === 0
      ? organizations
      : organizations?.filter(
          (x) => x.name.toLowerCase().includes(search) || x.slug.toLowerCase().includes(search)
        )

  return (
    <ScaffoldContainer>
      <ScaffoldSection isFullWidth className="flex flex-col gap-y-4">
        {orgNotFound && (
          <Admonition
            type="destructive"
            title="Organization not found"
            description={
              <>
                The organization <code className="text-code-inline">{orgSlug}</code> does not exist
                or you do not have permission to access to it. Contact the the owner if you believe
                this is a mistake.
              </>
            }
          />
        )}

        {organizations.length > 0 && (
          <div className="flex items-center justify-between gap-x-2 md:gap-x-3">
            <Input
              size="tiny"
              placeholder="Search for an organization"
              icon={<Search />}
              className="w-full flex-1 md:w-64"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {organizationCreationEnabled && (
              <Button asChild icon={<Plus />} type="primary" className="w-min">
                <Link href={`/new`}>New organization</Link>
              </Button>
            )}
          </div>
        )}

        {isSuccess && organizations.length === 0 && !isError && <NoOrganizationsState />}

        {search.length > 0 && filteredOrganizations.length === 0 && (
          <NoSearchResults searchString={search} />
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && (
            <>
              <Skeleton className="h-[70px] rounded-md" />
              <Skeleton className="h-[70px] rounded-md" />
              <Skeleton className="h-[70px] rounded-md" />
            </>
          )}
          {isError && <AlertError error={error} subject="Failed to load organizations" />}
          {isSuccess &&
            filteredOrganizations.map((org) => (
              <OrganizationCard key={org.id} organization={org} />
            ))}
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

OrganizationsPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout hideMobileMenu headerTitle="Organizations">
      <PageLayout title="Your Organizations" className="max-w-[1200px] lg:px-6 mx-auto">
        {page}
      </PageLayout>
    </DefaultLayout>
  </AppLayout>
)

export default withAuth(OrganizationsPage)
