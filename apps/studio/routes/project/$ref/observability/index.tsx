import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useFeatureFlags, useFlag } from 'common'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { LogoLoader } from 'ui'

import { ObservabilityOverview } from '@/components/interfaces/Observability/ObservabilityOverview'
import { CreateReportModal } from '@/components/interfaces/Reports/CreateReportModal'
import ProductEmptyState from '@/components/to-be-cleaned/ProductEmptyState'
import { useContentQuery } from '@/data/content/content-query'
import {
  FGA_PERMISSIONS,
  useAsyncCheckUserContentPermissions,
} from '@/hooks/misc/useCheckPermissionsV2'

export const Route = createFileRoute('/project/$ref/observability/')({
  component: UserReportPage,
  staticData: {
    observabilityLayoutTitle: 'Overview',
  },
})

function UserReportPage() {
  const navigate = useNavigate()
  const { ref } = Route.useParams()

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
    if (reports.length >= 1)
      void navigate({
        to: '/project/$ref/observability/$id',
        params: { ref, id: reports[0].id },
        replace: true,
      })
    if (reports.length === 0)
      void navigate({
        to: '/project/$ref/observability/api-overview',
        params: { ref },
        replace: true,
      })
  }, [isSuccess, data, navigate, ref, showOverview, flagsLoaded])

  const { can: canCreateReport } = useAsyncCheckUserContentPermissions(
    FGA_PERMISSIONS.PROJECT.SNIPPETS_WRITE,
    {
      mode: 'create',
      type: 'report',
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
