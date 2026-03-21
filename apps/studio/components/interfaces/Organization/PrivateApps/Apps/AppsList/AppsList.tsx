import { usePlatformAppDeleteMutation } from 'data/platform-apps/platform-app-delete-mutation'
import { AppWindow, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'

import { PrivateApp, usePrivateApps } from '../../PrivateAppsContext'
import type { AppsSort } from '../Apps.types'
import { handleSortChange, sortApps } from '../Apps.utils'
import { DeleteAppModal } from '../DeleteAppModal'
import { ViewAppSheet } from '../ViewAppSheet'
import { AppsListLoading } from './AppsListLoading'
import { AppsListTable } from './AppsListTable'

interface AppsListProps {
  onCreateApp: () => void
}

export function AppsList({ onCreateApp }: AppsListProps) {
  const { apps, isLoading, slug, removeInstallationsByAppId } = usePrivateApps()
  const { mutate: deleteApp, isPending: isDeleting } = usePlatformAppDeleteMutation({
    onSuccess: (_, vars) => {
      toast.success(`Deleted app`)
      removeInstallationsByAppId(vars.appId)
      if (appToDelete?.id === vars.appId) setAppToDelete(null)
    },
  })

  const [sort, setSort] = useState<AppsSort>('created_at:desc')
  const [viewApp, setViewApp] = useState<PrivateApp | null>(null)
  const [appToDelete, setAppToDelete] = useState<PrivateApp | null>(null)

  const onSortChange = (column: string) => handleSortChange(sort, column, setSort)

  const sortedApps = useMemo(() => sortApps(apps, sort), [apps, sort])

  function handleDelete() {
    if (!appToDelete || !slug) return
    deleteApp({ slug, appId: appToDelete.id })
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
          onSortChange={onSortChange}
          onViewApp={setViewApp}
          onDeleteApp={setAppToDelete}
        />
      )}

      <ViewAppSheet
        app={viewApp}
        visible={viewApp !== null}
        onClose={() => setViewApp(null)}
        onDeleted={() => setViewApp(null)}
      />

      <DeleteAppModal
        app={appToDelete}
        visible={appToDelete !== null}
        onClose={() => setAppToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  )
}
