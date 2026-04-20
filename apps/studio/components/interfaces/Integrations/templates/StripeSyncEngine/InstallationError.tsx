import { useParams } from 'common'
import { Button } from 'ui'

import { useStripeSyncStatus } from './useStripeSyncStatus'
import AlertError from '@/components/ui/AlertError'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const InstallationError = ({
  error,
  handleUninstall,
  handleOpenInstallSheet,
  isUpgrade,
  installing,
  uninstalling,
}: {
  error: 'install' | 'uninstall'
  handleUninstall: () => void
  handleOpenInstallSheet: () => void
  isUpgrade?: boolean
  installing?: boolean
  uninstalling?: boolean
}) => {
  const {
    schemaComment: { errorMessage },
  } = useStripeSyncStatus()

  if (error === 'uninstall') {
    return (
      <AlertError
        layout="horizontal"
        subject="Failed to uninstall Stripe Sync Engine"
        error={errorMessage ? { message: errorMessage } : undefined}
        description="There was an error during the uninstallation of the Stripe Sync Engine, please try again. If the problem persists, contact support."
        additionalActions={
          <Button
            type="default"
            onClick={handleUninstall}
            disabled={uninstalling}
            loading={uninstalling}
          >
            Retry uninstallation
          </Button>
        }
      />
    )
  }

  if (error === 'install') {
    return (
      <AlertError
        subject={
          isUpgrade
            ? 'Failed to upgrade Stripe Sync Engine'
            : 'Failed to install Stripe Sync Engine'
        }
        error={errorMessage ? { message: errorMessage } : undefined}
        description={
          isUpgrade
            ? 'There was an error during the upgrade of the Stripe Sync Engine, please try again. If the problem persists, contact support.'
            : 'There was an error during the installation of the Stripe Sync Engine, please try reinstalling the integration. If the problem persists, contact support.'
        }
        additionalActions={
          <Button
            type="default"
            onClick={handleOpenInstallSheet}
            disabled={installing}
            loading={installing}
          >
            {isUpgrade ? 'Retry upgrade' : 'Retry installation'}
          </Button>
        }
      />
    )
  }

  return null
}
