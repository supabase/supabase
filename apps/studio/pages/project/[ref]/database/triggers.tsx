import { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { useIsInlineEditorEnabled } from 'components/interfaces/Account/Preferences/InlineEditorSettings'
import { DeleteTrigger } from 'components/interfaces/Database/Triggers/DeleteTrigger'
import { TriggerSheet } from 'components/interfaces/Database/Triggers/TriggerSheet'
import { generateTriggerCreateSQL } from 'components/interfaces/Database/Triggers/TriggersList/TriggerList.utils'
import { TriggersList } from 'components/interfaces/Database/Triggers/TriggersList/TriggersList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import { useEditorPanelStateSnapshot } from 'state/editor-panel-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import type { NextPageWithLayout } from 'types'

const TriggersPage: NextPageWithLayout = () => {
  const isInlineEditorEnabled = useIsInlineEditorEnabled()
  const { openSidebar } = useSidebarManagerSnapshot()
  const {
    templates: editorPanelTemplates,
    setValue: setEditorPanelValue,
    setTemplates: setEditorPanelTemplates,
    setInitialPrompt: setEditorPanelInitialPrompt,
  } = useEditorPanelStateSnapshot()

  const [selectedTrigger, setSelectedTrigger] = useState<PostgresTrigger>()
  const [isDuplicatingTrigger, setIsDuplicatingTrigger] = useState<boolean>(false)

  const [showCreateTriggerForm, setShowCreateTriggerForm] = useState<boolean>(false)
  const [showDeleteTriggerForm, setShowDeleteTriggerForm] = useState<boolean>(false)

  const { can: canReadTriggers, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'triggers'
  )

  const createTrigger = () => {
    setIsDuplicatingTrigger(false)
    if (isInlineEditorEnabled) {
      setEditorPanelInitialPrompt('Create a new database trigger that...')
      setEditorPanelValue(`create trigger trigger_name
after insert or update or delete on table_name
for each row
execute function function_name();`)
      if (editorPanelTemplates.length > 0) {
        setEditorPanelTemplates([])
      }
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setSelectedTrigger(undefined)
      setShowCreateTriggerForm(true)
    }
  }

  const editTrigger = (trigger: PostgresTrigger) => {
    setIsDuplicatingTrigger(false)
    if (isInlineEditorEnabled) {
      setEditorPanelValue(generateTriggerCreateSQL(trigger))
      setEditorPanelTemplates([])
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setSelectedTrigger(trigger)
      setShowCreateTriggerForm(true)
    }
  }

  const duplicateTrigger = (trigger: PostgresTrigger) => {
    setIsDuplicatingTrigger(true)

    const dupTrigger = {
      ...trigger,
      name: `${trigger.name}_duplicate`,
    }

    if (isInlineEditorEnabled) {
      setEditorPanelValue(generateTriggerCreateSQL(dupTrigger))
      setEditorPanelTemplates([])
      openSidebar(SIDEBAR_KEYS.EDITOR_PANEL)
    } else {
      setSelectedTrigger(dupTrigger)
      setShowCreateTriggerForm(true)
    }
  }

  const deleteTrigger = (trigger: PostgresTrigger) => {
    setSelectedTrigger(trigger)
    setShowDeleteTriggerForm(true)
  }

  if (isPermissionsLoaded && !canReadTriggers) {
    return <NoPermission isFullPage resourceText="view database triggers" />
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <FormHeader
              title="Database Triggers"
              description="Execute a set of actions automatically on specified table events"
              docsUrl={`${DOCS_URL}/guides/database/postgres/triggers`}
            />
            <TriggersList
              createTrigger={createTrigger}
              editTrigger={editTrigger}
              duplicateTrigger={duplicateTrigger}
              deleteTrigger={deleteTrigger}
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
      <TriggerSheet
        selectedTrigger={selectedTrigger}
        open={showCreateTriggerForm}
        onClose={() => {
          setIsDuplicatingTrigger(false)
          setShowCreateTriggerForm(false)
        }}
        isDuplicatingTrigger={isDuplicatingTrigger}
      />
      <DeleteTrigger
        trigger={selectedTrigger}
        visible={showDeleteTriggerForm}
        setVisible={setShowDeleteTriggerForm}
      />
    </>
  )
}

TriggersPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default TriggersPage
