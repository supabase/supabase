import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ObservabilityLayout from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import { Loading } from 'components/ui/Loading'
import type { NextPageWithLayout } from 'types'

export const ObservabilityPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  useEffect(() => {
    router.push(`/project/${ref}/observability/api-overview`)
  }, [ref, router])

  return (
    <div className="h-full w-full">
      <Loading />
    </div>
  )
}

ObservabilityPage.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout>{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default ObservabilityPage
