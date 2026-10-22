import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import {
  CircleArrowUpIcon,
  MoreVerticalIcon,
  RotateCwIcon,
  ShieldOffIcon,
  TimerIcon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'
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
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { NoPermission } from '@/components/ui/NoPermission'
import { useUrlSigningKeyUpdateMutation } from '@/data/storage/url-signing-key-update-mutation'
import { UrlSigningKey, urlSigningKeysQueryOptions } from '@/data/storage/url-signing-keys-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useIsProjectActive } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'

type DialogState =
  | { type: 'create' }
  | { type: 'rotate'; key: UrlSigningKey }
  | { type: 'revoke'; key: UrlSigningKey }

export const UrlSigningKeys = () => {
  const { ref: projectRef } = useParams()
  const isProjectActive = useIsProjectActive()
  const track = useTrack()
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
    isPending: isMovingToStandby,
    variables: movingKey,
  } = useUrlSigningKeyUpdateMutation({
    onSuccess: () => {
      track('storage_url_signing_key_updated', { change: 'moved_to_standby' })
      toast.success('URL signing key moved to standby')
    },
  })

  const { activeKey, standbyKeys, revokedKeys } = groupUrlSigningKeys(data ?? [])
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
                <UrlSigningKeysTable keys={activeKey ? [activeKey] : []} statusLabel="Active" />
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
                    icon={<TimerIcon />}
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
                  statusLabel="Standby"
                  dimmed
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
                      URLs signed with these keys are rejected. Move a key to standby to make it
                      validate URLs again.
                    </PageSectionDescription>
                  </PageSectionSummary>
                </PageSectionMeta>
                <PageSectionContent>
                  <UrlSigningKeysTable
                    keys={revokedKeys}
                    statusLabel="Revoked"
                    dimmed
                    renderActions={(key) => (
                      <RevokedKeyActions
                        canUpdateKeys={canUpdateKeys}
                        hasStandbyKey={hasStandbyKey}
                        isLoading={isMovingToStandby && movingKey?.kid === key.kid}
                        onMoveToStandby={() =>
                          updateKey({ projectRef, kid: key.kid, active: true })
                        }
                      />
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

const MoreOptionsTrigger = ({ disabled, loading }: { disabled?: boolean; loading?: boolean }) => (
  <DropdownMenuTrigger asChild>
    <ButtonTooltip
      variant="default"
      aria-label="More options"
      className="px-1.5"
      disabled={disabled}
      loading={loading}
      icon={<MoreVerticalIcon className="size-4" />}
      tooltip={{ content: { side: 'bottom', text: 'More options' } }}
    />
  </DropdownMenuTrigger>
)

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
      icon={<RotateCwIcon />}
      disabled={!canUpdateKeys}
      onClick={onRotate}
      tooltip={{
        content: {
          side: 'bottom',
          text: canUpdateKeys ? undefined : 'You need additional permissions to rotate keys',
        },
      }}
    >
      Rotate key
    </ButtonTooltip>
    <DropdownMenu>
      <MoreOptionsTrigger disabled={!canUpdateKeys} />
      <DropdownMenuContent side="bottom" align="end" className="w-52">
        <DropdownMenuItem className="gap-x-2" onSelect={onRevoke}>
          <ShieldOffIcon size={14} />
          Revoke key
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </>
)

const RevokedKeyActions = ({
  canUpdateKeys,
  hasStandbyKey,
  isLoading,
  onMoveToStandby,
}: {
  canUpdateKeys: boolean
  hasStandbyKey: boolean
  isLoading: boolean
  onMoveToStandby: () => void
}) => (
  <DropdownMenu>
    <MoreOptionsTrigger disabled={!canUpdateKeys} loading={isLoading} />
    <DropdownMenuContent side="bottom" align="end" className="w-52">
      <DropdownMenuItemTooltip
        className="gap-x-2"
        disabled={hasStandbyKey}
        onSelect={onMoveToStandby}
        tooltip={{
          content: {
            side: 'left',
            text: hasStandbyKey ? 'You may only have one standby key at a time' : undefined,
          },
        }}
      >
        <CircleArrowUpIcon size={14} />
        Move to standby key
      </DropdownMenuItemTooltip>
    </DropdownMenuContent>
  </DropdownMenu>
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
