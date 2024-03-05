import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

import { useParams } from 'common/hooks'
import { ReportsLayout } from 'components/layouts'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { createReport } from 'components/to-be-cleaned/Reports/Reports.utils'
import { Loading } from 'components/ui/Loading'
import { useCheckPermissions, useStore } from 'hooks'
import { useProfile } from 'lib/profile'
import { useProjectContentStore } from 'stores/projectContentStore'
import type { NextPageWithLayout } from 'types'
import { CreateReportModal } from 'components/interfaces/Reports/Reports.CreateReportModal'

export const UserReportPage: NextPageWithLayout = () => {
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const { ref } = useParams()

  const { profile } = useProfile()
  const { ui } = useStore()
  const [showCreateReportModal, setShowCreateReportModal] = useState(false)

  const contentStore = useProjectContentStore(ref)
  const canCreateReport = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'report', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  async function loadReports() {
    await contentStore.load()
    const reports = contentStore.reports()

    if (reports.length >= 1) {
      router.push(`/project/${ref}/reports/${reports[0].id}`)
    } else {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [ref])

  return (
    <div className="mx-auto my-32 w-full max-w-7xl flex-grow space-y-16">
      {loading ? (
        <Loading />
      ) : (
        <>
          <ProductEmptyState
            title="Reports"
            ctaButtonLabel="New custom report"
            onClickCta={() => {
              setShowCreateReportModal(true)
            }}
            disabled={!canCreateReport}
            disabledMessage="You need additional permissions to create a report"
          >
            <p className="text-foreground-light text-sm">
              Create custom reports for your projects.
            </p>
            <p className="text-foreground-light text-sm">
              Get a high level overview of your network traffic, user actions, and infrastructure
              health.
            </p>
          </ProductEmptyState>
          <CreateReportModal
            visible={showCreateReportModal}
            onCancel={() => {
              setShowCreateReportModal(false)
            }}
            afterSubmit={() => {
              setShowCreateReportModal(false)
            }}
          />
        </>
      )}
    </div>
  )
}

UserReportPage.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default UserReportPage
