import { AppWindow, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'

import { PromoteInstallationModal } from '../../Installations/PromoteInstallationModal'
import { PrivateApp, usePrivateApps } from '../../PrivateAppsContext'
import type { AppsSort } from '../Apps.types'
import { handleSortChange, sortApps } from '../Apps.utils'
import { DeleteAppModal } from '../DeleteAppModal'
import { ViewAppSheet } from '../ViewAppSheet/ViewAppSheet'
import { AppsListLoading } from './AppsListLoading'
import { AppsListTable } from './AppsListTable'
import { usePlatformAppDeleteMutation } from '@/data/platform-apps/platform-app-delete-mutation'
import { usePlatformAppInstallationDeleteMutation } from '@/data/platform-apps/platform-app-installation-delete-mutation'

interface AppsListProps {
  onCreateApp: () => void
}

export function AppsList({ onCreateApp }: AppsListProps) {
  const { apps, isLoading, slug, installations, removeInstallation, removeInstallationsByAppId } =
    usePrivateApps()

  const { mutate: deleteApp, isPending: isDeleting } = usePlatformAppDeleteMutation({
    onSuccess: (_, vars) => {
      toast.success(`Deleted app`)
      removeInstallationsByAppId(vars.appId)
      if (appToDelete?.id === vars.appId) setAppToDelete(undefined)
    },
  })

  const { mutate: deleteInstallation } = usePlatformAppInstallationDeleteMutation({
    onSuccess: (_, vars) => {
      removeInstallation(vars.installationId)
      if (appToDelete && slug) deleteApp({ slug, appId: appToDelete.id })
    },
  })

  const [sort, setSort] = useState<AppsSort>('created_at:desc')
  const [viewApp, setViewApp] = useState<PrivateApp | undefined>()
  const [appToDelete, setAppToDelete] = useState<PrivateApp | undefined>()
  const [appToPromote, setAppToPromote] = useState<PrivateApp | undefined>()

  const onSortChange = (column: string) => handleSortChange(sort, column, setSort)

  const sortedApps = useMemo(() => sortApps(apps, sort), [apps, sort])
  const installedAppIds = useMemo(
    () => new Set(installations.map((i) => i.app_id)),
    [installations]
  )
  const currentInstallation = installations[0]

  function handleDelete() {
    if (!appToDelete || !slug) return
    const installation = installations.find((i) => i.app_id === appToDelete.id)
    if (installation) {
      deleteInstallation({ slug, installationId: installation.id })
    } else {
      deleteApp({ slug, appId: appToDelete.id })
    }
  }

  return (
    <>
      {isLoading ? (
        <AppsListLoading />
      ) : apps.length === 0 ? (
        <EmptyStatePresentational
          icon={AppWindow}
          title="No private apps yet"
          description="Create a private app to generate scoped access tokens for your organization."
        >
          <Button type="primary" icon={<Plus size={14} />} onClick={onCreateApp}>
            Create app
          </Button>
        </EmptyStatePresentational>
      ) : (
        <AppsListTable
          sortedApps={sortedApps}
          sort={sort}
          installedAppIds={installedAppIds}
          onSortChange={onSortChange}
          onViewApp={setViewApp}
          onDeleteApp={setAppToDelete}
          onPromoteApp={setAppToPromote}
        />
      )}

      <ViewAppSheet
        app={viewApp ?? null}
        visible={viewApp !== undefined}
        onClose={() => setViewApp(undefined)}
        onDeleted={() => setViewApp(undefined)}
      />

      <DeleteAppModal
        app={appToDelete ?? null}
        visible={appToDelete !== undefined}
        onClose={() => setAppToDelete(undefined)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      <PromoteInstallationModal
        appToPromote={appToPromote}
        currentInstallation={currentInstallation}
        onClose={() => setAppToPromote(undefined)}
        onSuccess={() => setAppToPromote(undefined)}
      />
    </>
  )
}
