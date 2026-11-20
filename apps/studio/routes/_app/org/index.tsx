import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { ShimmeringCard } from '@/components/interfaces/Home/ProjectList/ShimmeringCard'
import { ScaffoldContainerLegacy } from '@/components/layouts/Scaffold'
import { useLastVisitedOrganization } from '@/hooks/misc/useLastVisitedOrganization'

export const Route = createFileRoute('/_app/org/')({
  component: OrgIndexPage,
  staticData: {
    orgLayoutTitle: 'Organizations',
  },
})

function OrgIndexPage() {
  const navigate = useNavigate()
  const { lastVisitedOrganization, isSuccess } = useLastVisitedOrganization()

  useEffect(() => {
    if (isSuccess) {
      if (lastVisitedOrganization) {
        void navigate({ to: '/org/$slug', params: { slug: lastVisitedOrganization } })
      } else {
        void navigate({ to: '/organizations' })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, navigate])

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
