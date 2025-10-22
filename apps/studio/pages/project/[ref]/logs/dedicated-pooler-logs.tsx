import { useParams } from 'common'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from 'components/interfaces/Settings/Logs/LogsPreviewer'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import { Loading } from 'components/ui/Loading'
import { useCurrentOrgPlan } from 'hooks/misc/useCurrentOrgPlan'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { plan: orgPlan, isLoading: isOrgPlanLoading } = useCurrentOrgPlan()
  const isFreePlan = !isOrgPlanLoading && orgPlan?.id === 'free'

  useEffect(() => {
    // Redirect to pooler logs if user is on free plan
    if (!isOrgPlanLoading && isFreePlan) {
      router.push(`/project/${ref}/logs/pooler-logs`)
    }
  }, [isFreePlan, isOrgPlanLoading, ref, router])

  // Prevent showing logs while checking plan or loading config
  if (isOrgPlanLoading || isFreePlan) {
    return <Loading />
  }

  return (
    <LogsPreviewer
      projectRef={ref as string}
      condensedLayout={true}
      tableName={LogsTableName.PGBOUNCER}
      queryType={'pgbouncer'}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Dedicated Pooler Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
