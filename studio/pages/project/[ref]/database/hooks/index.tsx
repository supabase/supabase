import { PermissionAction } from '@supabase/shared-types/out/constants'
import clsx from 'clsx'
import { useParams } from 'common'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'
import { IconLoader } from 'ui'

import DeleteHookModal from 'components/interfaces/Database/Hooks/DeleteHookModal'
import EditHookPanel from 'components/interfaces/Database/Hooks/EditHookPanel'
import HooksList from 'components/interfaces/Database/Hooks/HooksList/HooksList'
import { DatabaseLayout } from 'components/layouts'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import NoPermission from 'components/ui/NoPermission'
import { useHooksEnableMutation } from 'data/database/hooks-enable-mutation'
import { useCheckPermissions, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'

const HooksPage: NextPageWithLayout = () => {
  const { meta, ui } = useStore()

  const { ref } = useParams()
  const schemas = meta.schemas.list()
  const { isLoading: isLoadingSchemas } = meta.schemas

  const [selectedHook, setSelectedHook] = useState<any>()
  const [showCreateHookForm, setShowCreateHookForm] = useState<boolean>(false)
  const [showDeleteHookForm, setShowDeleteHookForm] = useState<boolean>(false)

  const isHooksEnabled = schemas.some((schema: any) => schema.name === 'supabase_functions')
  const canReadWebhooks = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'triggers')
  const canCreateWebhooks = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

  const { mutate: enableHooks, isLoading: isEnablingHooks } = useHooksEnableMutation({
    onSuccess: () => {
      meta.schemas.load()
      ui.setNotification({
        category: 'success',
        message: `Successfully enabled webhooks`,
      })
    },
  })

  useEffect(() => {
    if (ui.selectedProjectRef) meta.hooks.load()
  }, [ui.selectedProjectRef])

  const enableHooksForProject = async () => {
    if (!ref) return console.error('Project ref is required')
    enableHooks({ ref })
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

  if (isLoadingSchemas) {
    return (
      <div className="w-full h-full flex items-center justify-center space-x-2">
        <IconLoader className="animate-spin" size="tiny" strokeWidth={1.5} />
        <p className="text-sm text-scale-1100">Checking if hooks are enabled</p>
      </div>
    )
  }

  if (!isHooksEnabled) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ProductEmptyState
          size="large"
          title="Database Webhooks"
          ctaButtonLabel="Enable webhooks"
          onClickCta={() => enableHooksForProject()}
          loading={isEnablingHooks}
          disabled={isEnablingHooks || !canCreateWebhooks}
          disabledMessage={
            !canCreateWebhooks ? 'You need additional permissions to enable webhooks' : undefined
          }
        >
          <p className="text-sm text-scale-1100">
            Database Webhooks can be used to trigger serverless functions or send requests to an
            HTTP endpoint.
          </p>
          <p className="text-sm text-scale-1100">Enable database webhooks on your project.</p>
        </ProductEmptyState>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'mx-auto flex flex-col px-5 pt-6 pb-14',
        'lg:pt-8 lg:px-14 1xl:px-28 2xl:px-32 h-full'
      )}
    >
      <HooksList createHook={createHook} editHook={editHook} deleteHook={deleteHook} />
      <EditHookPanel
        visible={showCreateHookForm}
        selectedHook={selectedHook}
        onClose={() => setShowCreateHookForm(false)}
      />
      <DeleteHookModal
        visible={showDeleteHookForm}
        selectedHook={selectedHook}
        onClose={() => setShowDeleteHookForm(false)}
      />
    </div>
  )
}

HooksPage.getLayout = (page) => <DatabaseLayout title="Hooks">{page}</DatabaseLayout>

export default observer(HooksPage)
