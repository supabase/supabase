'use client'

import { LOCAL_STORAGE_KEYS } from 'common'
import { ShimmeringCard } from 'components/interfaces/Home/ProjectList/ShimmeringCard'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function V2OrgHubPage() {
  const router = useRouter()
  const [lastVisitedOrganization, _, { isSuccess }] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  useEffect(() => {
    if (isSuccess) {
      if (lastVisitedOrganization.length > 0) router.push(`/v2/org/${lastVisitedOrganization}`)
      else router.push('/v2/organizations')
    }
  }, [isSuccess, lastVisitedOrganization, router])

  return (
    <OrganizationLayout title="Organizations">
      <ScaffoldContainerLegacy>
        <div>
          <ul className="my-6 mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            <ShimmeringCard />
            <ShimmeringCard />
          </ul>
        </div>
      </ScaffoldContainerLegacy>
    </OrganizationLayout>
  )
}
