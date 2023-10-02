import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useEffect, useState } from 'react'

import { useParams } from 'common'
import DeleteHookModal from 'components/interfaces/Database/Hooks/DeleteHookModal'
import EditHookPanel from 'components/interfaces/Database/Hooks/EditHookPanel'
import HooksList from 'components/interfaces/Database/Hooks/HooksList/HooksList'
import { DatabaseLayout } from 'components/layouts'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import NoPermission from 'components/ui/NoPermission'
import { useHooksEnableMutation } from 'data/database/hooks-enable-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useCheckPermissions, useStore } from 'hooks'
import { NextPageWithLayout } from 'types'
import { IconLoader } from 'ui'

const HooksPage: NextPageWithLayout = () => {
  const { project } = useProjectContext()
  const { meta, ui } = useStore()

  const { ref: projectRef } = useParams()

  const {
    data: schemas,
    isLoading: isLoadingSchemas,
    refetch,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const [selectedHook, setSelectedHook] = useState<any>()
  const [showCreateHookForm, setShowCreateHookForm] = useState<boolean>(false)
  const [showDeleteHookForm, setShowDeleteHookForm] = useState<boolean>(false)

  const isHooksEnabled = schemas?.some((schema) => schema.name === 'supabase_functions')
  const canReadWebhooks = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'triggers')
  const canCreateWebhooks = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_WRITE, 'triggers')

  const { mutate: enableHooks, isLoading: isEnablingHooks } = useHooksEnableMutation({
    onSuccess: () => {
      refetch()
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
    if (!projectRef) return console.error('Project ref is required')
    enableHooks({ ref: projectRef })
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
        <p className="text-sm text-foreground-light">Checking if hooks are enabled</p>
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
          <p className="text-sm text-foreground-light">
            Database Webhooks can be used to trigger serverless functions or send requests to an
            HTTP endpoint.
          </p>
          <p className="text-sm text-foreground-light">Enable database webhooks on your project.</p>
        </ProductEmptyState>
      </div>
    )
  }

  return (
    <>
      <ScaffoldContainer className="h-full">
        <ScaffoldSection className="h-full">
          <div className="col-span-12">
            <HooksList createHook={createHook} editHook={editHook} deleteHook={deleteHook} />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
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
    </>
  )
}

HooksPage.getLayout = (page) => <DatabaseLayout title="Hooks">{page}</DatabaseLayout>

export default observer(HooksPage)
