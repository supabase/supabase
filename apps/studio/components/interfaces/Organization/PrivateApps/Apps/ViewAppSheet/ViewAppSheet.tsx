import { X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, cn, ScrollArea, Sheet, SheetContent, SheetHeader } from 'ui'

import { PrivateApp, usePrivateApps } from '../../PrivateAppsContext'
import { PERMISSIONS, type Permission } from '../Apps.constants'
import { DeleteAppModal } from '../DeleteAppModal'
import { ViewAppSheetDangerZone } from './ViewAppSheetDangerZone'
import { ViewAppSheetInfo } from './ViewAppSheetInfo'
import { ViewAppSheetPermissions } from './ViewAppSheetPermissions'
import { usePlatformAppDeleteMutation } from '@/data/platform-apps/platform-app-delete-mutation'
import { usePlatformAppQuery } from '@/data/platform-apps/platform-app-query'

interface ViewAppSheetProps {
  app: PrivateApp | null
  visible: boolean
  onClose: () => void
  onDeleted: () => void
}

export function ViewAppSheet({ app, visible, onClose, onDeleted }: ViewAppSheetProps) {
  const { slug, installations, removeInstallationsByAppId } = usePrivateApps()
  const installation = installations.find((i) => i.app_id === app?.id)
  const isInstalled = installation !== undefined
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data: detail, isLoading: isLoadingDetail } = usePlatformAppQuery(
    { slug, id: app?.id },
    { enabled: visible && app !== null }
  )

  const { mutate: deleteApp, isPending: isDeleting } = usePlatformAppDeleteMutation({
    onSuccess: (_, vars) => {
      toast.success(`Deleted "${app?.name}"`)
      removeInstallationsByAppId(vars.appId)
      setShowDeleteModal(false)
      onClose()
      onDeleted()
    },
  })

  function handleDelete() {
    if (!app || !slug) return
    deleteApp({ slug, appId: app.id })
  }

  const permissions: Permission[] = detail
    ? detail.permissions
        .map((id) => PERMISSIONS.find((p) => p.id === id))
        .filter((p): p is Permission => p !== undefined)
    : []

  return (
    <>
      <Sheet
        open={visible}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <SheetContent
          showClose={false}
          size="default"
          className="!min-w-[600px] flex flex-col h-full gap-0"
        >
          <SheetHeader
            className={cn('flex flex-row justify-between gap-x-4 items-center border-b')}
          >
            <p className="truncate font-medium">{app?.name}</p>
            <Button type="text" icon={<X size={16} />} className="px-1" onClick={onClose} />
          </SheetHeader>

          <ScrollArea className="flex-1 max-h-[calc(100vh-60px)]">
            {app && (
              <div className="flex flex-col gap-0">
                <ViewAppSheetInfo app={app} isInstalled={isInstalled} installation={installation} />
                <ViewAppSheetPermissions permissions={permissions} isLoading={isLoadingDetail} />
                <ViewAppSheetDangerZone onDelete={() => setShowDeleteModal(true)} />
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <DeleteAppModal
        app={app}
        visible={showDeleteModal}
        isLoading={isDeleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </>
  )
}
