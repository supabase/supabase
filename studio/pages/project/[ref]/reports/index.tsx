import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions, useStore } from 'hooks'
import { post } from 'lib/common/fetch'
import { API_URL, PROJECT_STATUS } from 'lib/constants'
import { useProjectContentStore } from 'stores/projectContentStore'
import Loading from 'components/ui/Loading'
import { ProjectLayoutWithAuth } from 'components/layouts'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { createReport } from 'components/to-be-cleaned/Reports/Reports.utils'

const PageLayout: NextPageWithLayout = () => {
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const { ref } = router.query

  const { ui } = useStore()
  const project = ui.selectedProject

  // const canCreateReport = checkPermissions(PermissionAction.CREATE, 'user_content', {
  //   resource: { type: 'report' },
  // })
  const contentStore = useProjectContentStore(ref)

  useEffect(() => {
    if (project && project.status === PROJECT_STATUS.INACTIVE) {
      post(`${API_URL}/projects/${ref}/restore`, {})
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
    <div className="mx-auto my-16 w-full max-w-7xl flex-grow space-y-16">
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

PageLayout.getLayout = (page) => <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>

export default observer(PageLayout)
