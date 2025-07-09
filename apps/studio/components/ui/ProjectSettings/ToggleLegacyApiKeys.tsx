import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useToggleLegacyAPIKeysMutation } from 'data/api-keys/legacy-api-key-toggle-mutation'
import { useLegacyAPIKeysStatusQuery } from 'data/api-keys/legacy-api-keys-status-query'
import { useLegacyJWTSigningKeyQuery } from 'data/jwt-signing-keys/legacy-jwt-signing-key-query'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
import Panel from '../Panel'

export const ToggleLegacyApiKeysPanel = () => {
  const { ref: projectRef } = useParams()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const { data: legacyAPIKeysStatusData, isSuccess: isLegacyAPIKeysStatusSuccess } =
    useLegacyAPIKeysStatusQuery({ projectRef })

  const { data: legacyJWTSecret } = useLegacyJWTSigningKeyQuery({ projectRef })

  const { can: canUpdateAPIKeys, isSuccess: isPermissionsSuccess } =
    useAsyncCheckProjectPermissions(PermissionAction.SECRETS_WRITE, '*')

  const { enabled: isLegacyKeysEnabled } = legacyAPIKeysStatusData || {}

  if (!(isLegacyAPIKeysStatusSuccess && isPermissionsSuccess)) {
    return null
  }

  return (
    <section>
      <Panel>
        <Panel.Content>
          <div className="flex justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-sm">
                {isLegacyKeysEnabled ? 'Disable legacy API keys' : 'Re-enabling legacy API keys'}
              </p>
              <p className="text-foreground-light text-sm">
                {isLegacyKeysEnabled
                  ? 'Make sure you are no longer using your legacy API keys before proceeding.'
                  : 'We recommend you use the new API keys whenever possible, but re-enabling is an option.'}
              </p>
            </div>
            <div className="flex items-center">
              <ButtonTooltip
                type="default"
                onClick={() => setIsConfirmOpen(true)}
                disabled={
                  !canUpdateAPIKeys ||
                  (!isLegacyKeysEnabled && legacyJWTSecret?.status === 'revoked')
                }
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !canUpdateAPIKeys
                      ? 'You need additional permissions to enable or disable JWT-based API keys'
                      : !isLegacyKeysEnabled && legacyJWTSecret?.status === 'revoked'
                        ? 'The legacy JWT secret is revoked. Re-enabling is not possible until it is at least moved to previously used.'
                        : undefined,
                  },
                }}
              >
                {legacyAPIKeysStatusData.enabled
                  ? 'Disable JWT-based API keys'
                  : 'Re-enable JWT-based API keys'}
              </ButtonTooltip>
            </div>
          </div>
        </Panel.Content>
      </Panel>

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
  const { ref: projectRef } = useParams()
  const { enabled: isLegacyKeysEnabled } = legacyAPIKeysStatusData || {}

  const { mutate: toggleLegacyAPIKey, isLoading: isTogglingLegacyAPIKey } =
    useToggleLegacyAPIKeysMutation()

  const onToggleLegacyAPIKeysEnabled = () => {
    const enabled = !legacyAPIKeysStatusData?.enabled

    toggleLegacyAPIKey(
      { projectRef, enabled },
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
      size="medium"
      visible={visible}
      onCancel={() => onClose()}
      onConfirm={onToggleLegacyAPIKeysEnabled}
      title={isLegacyKeysEnabled ? 'Disable JWT-based keys' : 'Re-enable JWT-based keys'}
      confirmString={isLegacyKeysEnabled ? 'disable' : 're-enable'}
      confirmLabel={`Confirm to ${isLegacyKeysEnabled ? 'disable' : 're-enable'} anon and service_role`}
      confirmPlaceholder={isLegacyKeysEnabled ? 'disable' : 're-enable'}
      loading={isTogglingLegacyAPIKey}
      variant={isLegacyKeysEnabled ? 'destructive' : 'default'}
      alert={
        isLegacyKeysEnabled
          ? {
              title: 'Ensure legacy keys are no longer in use before disabling',
              description: (
                <span className="prose text-sm">
                  Disabling <code>anon</code> and <code>service_role</code> keys while they are in
                  use will cause downtime for your application. Ensure they are no longer in use
                  before proceeding. If you have not created a publishable and at least one secret
                  API key, some dashboard functionality may become unavailable.
                </span>
              ),
            }
          : {
              title: 'Publishable and secret keys are preferred',
              description: (
                <span className="prose text-sm">
                  Re-enabling <code>anon</code> and <code>service_role</code> keys may be
                  appropriate in certain cases, but using a publishable and secret key is more
                  secure. We recommend against re-enabling legacy API keys.
                </span>
              ),
            }
      }
    />
  )
}
