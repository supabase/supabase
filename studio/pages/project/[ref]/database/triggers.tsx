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

const TriggersPage: NextPageWithLayout = () => {
  const { meta } = useStore()
  const { project } = useProjectContext()

  const [filterString, setFilterString] = useState<string>('')
  const [selectedTrigger, setSelectedTrigger] = useState<any>()
  const [showCreateTriggerForm, setShowCreateTriggerForm] = useState<boolean>(false)
  const [showDeleteTriggerForm, setShowDeleteTriggerForm] = useState<boolean>(false)

  const canReadTriggers = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'triggers')

  useEffect(() => {
    if (project?.ref) {
      fetchTriggers()
    }
  }, [project?.ref])

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
