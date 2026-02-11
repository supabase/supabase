import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useFeatureFlags, useFlag, useParams } from 'common'
import { ObservabilityOverview } from 'components/interfaces/Observability/ObservabilityOverview'
import { CreateReportModal } from 'components/interfaces/Reports/CreateReportModal'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ObservabilityLayout from 'components/layouts/ObservabilityLayout/ObservabilityLayout'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { useContentQuery } from 'data/content/content-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useProfile } from 'lib/profile'
import { useRouter } from 'next/router'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import type { NextPageWithLayout } from 'types'
import { LogoLoader } from 'ui'

export const UserReportPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  const { profile } = useProfile()
  const { hasLoaded: flagsLoaded } = useFeatureFlags()
  const showOverview = useFlag('observabilityOverview')
  const [showCreateReportModal, setShowCreateReportModal] = useQueryState(
    'newReport',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )

  const {
    isPending: isLoading,
    isSuccess,
    data,
  } = useContentQuery({
    projectRef: ref,
    type: 'report',
  })

  useEffect(() => {
    if (!isSuccess) return
    if (!flagsLoaded) return // Wait for flags to load before checking redirect
    if (showOverview) return // Don't redirect if overview is enabled

    const reports = data.content
      .filter((x) => x.type === 'report')
      .sort((a, b) => a.name.localeCompare(b.name))
    if (reports.length >= 1) router.push(`/project/${ref}/observability/${reports[0].id}`)
    if (reports.length === 0) router.push(`/project/${ref}/observability/api-overview`)
  }, [isSuccess, data, router, ref, showOverview, flagsLoaded])

  const { can: canCreateReport } = useAsyncCheckPermissions(
    PermissionAction.CREATE,
    'user_content',
    {
      resource: { type: 'report', owner_id: profile?.id },
      subject: { id: profile?.id },
    }
  )

  // Wait for flags to load before rendering to avoid flashing wrong page
  if (!flagsLoaded || isLoading) {
    return <LogoLoader />
  }

  // Show overview page if feature flag is enabled
  if (showOverview) {
    return <ObservabilityOverview />
  }

  return (
    <div className="h-full w-full">
      <>
        <ProductEmptyState
          title="Observability"
          ctaButtonLabel="New custom report"
          onClickCta={() => {
            setShowCreateReportModal(true)
          }}
          disabled={!canCreateReport}
          disabledMessage="You need additional permissions to create a report"
        >
          <p className="text-foreground-light text-sm">Create custom reports for your projects.</p>
          <p className="text-foreground-light text-sm">
            Get a high level overview of your network traffic, user actions, and infrastructure
            health.
          </p>
        </ProductEmptyState>
        <CreateReportModal
          visible={showCreateReportModal}
          onCancel={() => setShowCreateReportModal(false)}
          afterSubmit={() => setShowCreateReportModal(false)}
        />
      </>
    </div>
  )
}

UserReportPage.getLayout = (page) => (
  <DefaultLayout>
    <ObservabilityLayout>{page}</ObservabilityLayout>
  </DefaultLayout>
)

export default UserReportPage
