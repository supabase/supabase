import { useFeatureFlags, useFlag, useParams } from 'common'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { LogoLoader } from 'ui'

import { ObservabilityOverview } from '@/components/interfaces/Observability/ObservabilityOverview'
import { CreateReportModal } from '@/components/interfaces/Reports/CreateReportModal'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import ObservabilityLayout from '@/components/layouts/ObservabilityLayout/ObservabilityLayout'
import ProductEmptyState from '@/components/to-be-cleaned/ProductEmptyState'
import type { NextPageWithLayout } from '@/types'

export const UserReportPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  const { hasLoaded: flagsLoaded } = useFeatureFlags()
  const showOverview = useFlag('observabilityOverview')
  const [showCreateNotebookModal, setShowCreateNotebookModal] = useQueryState(
    'newReport',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  useEffect(() => {
    if (!flagsLoaded) return
    if (showOverview) return
    router.replace(`/project/${ref}/observability/api-overview`)
  }, [flagsLoaded, showOverview, router, ref])

  if (!flagsLoaded) {
    return <LogoLoader />
  }

  if (showOverview) {
    return <ObservabilityOverview />
  }

  return (
    <div className="h-full w-full">
      <ProductEmptyState
        title="Observability"
        ctaButtonLabel="Open SQL Editor"
        onClickCta={() => {
          router.push(`/project/${ref}/sql`)
        }}
        disabled={false}
      >
        <p className="text-foreground-light text-sm">
          Built-in observability reports live here. Create SQL notebooks in the SQL Editor.
        </p>
      </ProductEmptyState>
      <CreateReportModal
        visible={showCreateNotebookModal}
        onCancel={() => setShowCreateNotebookModal(false)}
        afterSubmit={() => setShowCreateNotebookModal(false)}
      />
    </div>
  )
}

UserReportPage.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout title="Overview">{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default UserReportPage
