import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { CreateFunction, DeleteFunction } from 'components/interfaces/Database'
import FunctionsList from 'components/interfaces/Database/Functions/FunctionsList/FunctionsList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { DatabaseFunction } from 'data/database-functions/database-functions-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useIsInlineEditorEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useAppStateSnapshot } from 'state/app-state'

const FunctionsPage: NextPageWithLayout = () => {
  const [selectedFunction, setSelectedFunction] = useState<DatabaseFunction | undefined>()
  const [showCreateFunctionForm, setShowCreateFunctionForm] = useState(false)
  const [showDeleteFunctionForm, setShowDeleteFunctionForm] = useState(false)
  const { setEditorPanel } = useAppStateSnapshot()
  const isInlineEditorEnabled = useIsInlineEditorEnabled()

  const canReadFunctions = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'functions')
  const isPermissionsLoaded = usePermissionsLoaded()

  const createFunction = () => {
    if (isInlineEditorEnabled) {
      setEditorPanel({
        open: true,
        initialValue: `create function function_name()
returns void
language plpgsql
as $$
begin
  -- Write your function logic here
end;
$$;`,
        label: 'Create new database function',
        saveLabel: 'Create function',
        initialPrompt: 'Create a new database function that...',
      })
    } else {
      setSelectedFunction(undefined)
      setShowCreateFunctionForm(true)
    }
  }

  const editFunction = (fn: DatabaseFunction) => {
    if (isInlineEditorEnabled) {
      setEditorPanel({
        open: true,
        initialValue: fn.complete_statement,
        label: `Edit function "${fn.name}"`,
        saveLabel: 'Update function',
        initialPrompt: `Update the database function "${fn.name}" to...`,
      })
    } else {
      setSelectedFunction(fn)
      setShowCreateFunctionForm(true)
    }
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
            <FormHeader
              title="Database Functions"
              docsUrl="https://supabase.com/docs/guides/database/functions"
            />
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

FunctionsPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default FunctionsPage
