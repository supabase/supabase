import { PostgresTrigger } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { useIsInlineEditorEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { DeleteTrigger } from 'components/interfaces/Database/Triggers/DeleteTrigger'
import { TriggerSheet } from 'components/interfaces/Database/Triggers/TriggerSheet'
import { generateTriggerCreateSQL } from 'components/interfaces/Database/Triggers/TriggersList/TriggerList.utils'
import TriggersList from 'components/interfaces/Database/Triggers/TriggersList/TriggersList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { EditorPanel } from 'components/ui/EditorPanel/EditorPanel'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DOCS_URL } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

const TriggersPage: NextPageWithLayout = () => {
  const isInlineEditorEnabled = useIsInlineEditorEnabled()

  const [selectedTrigger, setSelectedTrigger] = useState<PostgresTrigger>()
  const [showCreateTriggerForm, setShowCreateTriggerForm] = useState<boolean>(false)
  const [showDeleteTriggerForm, setShowDeleteTriggerForm] = useState<boolean>(false)

  // Local editor panel state
  const [editorPanelOpen, setEditorPanelOpen] = useState(false)
  const [selectedTriggerForEditor, setSelectedTriggerForEditor] = useState<PostgresTrigger>()

  const { can: canReadTriggers, isSuccess: isPermissionsLoaded } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'triggers'
  )

  const createTrigger = () => {
    if (isInlineEditorEnabled) {
      setSelectedTriggerForEditor(undefined)
      setEditorPanelOpen(true)
    } else {
      setSelectedTrigger(undefined)
      setShowCreateTriggerForm(true)
    }
  }

  const editTrigger = (trigger: PostgresTrigger) => {
    if (isInlineEditorEnabled) {
      setSelectedTriggerForEditor(trigger)
      setEditorPanelOpen(true)
    } else {
      setSelectedTrigger(trigger)
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
              deleteTrigger={deleteTrigger}
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
      <TriggerSheet
        selectedTrigger={selectedTrigger}
        open={showCreateTriggerForm}
        setOpen={setShowCreateTriggerForm}
      />
      <DeleteTrigger
        trigger={selectedTrigger}
        visible={showDeleteTriggerForm}
        setVisible={setShowDeleteTriggerForm}
      />

      <EditorPanel
        open={editorPanelOpen}
        onRunSuccess={() => {
          setEditorPanelOpen(false)
          setSelectedTriggerForEditor(undefined)
        }}
        onClose={() => {
          setEditorPanelOpen(false)
          setSelectedTriggerForEditor(undefined)
        }}
        initialValue={
          selectedTriggerForEditor
            ? generateTriggerCreateSQL(selectedTriggerForEditor)
            : `create trigger trigger_name
after insert or update or delete on table_name
for each row
execute function function_name();`
        }
        label={
          selectedTriggerForEditor
            ? `Edit trigger "${selectedTriggerForEditor.name}"`
            : 'Create new database trigger'
        }
        initialPrompt={
          selectedTriggerForEditor
            ? `Update the database trigger "${selectedTriggerForEditor.name}" to...`
            : 'Create a new database trigger that...'
        }
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
