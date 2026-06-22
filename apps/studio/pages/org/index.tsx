import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { ShimmeringCard } from '@/components/interfaces/Home/ProjectList/ShimmeringCard'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import OrganizationLayout from '@/components/layouts/OrganizationLayout'
import { ScaffoldContainerLegacy } from '@/components/layouts/Scaffold'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'
import type { NextPageWithLayout } from '@/types'

const OrgIndexPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { lastVisitedOrganization, isSuccess } = useLastVisitedOrganization()

  useEffect(() => {
    if (isSuccess) {
      if (lastVisitedOrganization) {
        router.push(`/org/${lastVisitedOrganization}`)
      } else {
        router.push('/organizations')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess])

  return (
    <ScaffoldContainerLegacy>
      <div>
        <ul className="my-6 mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <ShimmeringCard />
          <ShimmeringCard />
        </ul>
      </div>
    </ScaffoldContainerLegacy>
  )
}

OrgIndexPage.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout title="Organizations">{page}</OrganizationLayout>
  </DefaultLayout>
)

export default OrgIndexPage
