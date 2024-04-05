import { PostgresFunction } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { CreateFunction, DeleteFunction } from 'components/interfaces/Database'
import FunctionsList from 'components/interfaces/Database/Functions/FunctionsList/FunctionsList'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks'
import type { NextPageWithLayout } from 'types'

const FunctionsPage: NextPageWithLayout = () => {
  const [selectedFunction, setSelectedFunction] = useState<PostgresFunction | undefined>()
  const [showCreateFunctionForm, setShowCreateFunctionForm] = useState(false)
  const [showDeleteFunctionForm, setShowDeleteFunctionForm] = useState(false)

  const canReadFunctions = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'functions')
  const isPermissionsLoaded = usePermissionsLoaded()

  const createFunction = () => {
    setSelectedFunction(undefined)
    setShowCreateFunctionForm(true)
  }

  const editFunction = (fn: any) => {
    setSelectedFunction(fn)
    setShowCreateFunctionForm(true)
  }

  const deleteFunction = (fn: any) => {
    setSelectedFunction(fn)
    setShowDeleteFunctionForm(true)
  }

  if (isPermissionsLoaded && !canReadFunctions) {
    return <NoPermission isFullPage resourceText="view database functions" />
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <FormHeader title="Database Functions" />
            <FunctionsList
              createFunction={createFunction}
              editFunction={editFunction}
              deleteFunction={deleteFunction}
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
      <CreateFunction
        func={selectedFunction}
        visible={showCreateFunctionForm}
        setVisible={setShowCreateFunctionForm}
      />
      <DeleteFunction
        func={selectedFunction}
        visible={showDeleteFunctionForm}
        setVisible={setShowDeleteFunctionForm}
      />
    </>
  )
}

FunctionsPage.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default FunctionsPage
