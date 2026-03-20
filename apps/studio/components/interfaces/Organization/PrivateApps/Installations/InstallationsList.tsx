import { usePlatformAppInstallationDeleteMutation } from 'data/platform-apps/platform-app-installation-delete-mutation'
import dayjs from 'dayjs'
import { LayoutGrid, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Card } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { Installation, usePrivateApps } from '../PrivateAppsContext'
import { CreateInstallationModal } from './CreateInstallationModal'

export function InstallationsList() {
  const { installations, apps, slug, isLoadingInstallations, removeInstallation } = usePrivateApps()
  const { mutate: deleteInstallation } = usePlatformAppInstallationDeleteMutation({
    onSuccess: (_, vars) => {
      removeInstallation(vars.installationId)
      toast.success(`App uninstalled`)
      setInstallationToDelete(null)
    },
  })

  const [showCreate, setShowCreate] = useState(false)
  const [installationToDelete, setInstallationToDelete] = useState<Installation | null>(null)

  const installation = installations[0] ?? null

  function getAppName(appId: string) {
    return apps.find((a) => a.id === appId)?.name ?? appId
  }

  function handleDelete() {
    if (!installationToDelete || !slug) return
    deleteInstallation({ slug, installationId: installationToDelete.id })
  }

  return (
    <>
      <div className="flex flex-col gap-y-4">
        {isLoadingInstallations ? (
          <Card className="flex items-center justify-between px-6 py-4">
            <div className="space-y-2">
              <div className="h-4 w-40 bg-surface-300 rounded animate-pulse" />
              <div className="h-3 w-28 bg-surface-300 rounded animate-pulse" />
            </div>
            <div className="h-8 w-20 bg-surface-300 rounded animate-pulse" />
          </Card>
        ) : installation === null ? (
          <EmptyStatePresentational
            icon={LayoutGrid}
            title="No app installations yet"
            description="Install a private app to start generating scoped access tokens for your projects."
          >
            <Button type="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
              Install app
            </Button>
          </EmptyStatePresentational>
        ) : (
          <Card className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm">{getAppName(installation.app_id)}</p>
              <p className="text-sm text-foreground-lighter">
                Installed {dayjs(installation.created_at).fromNow()}
              </p>
            </div>
            <Button type="danger" onClick={() => setInstallationToDelete(installation)}>
              Uninstall
            </Button>
          </Card>
        )}
      </div>

      <CreateInstallationModal visible={showCreate} onClose={() => setShowCreate(false)} />

      <ConfirmationModal
        variant="destructive"
        visible={installationToDelete !== null}
        title={`Uninstall "${getAppName(installationToDelete?.app_id ?? '')}"`}
        confirmLabel="Uninstall"
        confirmLabelLoading="Uninstalling..."
        onCancel={() => setInstallationToDelete(null)}
        onConfirm={handleDelete}
      >
        <p className="text-sm text-foreground-light py-2">
          Are you sure you want to uninstall{' '}
          <strong>{getAppName(installationToDelete?.app_id ?? '')}</strong>? Any tokens generated
          through this installation will stop working.
        </p>
      </ConfirmationModal>
    </>
  )
}
