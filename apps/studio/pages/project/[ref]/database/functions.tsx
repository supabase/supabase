import { PermissionAction } from '@supabase/shared-types/out/constants'
import React, { useState } from 'react'

import { cn } from 'ui'
import { useIsInlineEditorEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { CreateFunction } from 'components/interfaces/Database/Functions/CreateFunction'
import { DeleteFunction } from 'components/interfaces/Database/Functions/DeleteFunction'
import FunctionsList from 'components/interfaces/Database/Functions/FunctionsList/FunctionsList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { PageContainer } from 'components/ui/PageContainer'
import { PageHeader } from 'components/ui/PageHeader'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { DatabaseFunction } from 'data/database-functions/database-functions-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import { useEditorPanelStateSnapshot } from 'state/editor-panel-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import type { NextPageWithLayout } from 'types'
import { PageSection } from 'components/ui/PageSection'

const DatabaseFunctionsPage: NextPageWithLayout = () => {
  const [selectedFunction, setSelectedFunction] = useState<DatabaseFunction | undefined>()
  const [showCreateFunctionForm, setShowCreateFunctionForm] = useState(false)
  const [showDeleteFunctionForm, setShowDeleteFunctionForm] = useState(false)
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
      setShowCreateFunctionForm(true)
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
      <PageContainer size="large">
        <PageSection.Root>
          <FunctionsList
            createFunction={createFunction}
            duplicateFunction={duplicateFunction}
            editFunction={editFunction}
            deleteFunction={deleteFunction}
          />
        </PageSection.Root>
      </PageContainer>
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
    </>
  )
}

DatabaseFunctionsPage.getLayout = (page: React.ReactElement) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">
      <PageHeader.Root size="large">
        <PageHeader.Summary>
          <PageHeader.Title>Database Functions</PageHeader.Title>
          <PageHeader.Description>Manage your database functions</PageHeader.Description>
        </PageHeader.Summary>
        <PageHeader.Aside>
          <DocsButton href={`${DOCS_URL}/guides/database/functions`} />
        </PageHeader.Aside>
      </PageHeader.Root>
      {page}
    </DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseFunctionsPage
