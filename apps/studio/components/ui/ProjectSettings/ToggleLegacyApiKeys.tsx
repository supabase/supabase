import { useState } from 'react'
import { toast } from 'sonner'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useToggleLegacyAPIKeysMutation } from 'data/api-keys/legacy-api-key-toggle-mutation'
import { useLegacyAPIKeysStatusQuery } from 'data/api-keys/legacy-api-keys-status-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, CriticalIcon } from 'ui'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

export const ToggleLegacyApiKeysPanel = () => {
  const { project } = useProjectContext()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { data: legacyAPIKeysStatusData, isSuccess: isLegacyAPIKeysStatusSuccess } =
    useLegacyAPIKeysStatusQuery({ projectRef: project!.ref })

  const { can: canUpdateAPIKeys, isSuccess: isPermissionsSuccess } =
    useAsyncCheckProjectPermissions(PermissionAction.SECRETS_WRITE, '*')

  if (!(isLegacyAPIKeysStatusSuccess && isPermissionsSuccess)) {
    return null
  }

  return (
    <section>
      <Alert_Shadcn_ variant={legacyAPIKeysStatusData.enabled ? 'destructive' : 'warning'}>
        <CriticalIcon />
        <AlertTitle_Shadcn_>
          {legacyAPIKeysStatusData.enabled
            ? 'Disabling your legacy API keys may cause your applications to break.'
            : 'Re-enabling your legacy API keys may expose your applications to security risks.'}
        </AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>
          {legacyAPIKeysStatusData.enabled
            ? 'Make sure you are no longer using your legacy API keys before proceeding.'
            : "Make sure you've tested your RLS policies."}
        </AlertDescription_Shadcn_>
        <div className="mt-2">
          <ButtonTooltip
            type={legacyAPIKeysStatusData.enabled ? 'danger' : 'warning'}
            onClick={() => setIsConfirmOpen(true)}
            disabled={!canUpdateAPIKeys}
            tooltip={{
              content: {
                side: 'bottom',
                text: !canUpdateAPIKeys
                  ? 'You need additional permissions to enable or disable JWT-based API keys'
                  : undefined,
              },
            }}
          >
            {legacyAPIKeysStatusData.enabled
              ? 'Disable JWT-based API keys'
              : 'Re-enable JWT-based API keys'}
          </ButtonTooltip>
        </div>
      </Alert_Shadcn_>

      <ToggleApiKeysModal
        visible={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        legacyAPIKeysStatusData={legacyAPIKeysStatusData}
      />
    </section>
  )
}

const ToggleApiKeysModal = ({
  visible,
  onClose,
  legacyAPIKeysStatusData,
}: {
  visible: boolean
  onClose: () => void
  legacyAPIKeysStatusData: { enabled: boolean }
}) => {
  const { project } = useProjectContext()

  const { mutate: toggleLegacyAPIKey, isLoading: isTogglingLegacyAPIKey } =
    useToggleLegacyAPIKeysMutation()

  const onToggleLegacyAPIKeysEnabled = () => {
    const enabled = !legacyAPIKeysStatusData?.enabled

    toggleLegacyAPIKey(
      { projectRef: project!.ref, enabled },
      {
        onSuccess: () => {
          toast.success(
            enabled
              ? 'Your anon and service_role keys have been re-enabled!'
              : 'Your anon and service_role keys have been disabled!'
          )
          onClose()
        },
      }
    )
  }

  return (
    <TextConfirmModal
      visible={visible}
      onCancel={() => onClose()}
      onConfirm={onToggleLegacyAPIKeysEnabled}
      title={
        legacyAPIKeysStatusData.enabled ? 'Disable JWT-based keys' : 'Re-enable JWT-based keys'
      }
      confirmString={legacyAPIKeysStatusData.enabled ? 'disable' : 're-enable'}
      confirmLabel={`Yes, ${legacyAPIKeysStatusData.enabled ? 'disable' : 're-enable'} anon and service_role`}
      confirmPlaceholder={legacyAPIKeysStatusData.enabled ? 'disable' : 're-enable'}
      loading={isTogglingLegacyAPIKey}
      variant={legacyAPIKeysStatusData.enabled ? 'destructive' : 'default'}
      alert={
        legacyAPIKeysStatusData.enabled
          ? {
              title: 'Disabling can cause downtime!',
              description: `If you disable your anon and service_role keys while they are in use, your applications will stop functioning. All API endpoints will receive HTTP 401 Unauthorized. Make sure you are no longer using them before proceeding.`,
            }
          : {
              title: 'Prefer publishable and secret keys',
              description:
                'While re-enabling anon and service_role keys makes sense in some cases, a better and more secure alternative is the publishable or secret key. Consider using those before proceeding!',
            }
      }
    />
  )
}
