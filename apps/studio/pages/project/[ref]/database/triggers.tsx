import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { CreateTrigger, DeleteTrigger } from 'components/interfaces/Database'
import TriggersList from 'components/interfaces/Database/Triggers/TriggersList/TriggersList'
import { generateTriggerCreateSQL } from 'components/interfaces/Database/Triggers/TriggersList/TriggerList.utils'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useIsInlineEditorEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useAppStateSnapshot } from 'state/app-state'

const TriggersPage: NextPageWithLayout = () => {
  const [selectedTrigger, setSelectedTrigger] = useState<any>()
  const [showCreateTriggerForm, setShowCreateTriggerForm] = useState<boolean>(false)
  const [showDeleteTriggerForm, setShowDeleteTriggerForm] = useState<boolean>(false)
  const { setEditorPanel } = useAppStateSnapshot()
  const isInlineEditorEnabled = useIsInlineEditorEnabled()

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

  const editTrigger = (trigger: any) => {
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

  const deleteTrigger = (trigger: any) => {
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
      <CreateTrigger
        trigger={selectedTrigger}
        visible={showCreateTriggerForm}
        setVisible={setShowCreateTriggerForm}
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
