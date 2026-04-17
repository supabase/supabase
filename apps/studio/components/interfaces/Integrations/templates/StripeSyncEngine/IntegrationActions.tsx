import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Button, cn } from 'ui'

import { hasInstallError, hasUninstallError } from './stripe-sync-status'
import { useStripeSyncStatus } from '@/components/interfaces/Integrations/templates/StripeSyncEngine/useStripeSyncStatus'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

export const IntegrationInstalledActions = ({
  className,
  disabled,
  upgradeAvailable,
  installing,
  uninstalling,
  setShowUninstallModal,
  setShouldShowInstallSheet,
}: {
  className?: string
  disabled?: boolean
  upgradeAvailable: boolean
  installing: boolean
  uninstalling: boolean
  isUninstallRequested: boolean
  setShowUninstallModal: (value: boolean) => void
  setShouldShowInstallSheet: (value: boolean) => void
}) => {
  const { can: canManageSecrets } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_SECRET_WRITE,
    '*'
  )

  const {
    schemaComment: { status: installationStatus },
  } = useStripeSyncStatus()
  const uninstallError = hasUninstallError(installationStatus)

  return (
    <>
      <div className={cn('flex gap-x-2 justify-end', className)}>
        {upgradeAvailable && !uninstallError && !uninstalling && (
          <ButtonTooltip
            type="primary"
            onClick={() => setShouldShowInstallSheet(true)}
            disabled={disabled}
            loading={installing}
            tooltip={{
              content: {
                text: !canManageSecrets
                  ? 'You need additional permissions to upgrade the Stripe Sync Engine.'
                  : undefined,
              },
            }}
          >
            Upgrade integration
          </ButtonTooltip>
        )}
        <ButtonTooltip
          type="default"
          onClick={() => setShowUninstallModal(true)}
          disabled={disabled}
          loading={uninstalling}
          tooltip={{
            content: {
              text: !canManageSecrets
                ? 'You need additional permissions to uninstall the Stripe Sync Engine.'
                : undefined,
            },
          }}
        >
          {uninstallError ? 'Retry uninstallation' : 'Uninstall integration'}
        </ButtonTooltip>
      </div>
    </>
  )
}

export const IntegrationNotInstalledActions = ({
  className,
  installing,
  canInstall,
  isUninstallRequested,
  hideInstallCTA = false,
  handleUninstall,
  setShouldShowInstallSheet,
}: {
  className?: string
  installing: boolean
  canInstall: boolean
  isUninstallRequested: boolean
  hideInstallCTA?: boolean
  handleUninstall: () => void
  setShouldShowInstallSheet: (value: boolean) => void
}) => {
  const { can: canManageSecrets } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_SECRET_WRITE,
    '*'
  )

  const {
    schemaComment: { status: installationStatus },
  } = useStripeSyncStatus()
  const installError = hasInstallError(installationStatus)

  return (
    <div className={cn('flex gap-x-2 justify-end', className)}>
      {!hideInstallCTA && (
        <ButtonTooltip
          type="primary"
          onClick={() => setShouldShowInstallSheet(true)}
          disabled={!canInstall || !canManageSecrets}
          loading={installing}
          tooltip={{
            content: {
              text: !canInstall
                ? 'Your database already uses a schema named "stripe"'
                : !canManageSecrets
                  ? 'You need additional permissions to install the Stripe Sync Engine.'
                  : undefined,
            },
          }}
        >
          {installError ? 'Retry installation' : 'Install integration'}
        </ButtonTooltip>
      )}
      {installError && (
        <Button type="default" loading={isUninstallRequested} onClick={handleUninstall}>
          Uninstall
        </Button>
      )}
    </div>
  )
}
