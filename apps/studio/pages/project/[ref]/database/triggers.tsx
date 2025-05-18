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
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { useAppStateSnapshot } from 'state/app-state'
import type { NextPageWithLayout } from 'types'

const TriggersPage: NextPageWithLayout = () => {
  const { setEditorPanel } = useAppStateSnapshot()
  const isInlineEditorEnabled = useIsInlineEditorEnabled()

  const [selectedTrigger, setSelectedTrigger] = useState<PostgresTrigger>()
  const [showCreateTriggerForm, setShowCreateTriggerForm] = useState<boolean>(false)
  const [showDeleteTriggerForm, setShowDeleteTriggerForm] = useState<boolean>(false)

  const canReadTriggers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'triggers')
  const isPermissionsLoaded = usePermissionsLoaded()

  const createTrigger = () => {
    if (isInlineEditorEnabled) {
      setEditorPanel({
        open: true,
        initialValue: `create trigger trigger_name
after insert or update or delete on table_name
for each row
execute function function_name();`,
        label: 'Create new database trigger',
        saveLabel: 'Create trigger',
        initialPrompt: 'Create a new database trigger that...',
      })
    } else {
      setSelectedTrigger(undefined)
      setShowCreateTriggerForm(true)
    }
  }

  const editTrigger = (trigger: PostgresTrigger) => {
    if (isInlineEditorEnabled) {
      const sql = generateTriggerCreateSQL(trigger)
      setEditorPanel({
        open: true,
        initialValue: sql,
        label: `Edit trigger "${trigger.name}"`,
        saveLabel: 'Update trigger',
        initialPrompt: `Update the database trigger "${trigger.name}" to...`,
      })
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
              docsUrl="https://supabase.com/docs/guides/database/postgres/triggers"
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
    </>
  )
}

TriggersPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default TriggersPage
