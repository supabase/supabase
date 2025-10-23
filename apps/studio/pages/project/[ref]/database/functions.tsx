import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { useIsInlineEditorEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { CreateFunction, DeleteFunction } from 'components/interfaces/Database'
import FunctionsList from 'components/interfaces/Database/Functions/FunctionsList/FunctionsList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { DatabaseFunction } from 'data/database-functions/database-functions-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import { editorPanelState } from 'state/editor-panel-state'
import { SIDEBAR_KEYS, sidebarManagerState } from 'state/sidebar-manager-state'
import type { NextPageWithLayout } from 'types'

const DatabaseFunctionsPage: NextPageWithLayout = () => {
  const [selectedFunction, setSelectedFunction] = useState<DatabaseFunction | undefined>()
  const [showCreateFunctionForm, setShowCreateFunctionForm] = useState(false)
  const [showDeleteFunctionForm, setShowDeleteFunctionForm] = useState(false)
  const isInlineEditorEnabled = useIsInlineEditorEnabled()

  const { can: canReadFunctions, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'functions'
  )

  const createFunction = () => {
    if (isInlineEditorEnabled) {
      editorPanelState.configure({
        sql: `create function function_name()
returns void
language plpgsql
as $$
begin
  -- Write your function logic here
end;
$$;`,
        label: 'Create new database function',
        prompt: 'Create a new database function that...',
      })
      sidebarManagerState.openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setSelectedFunction(undefined)
      setShowCreateFunctionForm(true)
    }
  }

  const editFunction = (fn: DatabaseFunction) => {
    if (isInlineEditorEnabled) {
      editorPanelState.configure({
        sql: fn.complete_statement,
        label: `Edit function "${fn.name}"`,
        prompt: `Update the database function "${fn.name}" to...`,
      })
      sidebarManagerState.openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
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
              docsUrl={`${DOCS_URL}/guides/database/functions`}
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

DatabaseFunctionsPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseFunctionsPage
