import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { Installation, PrivateApp, usePrivateApps } from '../PrivateAppsContext'
import { usePlatformAppInstallationCreateMutation } from '@/data/platform-apps/platform-app-installation-create-mutation'
import { usePlatformAppInstallationDeleteMutation } from '@/data/platform-apps/platform-app-installation-delete-mutation'

interface PromoteInstallationModalProps {
  appToPromote: PrivateApp | undefined
  currentInstallation: Installation | undefined
  onClose: () => void
  onSuccess: () => void
}

export function PromoteInstallationModal({
  appToPromote,
  currentInstallation,
  onClose,
  onSuccess,
}: PromoteInstallationModalProps) {
  const { slug, apps, addInstallation, removeInstallation } = usePrivateApps()

  const currentApp = apps.find((a) => a.id === currentInstallation?.app_id)

  const { mutate: installApp, isPending: isInstalling } = usePlatformAppInstallationCreateMutation({
    onSuccess: (data) => {
      if (data) addInstallation(data, 'all')
      toast.success(`"${appToPromote?.name}" is now the installed app`)
      onSuccess()
      onClose()
    },
    onError: (error) => {
      toast.error(`Failed to install app: ${error.message}`)
    },
  })

  const { mutate: uninstallApp, isPending: isUninstalling } =
    usePlatformAppInstallationDeleteMutation({
      onSuccess: (_, vars) => {
        removeInstallation(vars.installationId)
        if (!slug || !appToPromote) return
        installApp({ slug, app_id: appToPromote.id })
      },
      onError: (error) => {
        toast.error(`Failed to uninstall current app: ${error.message}`)
      },
    })

  function handleConfirm() {
    if (!slug || !appToPromote) return

    if (currentInstallation) {
      uninstallApp({ slug, installationId: currentInstallation.id })
    } else {
      installApp({ slug, app_id: appToPromote.id })
    }
  }

  const isLoading = isUninstalling || isInstalling

  return (
    <ConfirmationModal
      visible={appToPromote !== undefined}
      title={currentInstallation ? 'Replace installed app?' : `Install "${appToPromote?.name}"?`}
      confirmLabel={currentInstallation ? 'Replace' : 'Install'}
      confirmLabelLoading={currentInstallation ? 'Replacing...' : 'Installing...'}
      onCancel={onClose}
      onConfirm={handleConfirm}
      loading={isLoading}
    >
      <p className="text-sm text-foreground-light py-2">
        {currentInstallation ? (
          <>
            This will replace <strong>{currentApp?.name ?? currentInstallation.app_id}</strong> with{' '}
            <strong>{appToPromote?.name}</strong> as the installed app. Any tokens generated through
            the current installation will stop working.
          </>
        ) : (
          <>
            <strong>{appToPromote?.name}</strong> will be installed for this organization.
          </>
        )}
      </p>
    </ConfirmationModal>
  )
}
