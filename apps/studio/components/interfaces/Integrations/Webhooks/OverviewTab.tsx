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
import { Admonition } from 'ui-patterns'
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
    onSuccess: async () => {
      await refetch()
      toast.success('Successfully enabled webhooks')
    },
  })

  const enableHooksForProject = async () => {
    if (!projectRef) return console.error('Project ref is required')
    enableHooks({ ref: projectRef })
  }

  if (isPermissionsLoaded && !canReadWebhooks) {
    return (
      <div className="p-10">
        <NoPermission isFullPage resourceText="view database webhooks" />
      </div>
    )
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
              className="w-fit"
              onClick={() => enableHooksForProject()}
              disabled={!isPermissionsLoaded || isEnablingHooks}
              tooltip={{
                content: {
                  side: 'bottom',
                  text:
                    isPermissionsLoaded && !canReadWebhooks
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
