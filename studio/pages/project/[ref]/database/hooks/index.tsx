import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { NextPageWithLayout } from 'types'
import { checkPermissions, useStore } from 'hooks'
import { API_URL } from 'lib/constants'
import { post } from 'lib/common/fetch'
import { DatabaseLayout } from 'components/layouts'
import NoPermission from 'components/ui/NoPermission'
import CreateHook from 'components/interfaces/Database/Hooks/CreateHook'
import DeleteHook from 'components/interfaces/Database/Hooks/DeleteHook'
import HooksList from 'components/interfaces/Database/Hooks/HooksList/HooksList'

const HooksPage: NextPageWithLayout = () => {
  const { meta, ui } = useStore()

  const router = useRouter()
  const { ref } = router.query

  const [hooksEnabled, setHooksEnabled] = useState<any>(false)
  const [filterString, setFilterString] = useState<string>('')
  const [selectedHook, setSelectedHook] = useState<any>()
  const [showCreateHookForm, setShowCreateHookForm] = useState<boolean>(false)
  const [showDeleteHookForm, setShowDeleteHookForm] = useState<boolean>(false)

  const canReadWebhooks = checkPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'triggers')

  useEffect(() => {
    if (ui.selectedProject?.ref) {
      fetchHooks()
    }
  }, [ui.selectedProject?.ref])

  const fetchHooks = async () => {
    meta.hooks.load()
  }

  const enableHooksForProject = async () => {
    const headers: any = {}
    const connectionString = ui.selectedProject?.connectionString
    if (connectionString) headers['x-connection-encrypted'] = connectionString
    try {
      await post(`${API_URL}/database/${ref}/hook-enable`, {})
      setHooksEnabled(true)
    } catch (error) {
      console.error(error)
    }
  }

  const createHook = () => {
    setSelectedHook(undefined)
    setShowCreateHookForm(true)
  }

  const editHook = (hook: any) => {
    setSelectedHook(hook)
    setShowCreateHookForm(true)
  }

  const deleteHook = (hook: any) => {
    setSelectedHook(hook)
    setShowDeleteHookForm(true)
  }

  if (!canReadWebhooks) {
    return <NoPermission isFullPage resourceText="view database webhooks" />
  }

  return (
    <>
      <HooksList
        hooksEnabled={hooksEnabled}
        filterString={filterString}
        setFilterString={setFilterString}
        createHook={createHook}
        editHook={editHook}
        deleteHook={deleteHook}
        enableHooks={enableHooksForProject}
      />
      <CreateHook
        hook={selectedHook}
        visible={showCreateHookForm}
        setVisible={setShowCreateHookForm}
      />
      <DeleteHook
        hook={selectedHook}
        visible={showDeleteHookForm}
        setVisible={setShowDeleteHookForm}
      />
    </>
  )
}

HooksPage.getLayout = (page) => <DatabaseLayout title="Hooks">{page}</DatabaseLayout>

export default observer(HooksPage)
