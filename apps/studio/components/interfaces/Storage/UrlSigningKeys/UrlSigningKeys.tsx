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
    isPending: isRestoring,
    variables: restoringKey,
  } = useUrlSigningKeyUpdateMutation({
    onSuccess: () => toast.success('URL signing key restored to standby'),
  })

  const { activeKey, standbyKeys, revokedKeys } = groupUrlSigningKeys(data ?? [])
  // The API allows several standby keys, but we keep rotation simple with one
  const hasStandbyKey = standbyKeys.length > 0
  const canCreateStandbyKey = canUpdateKeys && !hasStandbyKey

  const closeDialog = () => setDialog(undefined)

  if (isLoadingPermissions) return <GenericSkeletonLoader />
  if (!canReadKeys) {
    return <NoPermission isFullPage resourceText="view this project's URL signing keys" />
  }

  return (
    <>
      <PageContainer>
        {!isProjectActive && (
          <PageSection>
            <PageSectionContent>
              <Admonition
                type="warning"
                title="Project is paused"
                description="Restore your project to view and rotate its URL signing keys."
              />
            </PageSectionContent>
          </PageSection>
        )}
        {isProjectActive && isPending && (
          <PageSection>
            <PageSectionContent>
              <GenericSkeletonLoader />
            </PageSectionContent>
          </PageSection>
        )}
        {isError && (
          <PageSection>
            <PageSectionContent>
              <AlertError error={error} subject="Failed to retrieve URL signing keys" />
            </PageSectionContent>
          </PageSection>
        )}

        {data && (
          <>
            <PageSection>
              <PageSectionMeta>
                <PageSectionSummary>
                  <PageSectionTitle>Active key</PageSectionTitle>
                  <PageSectionDescription>
                    Signs all new URLs. A project always has exactly one active key.
                  </PageSectionDescription>
                </PageSectionSummary>
              </PageSectionMeta>
              <PageSectionContent>
                <UrlSigningKeysTable keys={activeKey ? [activeKey] : []} />
              </PageSectionContent>
            </PageSection>

            <PageSection>
              <PageSectionMeta>
                <PageSectionSummary>
                  <PageSectionTitle>Standby keys</PageSectionTitle>
                  <PageSectionDescription>
                    Don't sign new URLs, but still validate the URLs they signed. Rotate to make a
                    standby key active.
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
                        text: getCreateDisabledReason({ canUpdateKeys, hasStandbyKey }),
                      },
                    }}
                  >
                    Create standby key
                  </ButtonTooltip>
                </PageSectionAside>
              </PageSectionMeta>
              <PageSectionContent>
                <UrlSigningKeysTable
                  keys={standbyKeys}
                  emptyState={{
                    title: 'No standby key',
                    description: 'Create a standby key to rotate the active key.',
                  }}
                  renderActions={(key) => (
                    <StandbyKeyActions
                      canUpdateKeys={canUpdateKeys}
                      onRotate={() => setDialog({ type: 'rotate', key })}
                      onRevoke={() => setDialog({ type: 'revoke', key })}
                    />
                  )}
                />
              </PageSectionContent>
            </PageSection>

            {revokedKeys.length > 0 && (
              <PageSection>
                <PageSectionMeta>
                  <PageSectionSummary>
                    <PageSectionTitle>Revoked keys</PageSectionTitle>
                    <PageSectionDescription>
                      URLs signed with these keys are rejected. Restore a key to move it back to
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
                        loading={isRestoring && restoringKey?.kid === key.kid}
                        disabled={!canUpdateKeys || hasStandbyKey || isRestoring}
                        onClick={() => updateKey({ projectRef, kid: key.kid, active: true })}
                        tooltip={{
                          content: {
                            side: 'bottom',
                            text: getRestoreDisabledReason({ canUpdateKeys, hasStandbyKey }),
                          },
                        }}
                      >
                        Restore
                      </ButtonTooltip>
                    )}
                  />
                </PageSectionContent>
              </PageSection>
            )}
          </>
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
        activeKey={activeKey}
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

const StandbyKeyActions = ({
  canUpdateKeys,
  onRotate,
  onRevoke,
}: {
  canUpdateKeys: boolean
  onRotate: () => void
  onRevoke: () => void
}) => (
  <>
    <ButtonTooltip
      variant="default"
      size="tiny"
      icon={<RotateCw />}
      className="hit-area-2"
      disabled={!canUpdateKeys}
      onClick={onRotate}
      tooltip={{
        content: {
          side: 'bottom',
          text: canUpdateKeys ? undefined : 'You need additional permissions to rotate keys',
        },
      }}
    >
      Make active
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
        <DropdownMenuItem className="gap-x-2" onClick={onRevoke}>
          <Trash2 size={14} />
          <span>Revoke key</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </>
)

const getCreateDisabledReason = ({
  canUpdateKeys,
  hasStandbyKey,
}: {
  canUpdateKeys: boolean
  hasStandbyKey: boolean
}) => {
  if (!canUpdateKeys) return 'You need additional permissions to create keys'
  if (hasStandbyKey) return 'Revoke the existing standby key to create a new one'
  return undefined
}

const getRestoreDisabledReason = ({
  canUpdateKeys,
  hasStandbyKey,
}: {
  canUpdateKeys: boolean
  hasStandbyKey: boolean
}) => {
  if (!canUpdateKeys) return 'You need additional permissions to restore keys'
  if (hasStandbyKey) return 'Revoke the existing standby key to restore this one'
  return undefined
}
