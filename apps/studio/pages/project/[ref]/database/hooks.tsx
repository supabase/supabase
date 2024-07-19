import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import DeleteHookModal from 'components/interfaces/Database/Hooks/DeleteHookModal'
import EditHookPanel from 'components/interfaces/Database/Hooks/EditHookPanel'
import HooksList from 'components/interfaces/Database/Hooks/HooksList/HooksList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { useHooksEnableMutation } from 'data/database/hooks-enable-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import type { NextPageWithLayout } from 'types'

const HooksPage: NextPageWithLayout = () => {
  const { project } = useProjectContext()

  const { ref: projectRef } = useParams()

  const {
    data: schemas,
    isSuccess: isSchemasLoaded,
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
  const isPermissionsLoaded = usePermissionsLoaded()

  const { mutate: enableHooks, isLoading: isEnablingHooks } = useHooksEnableMutation({
    onSuccess: () => {
      refetch()
      toast.success('Successfully enabled webhooks')
    },
  })

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

  if (isPermissionsLoaded && !canReadWebhooks) {
    return <NoPermission isFullPage resourceText="view database webhooks" />
  }

  if (isSchemasLoaded && !isHooksEnabled) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <ProductEmptyState
          size="large"
          title="Database Webhooks"
          ctaButtonLabel="Enable webhooks"
          onClickCta={() => enableHooksForProject()}
          loading={isEnablingHooks}
          disabled={isEnablingHooks || (isPermissionsLoaded && !canReadWebhooks)}
          disabledMessage={
            isPermissionsLoaded && !canCreateWebhooks
              ? 'You need additional permissions to enable webhooks'
              : undefined
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
            <FormHeader
              title="Database Webhooks"
              description="Send real-time data from your database to another system whenever a table event occurs"
            />
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

export default HooksPage
