import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { LOCAL_STORAGE_KEYS } from 'common'
import { ShimmeringCard } from 'components/interfaces/Home/ProjectList/ShimmeringCard'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import type { NextPageWithLayout } from 'types'

const OrgIndexPage: NextPageWithLayout = () => {
  const router = useRouter()
  const [lastVisitedOrganization, _, { isSuccess }] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  useEffect(() => {
    if (isSuccess) {
      if (lastVisitedOrganization.length > 0) router.push(`/org/${lastVisitedOrganization}`)
      else router.push('/organizations')
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
    <OrganizationLayout>{page}</OrganizationLayout>
  </DefaultLayout>
)

export default OrgIndexPage
