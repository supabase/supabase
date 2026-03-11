import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import NoPermission from 'components/ui/NoPermission'
import { useHooksEnableMutation } from 'data/database/hooks-enable-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { toast } from 'sonner'
import { Admonition } from 'ui-patterns'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { IntegrationOverviewTab } from '../Integration/IntegrationOverviewTab'

export const WebhooksOverviewTab = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const {
    data: schemas,
    isSuccess: isSchemasLoaded,
    refetch,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isHooksEnabled = schemas?.some((schema) => schema.name === 'supabase_functions')
  const { can: canReadWebhooks, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_READ,
    'triggers'
  )

  const { mutate: enableHooks, isPending: isEnablingHooks } = useHooksEnableMutation({
    onSuccess: async () => {
      await refetch()
      toast.success('Successfully enabled webhooks')
    },
  })

  const enableHooksForProject = async () => {
    if (!projectRef) return console.error('Project ref is required')
    enableHooks({ ref: projectRef })
  }

  if (!isSchemasLoaded || isLoadingPermissions) {
    return (
      <div className="p-10">
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (!canReadWebhooks) {
    return (
      <div className="p-10">
        <NoPermission isFullPage resourceText="view database webhooks" />
      </div>
    )
  }

  return (
    <IntegrationOverviewTab
      actions={
        isSchemasLoaded && isHooksEnabled ? null : (
          <Admonition
            showIcon={false}
            type="default"
            title="Enable database webhooks on your project"
          >
            <p>
              Database Webhooks can be used to trigger serverless functions or send requests to an
              HTTP endpoint
            </p>
            <ButtonTooltip
              className="mt-2 w-fit"
              onClick={() => enableHooksForProject()}
              disabled={isEnablingHooks}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canReadWebhooks
                    ? 'You need additional permissions to enable webhooks'
                    : undefined,
                },
              }}
            >
              Enable webhooks
            </ButtonTooltip>
          </Admonition>
        )
      }
    />
  )
}
