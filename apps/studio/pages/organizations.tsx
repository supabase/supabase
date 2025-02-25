import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainerLegacy, ScaffoldTitle } from 'components/layouts/Scaffold'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useRouter } from 'next/router'
import { NextPageWithLayout } from 'types'

import { ActionCard } from 'components/ui/ActionCard'
import { Boxes } from 'lucide-react'
import { Skeleton } from 'ui'

const OrganizationsPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { data: organizations, isLoading, error } = useOrganizationsQuery()
  const selectedOrganization = useSelectedOrganization()

  //   if (selectedOrganization) {
  //     router.push(`/org/${selectedOrganization.id}`)
  //   }

  return (
    <>
      <ScaffoldContainerLegacy>
        <ScaffoldTitle>Your Organizations</ScaffoldTitle>
      </ScaffoldContainerLegacy>
      <ScaffoldContainerLegacy>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              <Skeleton className="h-[62px] rounded-md" />
              <Skeleton className="h-[62px] rounded-md" />
              <Skeleton className="h-[62px] rounded-md" />
            </>
          ) : error ? (
            <div>Error loading organizations</div>
          ) : (
            organizations?.map((organization) => (
              <ActionCard
                bgColor="bg border"
                key={organization.id}
                icon={<Boxes size={18} strokeWidth={1} className="text-foreground" />}
                title={organization.name}
                description={'organization.id'}
                onClick={() => router.push(`/org/${organization.slug}`)}
              />
            ))
          )}
        </div>
      </ScaffoldContainerLegacy>
    </>
  )
}

OrganizationsPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Organizations">{page}</DefaultLayout>
  </AppLayout>
)

export default OrganizationsPage
