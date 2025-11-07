import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useIsInlineEditorEnabled } from 'components/interfaces/Account/Preferences/InlineEditorSettings'
import { CreateFunction } from 'components/interfaces/Database/Functions/CreateFunction'
import { DeleteFunction } from 'components/interfaces/Database/Functions/DeleteFunction'
import FunctionsList from 'components/interfaces/Database/Functions/FunctionsList/FunctionsList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const DatabaseFunctionsPage: NextPageWithLayout = () => {
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

  const [isDuplicating, setIsDuplicating] = useState(false)
  const [selectedFunction, setSelectedFunction] = useState<DatabaseFunction | undefined>()
  const [showCreateFunctionForm, setShowCreateFunctionForm] = useState(false)
  const [showDeleteFunctionForm, setShowDeleteFunctionForm] = useState(false)

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
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <FormHeader
            title="Database Functions"
            docsUrl={`${DOCS_URL}/guides/database/functions`}
          />
          <FunctionsList />
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabaseFunctionsPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseFunctionsPage
