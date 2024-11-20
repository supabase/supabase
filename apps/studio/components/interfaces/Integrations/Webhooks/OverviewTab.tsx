import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import NoPermission from 'components/ui/NoPermission'
import { useHooksEnableMutation } from 'data/database/hooks-enable-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useCheckPermissions, usePermissionsLoaded } from 'hooks/misc/useCheckPermissions'
import { toast } from 'sonner'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, WarningIcon } from 'ui'
import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'
import { INTEGRATIONS } from '../Landing/Integrations.constants'

export const WebhooksOverviewTab = () => {
  const { project } = useProjectContext()
  const { ref: projectRef } = useParams()

  const integration = INTEGRATIONS.find((i) => i.id === 'webhooks')!

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
    return <div>Loading</div>
  }

  console.log(isPermissionsLoaded, isEnablingHooks)

  return (
    <IntegrationOverviewTab integration={integration}>
      {isSchemasLoaded && isHooksEnabled ? (
        <div>This integration depends on database webhooks which are enabled on this project.</div>
      ) : (
        <Alert_Shadcn_ variant="warning">
          <WarningIcon />
          <AlertTitle_Shadcn_>Enable database webhooks on your project</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_ className="flex gap-2 flex-col">
            <span>
              Database Webhooks can be used to trigger serverless functions or send requests to an
              HTTP endpoint.
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
      )}
    </IntegrationOverviewTab>
  )
}
