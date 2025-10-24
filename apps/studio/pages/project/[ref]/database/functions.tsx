import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { useIsInlineEditorEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { CreateFunction, DeleteFunction } from 'components/interfaces/Database'
import FunctionsList from 'components/interfaces/Database/Functions/FunctionsList/FunctionsList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { EditorPanel } from 'components/ui/EditorPanel/EditorPanel'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { DatabaseFunction } from 'data/database-functions/database-functions-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const DatabaseFunctionsPage: NextPageWithLayout = () => {
  const [selectedFunction, setSelectedFunction] = useState<DatabaseFunction | undefined>()
  const [showCreateFunctionForm, setShowCreateFunctionForm] = useState(false)
  const [showDeleteFunctionForm, setShowDeleteFunctionForm] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const isInlineEditorEnabled = useIsInlineEditorEnabled()

  // Local editor panel state
  const [editorPanelOpen, setEditorPanelOpen] = useState(false)
  const [selectedFunctionForEditor, setSelectedFunctionForEditor] = useState<
    DatabaseFunction | undefined
  >()

  const { can: canReadFunctions, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'functions'
  )

  const createFunction = () => {
    if (isInlineEditorEnabled) {
      setSelectedFunctionForEditor(undefined)
      setEditorPanelOpen(true)
    } else {
      setSelectedFunction(undefined)
      setShowCreateFunctionForm(true)
    }
  }

  const duplicateFunction = (fn: DatabaseFunction) => {
    setIsDuplicating(true)

    const dupFn = {
      ...fn,
      name: `${fn.name}_duplicate`,
    }

    if (isInlineEditorEnabled) {
      setSelectedFunctionForEditor(dupFn)
      setEditorPanelOpen(true)
    } else {
      setSelectedFunction(dupFn)
      setShowCreateFunctionForm(true)
    }
  }

  const editFunction = (fn: DatabaseFunction) => {
    if (isInlineEditorEnabled) {
      setSelectedFunctionForEditor(fn)
      setEditorPanelOpen(true)
    } else {
      setSelectedFunction(fn)
      setShowCreateFunctionForm(true)
    }
  }

  const deleteFunction = (fn: any) => {
    setSelectedFunction(fn)
    setShowDeleteFunctionForm(true)
  }

  const resetEditorPanel = () => {
    setIsDuplicating(false)
    setEditorPanelOpen(false)
    setSelectedFunctionForEditor(undefined)
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
              duplicateFunction={duplicateFunction}
              editFunction={editFunction}
              deleteFunction={deleteFunction}
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
      <CreateFunction
        func={selectedFunction}
        visible={showCreateFunctionForm}
        onClose={() => {
          setShowCreateFunctionForm(false)
          setIsDuplicating(false)
        }}
        isDuplicating={isDuplicating}
      />
      <DeleteFunction
        func={selectedFunction}
        visible={showDeleteFunctionForm}
        setVisible={setShowDeleteFunctionForm}
      />

      <EditorPanel
        open={editorPanelOpen}
        onRunSuccess={resetEditorPanel}
        onClose={resetEditorPanel}
        initialValue={
          selectedFunctionForEditor
            ? selectedFunctionForEditor.complete_statement
            : `create function function_name()
returns void
language plpgsql
as $$
begin
  -- Write your function logic here
end;
$$;`
        }
        label={
          selectedFunctionForEditor
            ? isDuplicating
              ? `Duplicate function "${selectedFunctionForEditor.name}"`
              : `Edit function "${selectedFunctionForEditor.name}"`
            : 'Create new database function'
        }
        initialPrompt={
          selectedFunctionForEditor
            ? isDuplicating
              ? `Duplicate the database function "${selectedFunctionForEditor.name}" to...`
              : `Update the database function "${selectedFunctionForEditor.name}" to...`
            : 'Create a new database function that...'
        }
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
