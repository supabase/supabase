import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { LogoLoader } from 'ui'

import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import DefaultLayout from '@/components/layouts/DefaultLayout'
import LogsLayout from '@/components/layouts/LogsLayout/LogsLayout'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import type { NextPageWithLayout } from '@/types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { hasAccess: hasDedicatedPooler, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('dedicated_pooler')

  useEffect(() => {
    // Redirect to pooler logs if org is not entitled to dedicated pooler
    if (!isLoadingEntitlement && !hasDedicatedPooler) {
      router.push(`/project/${ref}/logs/pooler-logs`)
    }
  }, [hasDedicatedPooler, isLoadingEntitlement, ref, router])

  // Prevent showing logs while checking entitlement
  if (isLoadingEntitlement || !hasDedicatedPooler) {
    return <LogoLoader />
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
