import { PermissionAction } from '@supabase/shared-types/out/constants'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useHooksEnableMutation } from 'data/database/hooks-enable-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, WarningIcon } from 'ui'
import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'

export const WebhooksOverviewTab = () => {
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

  const isHooksEnabled = schemas?.some((schema) => schema.name === 'supabase_functions')
  const canReadWebhooks = useCheckPermissions(PermissionAction.TENANT_SQL_ADMIN_READ, 'triggers')
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

  if (isPermissionsLoaded && !canReadWebhooks) {
    return <NoPermission isFullPage resourceText="view database webhooks" />
  }

  if (!isSchemasLoaded) {
    return (
      <div className="p-10">
        <GenericSkeletonLoader />
      </div>
    )
  }

  return (
    <IntegrationOverviewTab
      actions={
        isSchemasLoaded && isHooksEnabled ? null : (
          <div className="px-10">
            <Alert_Shadcn_ variant="warning">
              <WarningIcon />
              <AlertTitle_Shadcn_>Enable database webhooks on your project</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_ className="flex gap-2 flex-col">
                <span>
                  Database Webhooks can be used to trigger serverless functions or send requests to
                  an HTTP endpoint.
                </span>
                <ButtonTooltip
                  className="w-fit"
                  onClick={() => enableHooksForProject()}
                  disabled={!isPermissionsLoaded || isEnablingHooks}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text:
                        isPermissionsLoaded && !isEnablingHooks
                          ? 'You need additional permissions to enable webhooks'
                          : undefined,
                    },
                  }}
                >
                  Enable webhooks
                </ButtonTooltip>
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          </div>
        )
      }
    />
  )
}
