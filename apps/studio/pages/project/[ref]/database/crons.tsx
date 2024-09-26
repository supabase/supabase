import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { CronjobsTable } from 'components/interfaces/Database/Cronjobs/CronjobsTable'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { DatabaseFunction } from 'data/database-functions/database-functions-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const FunctionsPage: NextPageWithLayout = () => {
  const [selectedFunction, setSelectedFunction] = useState<DatabaseFunction | undefined>()
  const [showCreateFunctionForm, setShowCreateFunctionForm] = useState(false)
  const [showDeleteFunctionForm, setShowDeleteFunctionForm] = useState(false)

  const canReadFunctions = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'functions')
  const isPermissionsLoaded = usePermissionsLoaded()

  if (isPermissionsLoaded && !canReadFunctions) {
    return <NoPermission isFullPage resourceText="manage database cronjobs" />
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <FormHeader title="Cron jobs" />
            <CronjobsTable />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}

FunctionsPage.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default FunctionsPage
