import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'
import { parseAsBoolean, parseAsString, useQueryState } from 'nuqs'

import { useIsInlineEditorEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { CreateFunction } from 'components/interfaces/Database/Functions/CreateFunction'
import { DeleteFunction } from 'components/interfaces/Database/Functions/DeleteFunction'
import FunctionsList from 'components/interfaces/Database/Functions/FunctionsList/FunctionsList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { DatabaseFunction } from 'data/database-functions/database-functions-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import { useEditorPanelStateSnapshot } from 'state/editor-panel-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import type { NextPageWithLayout } from 'types'

const DatabaseFunctionsPage: NextPageWithLayout = () => {
  const [selectedFunction, setSelectedFunction] = useState<DatabaseFunction | undefined>()
  const [showCreateFunctionForm, setShowCreateFunctionForm] = useQueryState(
    'new',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push', clearOnDefault: true })
  )
  const [showEditFunctionForm, setShowEditFunctionForm] = useQueryState(
    'edit',
    parseAsString.withDefault('').withOptions({ history: 'push', clearOnDefault: true })
  )
  const [showDeleteFunctionForm, setShowDeleteFunctionForm] = useQueryState(
    'delete',
    parseAsString.withDefault('').withOptions({ history: 'push', clearOnDefault: true })
  )
  const [isDuplicating, setIsDuplicating] = useState(false)
  const isInlineEditorEnabled = useIsInlineEditorEnabled()
  const { openSidebar } = useSidebarManagerSnapshot()
  const {
    setValue: setEditorPanelValue,
    setTemplates: setEditorPanelTemplates,
    setInitialPrompt: setEditorPanelInitialPrompt,
  } = useEditorPanelStateSnapshot()

  const { can: canReadFunctions, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'functions'
  )

  const createFunction = () => {
    setIsDuplicating(false)
    if (isInlineEditorEnabled) {
      setEditorPanelInitialPrompt('Create a new database function that...')
      setEditorPanelValue(`create function function_name()
returns void
language plpgsql
as $$
begin
  -- Write your function logic here
end;
$$;`)
      setEditorPanelTemplates([])
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
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
      setEditorPanelInitialPrompt('Create new database function that...')
      setEditorPanelValue(dupFn.complete_statement)
      setEditorPanelTemplates([])
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setSelectedFunction(dupFn)
      setShowEditFunctionForm(dupFn.id.toString())
    }
  }

  const editFunction = (fn: DatabaseFunction) => {
    setIsDuplicating(false)
    if (isInlineEditorEnabled) {
      setEditorPanelValue(fn.complete_statement)
      setEditorPanelTemplates([])
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setSelectedFunction(fn)
      setShowEditFunctionForm(fn.id.toString())
    }
  }

  const deleteFunction = (fn: any) => {
    setSelectedFunction(fn)
    setShowDeleteFunctionForm(fn.id.toString())
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

      <CreateFunction
        func={selectedFunction}
        visible={!!showEditFunctionForm}
        onClose={() => {
          setShowEditFunctionForm('')
          setIsDuplicating(false)
        }}
        isDuplicating={isDuplicating}
      />

      <DeleteFunction
        func={selectedFunction}
        visible={!!showDeleteFunctionForm}
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
