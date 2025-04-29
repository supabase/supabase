import { Boxes } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { LayoutUpdateBanner } from 'components/interfaces/App/FeaturePreview/LayoutUpdatePreview'
import AppLayout from 'components/layouts/AppLayout/AppLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainerLegacy, ScaffoldTitle } from 'components/layouts/Scaffold'
import { ActionCard } from 'components/ui/ActionCard'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { NextPageWithLayout } from 'types'
import { Skeleton } from 'ui'

const OrganizationsPage: NextPageWithLayout = () => {
  const router = useRouter()

  const { data: organizations, isLoading, isError, error, isSuccess } = useOrganizationsQuery()
  const { data: projects = [] } = useProjectsQuery()

  useEffect(() => {
    // If there are no organizations, force the user to create one
    if (isSuccess && organizations.length <= 0) {
      router.push('/new')
    }
  }, [isSuccess, organizations])

  return (
    <>
      <ScaffoldContainerLegacy>
        <LayoutUpdateBanner />
        <ScaffoldTitle>Your Organizations</ScaffoldTitle>
      </ScaffoldContainerLegacy>
      <ScaffoldContainerLegacy>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading && (
            <>
              <Skeleton className="h-[62px] rounded-md" />
              <Skeleton className="h-[62px] rounded-md" />
              <Skeleton className="h-[62px] rounded-md" />
            </>
          )}
          {isError && <div>Error loading organizations</div>}
          {isSuccess &&
            organizations?.map((organization) => {
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
    </>
  )
}

OrganizationsPage.getLayout = (page) => (
  <AppLayout>
    <DefaultLayout headerTitle="Organizations">{page}</DefaultLayout>
  </AppLayout>
)

export default OrganizationsPage
