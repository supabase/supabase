import { formatDistanceToNow } from 'date-fns'
import { Trash, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Card,
  CardContent,
  CriticalIcon,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Alert_Shadcn_,
  AlertTitle_Shadcn_,
  AlertDescription_Shadcn_,
  cn,
} from 'ui'
import { usePlatformAppQuery } from 'data/platform-apps/platform-app-query'
import { usePlatformAppDeleteMutation } from 'data/platform-apps/platform-app-delete-mutation'
import { PERMISSIONS } from './PrivateApps.constants'
import { DeleteAppModal } from './DeleteAppModal'
import { PrivateApp, usePrivateApps } from './PrivateAppsContext'

interface ViewAppSheetProps {
  app: PrivateApp | null
  visible: boolean
  onClose: () => void
  onDeleted: () => void
}

export function ViewAppSheet({ app, visible, onClose, onDeleted }: ViewAppSheetProps) {
  const { slug, removeInstallationsByAppId } = usePrivateApps()
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

  const permissions = detail
    ? detail.permissions.map((id) => PERMISSIONS.find((p) => p.id === id)).filter(Boolean)
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
                {/* App info */}
                <div className="px-5 sm:px-6 py-6 space-y-3">
                  <h3 className="text-sm font-medium text-foreground">App Information</h3>
                  <Card className="w-full overflow-hidden bg-surface-100">
                    <CardContent className="p-0">
                      <Table className="table-auto">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 w-[40%]">
                              Field
                            </TableHead>
                            <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                              Value
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              <p className="text-foreground-light">Name</p>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{app.name}</p>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <p className="text-foreground-light">Created</p>
                            </TableCell>
                            <TableCell>
                              <p>{formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</p>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>

                {/* Permissions */}
                <div className="px-5 sm:px-6 py-6 space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Permissions</h3>
                  {isLoadingDetail ? (
                    <p className="text-sm text-foreground-light py-4">Loading permissions...</p>
                  ) : (
                    <Card className="w-full overflow-hidden bg-surface-100">
                      <CardContent className="p-0">
                        <Table className="table-auto">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2 w-[50%]">
                                Permission
                              </TableHead>
                              <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                                Description
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {permissions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={2}>
                                  <p className="text-foreground-light text-center py-4">
                                    No permissions configured
                                  </p>
                                </TableCell>
                              </TableRow>
                            ) : (
                              permissions.map((p) => (
                                <TableRow key={p!.id}>
                                  <TableCell>
                                    <p className="font-mono text-sm">{p!.label}</p>
                                  </TableCell>
                                  <TableCell>
                                    <p className="text-foreground-light text-sm">{p!.description}</p>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Danger zone */}
                <div className="px-5 sm:px-6 py-6 space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Danger Zone</h3>
                  <Alert_Shadcn_ variant="destructive">
                    <CriticalIcon />
                    <AlertTitle_Shadcn_>Delete app</AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      Permanently delete this app and all its installations.
                    </AlertDescription_Shadcn_>
                    <div className="mt-2">
                      <Button
                        type="danger"
                        icon={<Trash size={14} />}
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Delete app
                      </Button>
                    </div>
                  </Alert_Shadcn_>
                </div>
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
