import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'

import Panel from '../Panel'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { NoPermission } from '@/components/ui/NoPermission'
import { TextConfirmModal } from '@/components/ui/TextConfirmModalWrapper'
import { useToggleLegacyAPIKeysMutation } from '@/data/api-keys/legacy-api-key-toggle-mutation'
import { legacyAPIKeysStatusQueryOptions } from '@/data/api-keys/legacy-api-keys-status-query'
import { legacyJWTSigningKeyQueryOptions } from '@/data/jwt-signing-keys/legacy-jwt-signing-key-query'
import { useAuthorizedAppsQuery } from '@/data/oauth/authorized-apps-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import {
  getWriteGrantToastMessage,
  getWriteGrantTooltip,
  useGrant,
  type GrantResult,
} from '@/lib/grants'

export const ToggleLegacyApiKeysPanel = () => {
  const { ref: projectRef } = useParams()
  const { data: org } = useSelectedOrganizationQuery()

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isAppsWarningOpen, setIsAppsWarningOpen] = useState(false)

  const statusGrant = useGrant('GET /v1/projects/{ref}/api-keys/legacy', { projectRef })
  const legacyJWTSecretGrant = useGrant('GET /v1/projects/{ref}/config/auth/signing-keys/legacy', {
    projectRef,
  })
  const toggleGrant = useGrant('PUT /v1/projects/{ref}/api-keys/legacy', { projectRef })
  const canUpdateAPIKeys = toggleGrant.status === 'granted'

  const { data: legacyAPIKeysStatusData, isSuccess: isLegacyAPIKeysStatusSuccess } = useQuery(
    legacyAPIKeysStatusQueryOptions({ projectRef, grant: statusGrant.grant })
  )

  // Only used to explain why re-enabling is blocked, so it doesn't gate the panel. A 404 resolves
  // to `null` (not migrated); a real error leaves it undefined and the toggle stays usable.
  const { data: legacyJWTSecret } = useQuery(
    legacyJWTSigningKeyQueryOptions({ projectRef, grant: legacyJWTSecretGrant.grant })
  )

  const { data: authorizedApps = [], isError: isAuthorizedAppsError } = useAuthorizedAppsQuery({
    slug: org?.slug,
  })

  const { enabled: isLegacyKeysEnabled } = legacyAPIKeysStatusData || {}

  const oauthAppsLink = (
    <a
      href={`/dashboard/org/${org?.slug}/apps`}
      target="_blank"
      rel="noreferrer"
      className="underline"
    >
      OAuth apps
    </a>
  )

  const appsWarning = isAuthorizedAppsError
    ? {
        title: 'Check your OAuth apps before continuing',
        description: (
          <>
            Disabling legacy API keys can break apps that integrate with Supabase. Before
            continuing, check your organization's {oauthAppsLink} to ensure none of them depend on
            the legacy API keys.
          </>
        ),
      }
    : {
        title: 'Apps using Supabase may break',
        description: (
          <>
            Your project uses apps that integrate with Supabase. Disabling the legacy API keys is a
            brand new feature and the apps you're using may not have added support for this yet. It
            can cause them to stop functioning. Check your {oauthAppsLink} before continuing.
          </>
        ),
      }

  if (statusGrant.status === 'denied') {
    return (
      <section>
        <NoPermission resourceText="view legacy API keys settings" />
      </section>
    )
  }

  if (statusGrant.status === 'error') {
    return (
      <section>
        <AlertError
          error={statusGrant.error}
          subject="Failed to check legacy API keys permissions"
        />
      </section>
    )
  }

  if (!isLegacyAPIKeysStatusSuccess) {
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
                onClick={
                  isLegacyKeysEnabled && (authorizedApps?.length || isAuthorizedAppsError)
                    ? () => setIsAppsWarningOpen(true)
                    : () => setIsConfirmOpen(true)
                }
                disabled={
                  !canUpdateAPIKeys ||
                  (!isLegacyKeysEnabled && legacyJWTSecret?.status === 'revoked')
                }
                tooltip={{
                  content: {
                    side: 'bottom',
                    text:
                      getWriteGrantTooltip(
                        toggleGrant.status,
                        'enable or disable',
                        'JWT-based API keys'
                      ) ??
                      (!isLegacyKeysEnabled && legacyJWTSecret?.status === 'revoked'
                        ? 'The legacy JWT secret is revoked. Re-enabling is not possible until it is at least moved to previously used.'
                        : undefined),
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
        toggleGrant={toggleGrant}
      />

      <AlertDialog open={isAppsWarningOpen} onOpenChange={(value) => setIsAppsWarningOpen(value)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{appsWarning.title}</AlertDialogTitle>
            <AlertDialogDescription>{appsWarning.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={() => setIsConfirmOpen(true)}>
              Disable API keys
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

const ToggleApiKeysModal = ({
  visible,
  onClose,
  legacyAPIKeysStatusData,
  toggleGrant,
}: {
  visible: boolean
  onClose: () => void
  legacyAPIKeysStatusData: { enabled: boolean }
  toggleGrant: GrantResult<'PUT /v1/projects/{ref}/api-keys/legacy'>
}) => {
  const { ref: projectRef } = useParams()
  const { enabled: isLegacyKeysEnabled } = legacyAPIKeysStatusData || {}

  const { mutate: toggleLegacyAPIKey, isPending: isTogglingLegacyAPIKey } =
    useToggleLegacyAPIKeysMutation()

  const onToggleLegacyAPIKeysEnabled = () => {
    if (!toggleGrant.grant) {
      toast.error(
        getWriteGrantToastMessage(toggleGrant.status, 'enable or disable', 'JWT-based API keys')
      )
      return
    }
    const enabled = !legacyAPIKeysStatusData?.enabled

    toggleLegacyAPIKey(
      { projectRef, grant: toggleGrant.grant, enabled },
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
                  <br />
                  <br />
                  <span className="text-danger">
                    This disables API keys when used in the <code>apikey</code> header. They remain
                    valid as a JWT.
                  </span>
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
