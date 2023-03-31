import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions, useStore } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { CreateTrigger, DeleteTrigger } from 'components/interfaces/Database'
import TriggersList from 'components/interfaces/Database/Triggers/TriggersList/TriggersList'
import NoPermission from 'components/ui/NoPermission'

const TriggersPage: NextPageWithLayout = () => {
  const { meta, ui } = useStore()

  const [filterString, setFilterString] = useState<string>('')
  const [selectedTrigger, setSelectedTrigger] = useState<any>()
  const [showCreateTriggerForm, setShowCreateTriggerForm] = useState<boolean>(false)
  const [showDeleteTriggerForm, setShowDeleteTriggerForm] = useState<boolean>(false)

  const canReadTriggers = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'triggers')

  useEffect(() => {
    if (ui.selectedProject?.ref) {
      fetchTriggers()
    }
  }, [ui.selectedProject?.ref])

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
      <TriggersList
        filterString={filterString}
        setFilterString={setFilterString}
        createTrigger={createTrigger}
        editTrigger={editTrigger}
        deleteTrigger={deleteTrigger}
      />
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
