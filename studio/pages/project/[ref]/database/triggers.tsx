import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import { CreateTrigger, DeleteTrigger } from 'components/interfaces/Database'
import TriggersList from 'components/interfaces/Database/Triggers/TriggersList/TriggersList'
import { DatabaseLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'

const TriggersPage: NextPageWithLayout = () => {
  const { meta, ui } = useStore()
  const { project } = useProjectContext()

  const [selectedTrigger, setSelectedTrigger] = useState<any>()
  const [showCreateTriggerForm, setShowCreateTriggerForm] = useState<boolean>(false)
  const [showDeleteTriggerForm, setShowDeleteTriggerForm] = useState<boolean>(false)

  const canReadTriggers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'triggers')

  useEffect(() => {
    if (ui.selectedProjectRef) fetchTriggers()
  }, [ui.selectedProjectRef])

  const fetchTriggers = async () => {
    meta.triggers.load()
  }

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

  if (!canReadTriggers) {
    return <NoPermission isFullPage resourceText="view database triggers" />
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <div className="mb-4">
              <h3 className="mb-1 text-xl text-foreground">Database Triggers</h3>
            </div>
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

export default observer(TriggersPage)
