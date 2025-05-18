import { Boxes, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainerLegacy, ScaffoldTitle } from 'components/layouts/Scaffold'
import { ActionCard } from 'components/ui/ActionCard'
import AlertError from 'components/ui/AlertError'
import NoSearchResults from 'components/ui/NoSearchResults'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { withAuth } from 'hooks/misc/withAuth'
import { NextPageWithLayout } from 'types'
import { Button, Skeleton } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

const OrganizationsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data: projects = [] } = useProjectsQuery()
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
    if (isSuccess && organizations.length <= 0) {
      router.push('/new')
    }
  }, [isSuccess, organizations])

  return (
    <ScaffoldContainerLegacy>
      <ScaffoldTitle>Your Organizations</ScaffoldTitle>

      <div className="flex items-center gap-x-2 md:gap-x-3">
        {organizationCreationEnabled && (
          <Button asChild type="primary" className="w-min">
            <Link href={`/new`}>New organization</Link>
          </Button>
        )}
        <Input
          size="tiny"
          placeholder="Search for an organization"
          icon={<Search size={16} />}
          className="w-full flex-1 md:w-64 [&>div>div>div>input]:!pl-7 [&>div>div>div>div]:!pl-2"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
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
          filteredOrganizations.map((organization) => {
            const numProjects = projects.filter(
              (x) => x.organization_slug === organization.slug
            ).length

            return (
              <ActionCard
                bgColor="bg border"
                className="[&>div]:items-center"
                key={organization.id}
                icon={<Boxes size={18} strokeWidth={1} className="text-foreground" />}
                title={organization.name}
                description={`${organization.plan.name} Plan${numProjects > 0 ? `${'  '}•${'  '}${numProjects} project${numProjects > 1 ? 's' : ''}` : ''}`}
                onClick={() => router.push(`/org/${organization.slug}`)}
              />
            )
          })}
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
