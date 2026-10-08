import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { EllipsisVertical, RotateCw, Timer, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { CreateStandbyKeyDialog } from './CreateStandbyKeyDialog'
import { RevokeUrlSigningKeyDialog } from './RevokeUrlSigningKeyDialog'
import { RotateUrlSigningKeyDialog } from './RotateUrlSigningKeyDialog'
import { groupUrlSigningKeys } from './UrlSigningKeys.utils'
import { UrlSigningKeysTable } from './UrlSigningKeysTable'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { NoPermission } from '@/components/ui/NoPermission'
import { useUrlSigningKeyUpdateMutation } from '@/data/storage/url-signing-key-update-mutation'
import { UrlSigningKey, urlSigningKeysQueryOptions } from '@/data/storage/url-signing-keys-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useIsProjectActive } from '@/hooks/misc/useSelectedProject'

type DialogState =
  | { type: 'create' }
  | { type: 'rotate'; key: UrlSigningKey }
  | { type: 'revoke'; key: UrlSigningKey }

export const UrlSigningKeys = () => {
  const { ref: projectRef } = useParams()
  const isProjectActive = useIsProjectActive()
  const [dialog, setDialog] = useState<DialogState>()

  const { can: canReadKeys, isLoading: isLoadingPermissions } = useAsyncCheckPermissions(
    PermissionAction.STORAGE_ADMIN_READ,
    '*'
  )
  const { can: canUpdateKeys } = useAsyncCheckPermissions(PermissionAction.STORAGE_ADMIN_WRITE, '*')

  const keysQueryOptions = urlSigningKeysQueryOptions({ projectRef })
  const { data, error, isPending, isError } = useQuery({
    ...keysQueryOptions,
    enabled: keysQueryOptions.enabled && canReadKeys && isProjectActive,
  })

  const {
    mutate: updateKey,
    isPending: isReactivating,
    variables: reactivatingKey,
  } = useUrlSigningKeyUpdateMutation({
    onSuccess: () => toast.success('URL signing key reactivated'),
  })

  const { signingKey, standbyKeys, revokedKeys } = groupUrlSigningKeys(data ?? [])
  const activeKeys = signingKey ? [signingKey, ...standbyKeys] : standbyKeys
  // The API allows several standby keys, but we keep rotation simple with one
  const hasStandbyKey = standbyKeys.length > 0
  const canCreateStandbyKey = canUpdateKeys && isProjectActive && !!data && !hasStandbyKey

  const closeDialog = () => setDialog(undefined)

  if (isLoadingPermissions) return <GenericSkeletonLoader />
  if (!canReadKeys) {
    return <NoPermission isFullPage resourceText="view this project's URL signing keys" />
  }

  return (
    <>
      <PageContainer>
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Active keys</PageSectionTitle>
              <PageSectionDescription>
                The signing key signs new URLs. Standby keys don't sign URLs but still validate the
                ones they signed.
              </PageSectionDescription>
            </PageSectionSummary>
            <PageSectionAside>
              <ButtonTooltip
                variant="primary"
                icon={<Timer />}
                disabled={!canCreateStandbyKey}
                onClick={() => setDialog({ type: 'create' })}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: getCreateDisabledReason({
                      canUpdateKeys,
                      isProjectActive,
                      hasStandbyKey,
                    }),
                  },
                }}
              >
                Create standby key
              </ButtonTooltip>
            </PageSectionAside>
          </PageSectionMeta>

          <PageSectionContent>
            {!isProjectActive && (
              <Admonition
                type="warning"
                title="Project is paused"
                description="Restore your project to view and rotate its URL signing keys."
              />
            )}
            {isProjectActive && isPending && <GenericSkeletonLoader />}
            {isError && <AlertError error={error} subject="Failed to retrieve URL signing keys" />}
            {data && (
              <UrlSigningKeysTable
                keys={activeKeys}
                renderActions={(key) =>
                  key !== signingKey && (
                    <>
                      <ButtonTooltip
                        variant="default"
                        size="tiny"
                        icon={<RotateCw />}
                        className="hit-area-2"
                        disabled={!canUpdateKeys}
                        onClick={() => setDialog({ type: 'rotate', key })}
                        tooltip={{
                          content: {
                            side: 'bottom',
                            text: canUpdateKeys
                              ? undefined
                              : 'You need additional permissions to rotate keys',
                          },
                        }}
                      >
                        Rotate
                      </ButtonTooltip>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="default"
                            icon={<EllipsisVertical />}
                            aria-label="More actions"
                            className="w-7 hit-area-2"
                            disabled={!canUpdateKeys}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="end" className="w-40">
                          <DropdownMenuItem
                            className="gap-x-2"
                            onClick={() => setDialog({ type: 'revoke', key })}
                          >
                            <Trash2 size={14} />
                            <span>Revoke key</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )
                }
              />
            )}
          </PageSectionContent>
        </PageSection>

        {revokedKeys.length > 0 && (
          <PageSection>
            <PageSectionMeta>
              <PageSectionSummary>
                <PageSectionTitle>Revoked keys</PageSectionTitle>
                <PageSectionDescription>
                  URLs signed with these keys are rejected. Reactivate a key to move it back to
                  standby.
                </PageSectionDescription>
              </PageSectionSummary>
            </PageSectionMeta>
            <PageSectionContent>
              <UrlSigningKeysTable
                keys={revokedKeys}
                renderActions={(key) => (
                  <ButtonTooltip
                    variant="default"
                    size="tiny"
                    className="hit-area-2"
                    loading={isReactivating && reactivatingKey?.kid === key.kid}
                    disabled={!canUpdateKeys || hasStandbyKey || isReactivating}
                    onClick={() => updateKey({ projectRef, kid: key.kid, active: true })}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: getReactivateDisabledReason({ canUpdateKeys, hasStandbyKey }),
                      },
                    }}
                  >
                    Reactivate
                  </ButtonTooltip>
                )}
              />
            </PageSectionContent>
          </PageSection>
        )}
      </PageContainer>

      <CreateStandbyKeyDialog
        projectRef={projectRef}
        visible={dialog?.type === 'create'}
        onClose={closeDialog}
      />
      <RotateUrlSigningKeyDialog
        projectRef={projectRef}
        standbyKey={dialog?.type === 'rotate' ? dialog.key : undefined}
        signingKey={signingKey}
        onClose={closeDialog}
      />
      <RevokeUrlSigningKeyDialog
        projectRef={projectRef}
        selectedKey={dialog?.type === 'revoke' ? dialog.key : undefined}
        onClose={closeDialog}
      />
    </>
  )
}

const getCreateDisabledReason = ({
  canUpdateKeys,
  isProjectActive,
  hasStandbyKey,
}: {
  canUpdateKeys: boolean
  isProjectActive: boolean
  hasStandbyKey: boolean
}) => {
  if (!canUpdateKeys) return 'You need additional permissions to create keys'
  if (!isProjectActive) return 'Restore your project to create keys'
  if (hasStandbyKey) return 'Revoke the existing standby key to create a new one'
  return undefined
}

const getReactivateDisabledReason = ({
  canUpdateKeys,
  hasStandbyKey,
}: {
  canUpdateKeys: boolean
  hasStandbyKey: boolean
}) => {
  if (!canUpdateKeys) return 'You need additional permissions to reactivate keys'
  if (hasStandbyKey) return 'Revoke the existing standby key to reactivate this one'
  return undefined
}
