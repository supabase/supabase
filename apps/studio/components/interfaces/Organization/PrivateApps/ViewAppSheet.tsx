import { formatDistanceToNow } from 'date-fns'
import { Pencil, Trash, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Input_Shadcn_,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetHeader,
  cn,
} from 'ui'
import CopyButton from 'components/ui/CopyButton'
import { MOCK_PERMISSIONS } from './PrivateApps.constants'
import { DeleteAppModal } from './DeleteAppModal'
import { PrivateApp, usePrivateApps } from './PrivateAppsContext'

interface ViewAppSheetProps {
  app: PrivateApp | null
  visible: boolean
  onClose: () => void
  onDeleted: () => void
}

export function ViewAppSheet({ app, visible, onClose, onDeleted }: ViewAppSheetProps) {
  const { updateApp, deleteApp } = usePrivateApps()
  const [editingName, setEditingName] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  function handleOpen() {
    if (app) setNameValue(app.name)
    setEditingName(false)
  }

  function saveName() {
    if (!app) return
    if (nameValue.trim() && nameValue.trim() !== app.name) {
      updateApp(app.id, { name: nameValue.trim() })
      toast.success('App name updated')
    }
    setEditingName(false)
  }

  function handleDelete() {
    if (!app) return
    deleteApp(app.id)
    toast.success(`Deleted "${app.name}"`)
    setShowDeleteModal(false)
    onClose()
    onDeleted()
  }

  const orgPermissions = app
    ? app.permissions
        .map((id) => MOCK_PERMISSIONS.find((p) => p.id === id))
        .filter(Boolean)
        .filter((p) => p!.group === 'organization')
    : []

  const projectPermissions = app
    ? app.permissions
        .map((id) => MOCK_PERMISSIONS.find((p) => p.id === id))
        .filter(Boolean)
        .filter((p) => p!.group === 'project')
    : []

  return (
    <>
      <Sheet
        open={visible}
        onOpenChange={(open) => {
          if (!open) onClose()
          else handleOpen()
        }}
      >
        <SheetContent
          showClose={false}
          size="default"
          className="!min-w-[600px] flex flex-col h-full gap-0"
        >
          <SheetHeader className={cn('flex flex-row justify-between gap-x-4 items-center border-b')}>
            <p className="truncate font-medium">{app?.name}</p>
            <Button
              type="text"
              icon={<X size={16} />}
              className="px-1"
              onClick={onClose}
            />
          </SheetHeader>

          <ScrollArea className="flex-1 max-h-[calc(100vh-60px)]">
            {app && (
              <div className="space-y-8 px-5 sm:px-6 py-6">
                {/* App info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">App Information</h3>
                  <div className="border border-border rounded-lg divide-y divide-border">
                    {/* Name */}
                    <div className="flex items-center px-4 py-3 gap-4">
                      <span className="text-sm text-foreground-light w-28 shrink-0">Name</span>
                      {editingName ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input_Shadcn_
                            value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            className="h-7 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveName()
                              if (e.key === 'Escape') {
                                setNameValue(app.name)
                                setEditingName(false)
                              }
                            }}
                            autoFocus
                          />
                          <Button type="primary" size="tiny" onClick={saveName}>
                            Save
                          </Button>
                          <Button
                            type="default"
                            size="tiny"
                            icon={<X size={12} />}
                            className="px-1"
                            onClick={() => {
                              setNameValue(app.name)
                              setEditingName(false)
                            }}
                          />
                        </div>
                      ) : (
                        <>
                          <span className="text-sm flex-1">{app.name}</span>
                          <Button
                            type="text"
                            size="tiny"
                            icon={<Pencil size={12} />}
                            className="px-1"
                            onClick={() => {
                              setNameValue(app.name)
                              setEditingName(true)
                            }}
                          />
                        </>
                      )}
                    </div>

                    {/* Client ID */}
                    <div className="flex items-center px-4 py-3 gap-4">
                      <span className="text-sm text-foreground-light w-28 shrink-0">Client ID</span>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-mono text-sm truncate">{app.clientId}</span>
                        <CopyButton type="default" iconOnly text={app.clientId} className="px-1 shrink-0" />
                      </div>
                    </div>

                    {/* Created */}
                    <div className="flex items-center px-4 py-3 gap-4">
                      <span className="text-sm text-foreground-light w-28 shrink-0">Created</span>
                      <span className="text-sm">
                        {formatDistanceToNow(app.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Permissions</h3>
                  <div className="border border-border rounded-lg">
                    {orgPermissions.length > 0 && (
                      <>
                        <div className="px-3 py-2 bg-surface-100 rounded-t-lg">
                          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                            Organization
                          </p>
                        </div>
                        {orgPermissions.map((p, i) => (
                          <div key={p!.id}>
                            <div className="px-4 py-3 flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted mt-1.5 shrink-0" />
                              <div>
                                <p className="text-sm font-mono">{p!.label}</p>
                                <p className="text-xs text-foreground-light">{p!.description}</p>
                              </div>
                            </div>
                            {i < orgPermissions.length - 1 && (
                              <div className="border-t border-border" />
                            )}
                          </div>
                        ))}
                      </>
                    )}

                    {orgPermissions.length > 0 && projectPermissions.length > 0 && (
                      <div className="border-t border-border" />
                    )}

                    {projectPermissions.length > 0 && (
                      <>
                        <div className={`px-3 py-2 bg-surface-100 ${orgPermissions.length === 0 ? 'rounded-t-lg' : ''}`}>
                          <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                            Project
                          </p>
                        </div>
                        {projectPermissions.map((p, i) => (
                          <div key={p!.id}>
                            <div className="px-4 py-3 flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted mt-1.5 shrink-0" />
                              <div>
                                <p className="text-sm font-mono">{p!.label}</p>
                                <p className="text-xs text-foreground-light">{p!.description}</p>
                              </div>
                            </div>
                            {i < projectPermissions.length - 1 && (
                              <div className="border-t border-border" />
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Danger zone */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                  <div className="border border-destructive/30 rounded-lg">
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Delete app</p>
                        <p className="text-xs text-foreground-light">
                          Permanently delete this app and all its installations
                        </p>
                      </div>
                      <Button
                        type="danger"
                        icon={<Trash size={14} />}
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <DeleteAppModal
        app={app}
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </>
  )
}
