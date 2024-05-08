import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useRouter } from 'next/router'
import { useState } from 'react'

import { useParams } from 'common'
import { CreateReportModal } from 'components/interfaces/Reports/Reports.CreateReportModal'
import { ReportsLayout } from 'components/layouts'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { Loading } from 'components/ui/Loading'
import { useContentQuery } from 'data/content/content-query'
import { useCheckPermissions } from 'hooks'
import { useProfile } from 'lib/profile'
import type { NextPageWithLayout } from 'types'

export const UserReportPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  const { profile } = useProfile()
  const [showCreateReportModal, setShowCreateReportModal] = useState(false)

  const { isLoading } = useContentQuery(ref, {
    onSuccess: (data) => {
      const reports = data.content
        .filter((x) => x.type === 'report')
        .sort((a, b) => a.name.localeCompare(b.name))
      if (reports.length > 1) router.push(`/project/${ref}/reports/${reports[0].id}`)
    },
  })

  const canCreateReport = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'report', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

  return (
    <div className="mx-auto my-32 w-full max-w-7xl flex-grow space-y-16">
      {isLoading ? (
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
            onCancel={() => setShowCreateReportModal(false)}
            afterSubmit={() => setShowCreateReportModal(false)}
          />
        </>
      )}
    </div>
  )
}

UserReportPage.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default UserReportPage
