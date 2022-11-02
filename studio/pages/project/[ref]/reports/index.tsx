import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions, useFlag, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { useProjectContentStore } from 'stores/projectContentStore'
import Loading from 'components/ui/Loading'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { createReport } from 'components/to-be-cleaned/Reports/Reports.utils'
import ReportsLayout from 'components/layouts/ReportsLayout/ReportsLayout'

export const UserReportPage: NextPageWithLayout = () => {
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const { ref } = router.query

  const { ui } = useStore()
  const project = ui.selectedProject

  const contentStore = useProjectContentStore(ref)
  const canCreateReport = checkPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'report', owner_id: ui.profile?.id },
    subject: { id: ui.profile?.id },
  })

  const kpsEnabled = useFlag('initWithKps')

  useEffect(() => {
    if (project && project.status === PROJECT_STATUS.INACTIVE) {
      post(`${API_URL}/projects/${ref}/restore`, { kps_enabled: kpsEnabled })
    }
  }, [project])

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
        <ProductEmptyState
          title="Reports"
          ctaButtonLabel="Create report"
          onClickCta={() => {
            try {
              createReport({ router })
            } catch (error: any) {
              ui.setNotification({
                category: 'error',
                message: `Failed to create report: ${error.message}`,
              })
            }
          }}
          disabled={!canCreateReport}
          disabledMessage="You need additional permissions to create a report"
        >
          <p className="text-scale-1100 text-sm">Create custom reports for your projects.</p>
          <p className="text-scale-1100 text-sm">
            Get a high level overview of your network traffic, user actions, and infrastructure
            health.
          </p>
        </ProductEmptyState>
      )}
    </div>
  )
}

UserReportPage.getLayout = (page) => <ReportsLayout>{page}</ReportsLayout>

export default observer(UserReportPage)
