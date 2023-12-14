import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'

import { CreateTrigger, DeleteTrigger } from 'components/interfaces/Database'
import TriggersList from 'components/interfaces/Database/Triggers/TriggersList/TriggersList'
import { DatabaseLayout } from 'components/layouts'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks'
import { NextPageWithLayout } from 'types'

const TriggersPage: NextPageWithLayout = () => {
  const [selectedTrigger, setSelectedTrigger] = useState<any>()
  const [showCreateTriggerForm, setShowCreateTriggerForm] = useState<boolean>(false)
  const [showDeleteTriggerForm, setShowDeleteTriggerForm] = useState<boolean>(false)

  const canReadTriggers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'triggers')
  const isPermissionsLoaded = usePermissionsLoaded()

  const createTrigger = () => {
    setSelectedTrigger(undefined)
    setShowCreateTriggerForm(true)
  }

  const editTrigger = (trigger: any) => {
    setSelectedTrigger(trigger)
    setShowCreateTriggerForm(true)
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
            <h3 className="mb-4 text-xl text-foreground">Database Triggers</h3>
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

TriggersPage.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default TriggersPage
