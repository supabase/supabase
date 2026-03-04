import { formatDistanceToNow } from 'date-fns'
import { Edit, Trash, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  cn,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import CopyButton from 'components/ui/CopyButton'
import { MOCK_PERMISSIONS, MOCK_PROJECTS } from './PrivateApps.constants'
import { EditScopeModal } from './EditScopeModal'
import { Installation, usePrivateApps } from './PrivateAppsContext'

interface ViewInstallationSheetProps {
  installation: Installation | null
  visible: boolean
  onClose: () => void
}

export function ViewInstallationSheet({ installation, visible, onClose }: ViewInstallationSheetProps) {
  const { apps, toggleInstallationStatus, deleteInstallation } = usePrivateApps()
  const [showEditScope, setShowEditScope] = useState(false)
  const [showUninstallModal, setShowUninstallModal] = useState(false)

  const app = apps.find((a) => a.id === installation?.appId)

  const scopeProjects =
    installation && installation.projectScope !== 'all'
      ? MOCK_PROJECTS.filter((p) => (installation.projectScope as string[]).includes(p.id))
      : []

  const appPermissions = app
    ? app.permissions.map((id) => MOCK_PERMISSIONS.find((p) => p.id === id)).filter(Boolean)
    : []

  const orgPermissions = appPermissions.filter((p) => p!.group === 'organization')
  const projectPermissions = appPermissions.filter((p) => p!.group === 'project')

  function handleToggleStatus() {
    if (!installation) return
    toggleInstallationStatus(installation.id)
    toast.success(`Installation ${installation.status === 'active' ? 'suspended' : 'activated'}`)
  }

  function handleUninstall() {
    if (!installation) return
    deleteInstallation(installation.id)
    toast.success(`Uninstalled "${installation.appName}"`)
    setShowUninstallModal(false)
    onClose()
  }

  return (
    <>
      <Sheet open={visible} onOpenChange={(open) => { if (!open) onClose() }}>
        <SheetContent
          showClose={false}
          size="default"
          className="!min-w-[600px] flex flex-col h-full gap-0"
        >
          <SheetHeader className={cn('flex flex-row justify-between gap-x-4 items-center border-b')}>
            <p className="truncate font-medium">{installation?.appName}</p>
            <Button type="text" icon={<X size={16} />} className="px-1" onClick={onClose} />
          </SheetHeader>

          <ScrollArea className="flex-1 max-h-[calc(100vh-60px)]">
            {installation && (
              <div className="space-y-0">
                {/* App info */}
                <div className="px-5 sm:px-6 py-6 space-y-3">
                  <h3 className="text-sm font-medium">App Information</h3>
                  <div className="border border-default rounded-lg divide-y divide-default">
                    <div className="flex items-center px-4 py-3 gap-4">
                      <span className="text-sm text-foreground-light w-28 shrink-0">App name</span>
                      <span className="text-sm">{installation.appName}</span>
                    </div>
                    <div className="flex items-center px-4 py-3 gap-4">
                      <span className="text-sm text-foreground-light w-28 shrink-0">Client ID</span>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-mono text-sm truncate">{installation.clientId}</span>
                        <CopyButton
                          type="default"
                          iconOnly
                          text={installation.clientId}
                          className="px-1 shrink-0"
                        />
                      </div>
                    </div>
                    <div className="flex items-center px-4 py-3 gap-4">
                      <span className="text-sm text-foreground-light w-28 shrink-0">Status</span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          installation.status === 'active'
                            ? 'bg-brand/20 text-brand'
                            : 'bg-warning/20 text-warning'
                        }`}
                      >
                        {installation.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <div className="flex items-center px-4 py-3 gap-4">
                      <span className="text-sm text-foreground-light w-28 shrink-0">Installed</span>
                      <span className="text-sm">
                        {formatDistanceToNow(installation.installedAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Project scope */}
                <div className="px-5 sm:px-6 py-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Project Scope</h3>
                    <Button
                      type="default"
                      size="tiny"
                      icon={<Edit size={12} />}
                      onClick={() => setShowEditScope(true)}
                    >
                      Edit scope
                    </Button>
                  </div>
                  <div className="border border-default rounded-lg p-4">
                    {installation.projectScope === 'all' ? (
                      <span className="inline-flex items-center rounded-full bg-surface-300 px-2 py-0.5 text-xs font-medium">
                        All projects
                      </span>
                    ) : scopeProjects.length > 0 ? (
                      <div className="space-y-2">
                        {scopeProjects.map((p) => (
                          <div key={p.id} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted" />
                            <span className="text-sm">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-foreground-muted italic">No projects selected</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Granted permissions */}
                <div className="px-5 sm:px-6 py-6 space-y-3">
                  <h3 className="text-sm font-medium">Granted Permissions</h3>
                  <div className="border border-default rounded-lg">
                    {appPermissions.length === 0 ? (
                      <div className="px-4 py-3">
                        <p className="text-sm text-foreground-muted italic">
                          No permissions information available
                        </p>
                      </div>
                    ) : (
                      <>
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
                            <div
                              className={`px-3 py-2 bg-surface-100 ${orgPermissions.length === 0 ? 'rounded-t-lg' : ''}`}
                            >
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
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Danger zone */}
                <div className="px-5 sm:px-6 py-6 space-y-3">
                  <h3 className="text-sm font-medium text-destructive">Danger Zone</h3>
                  <div className="border border-destructive/30 rounded-lg divide-y divide-default">
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">
                          {installation.status === 'active'
                            ? 'Suspend installation'
                            : 'Activate installation'}
                        </p>
                        <p className="text-xs text-foreground-light">
                          {installation.status === 'active'
                            ? 'Temporarily disable token generation for this installation'
                            : 'Re-enable token generation for this installation'}
                        </p>
                      </div>
                      <Button
                        type={installation.status === 'active' ? 'warning' : 'default'}
                        onClick={handleToggleStatus}
                      >
                        {installation.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Uninstall app</p>
                        <p className="text-xs text-foreground-light">
                          Remove this installation and invalidate any tokens it generated
                        </p>
                      </div>
                      <Button
                        type="danger"
                        icon={<Trash size={14} />}
                        onClick={() => setShowUninstallModal(true)}
                      >
                        Uninstall
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <EditScopeModal
        installation={installation}
        visible={showEditScope}
        onClose={() => setShowEditScope(false)}
      />

      <ConfirmationModal
        variant="destructive"
        visible={showUninstallModal}
        title={`Uninstall "${installation?.appName}"`}
        confirmLabel="Uninstall"
        onCancel={() => setShowUninstallModal(false)}
        onConfirm={handleUninstall}
      >
        <p className="text-sm text-foreground-light py-2">
          Are you sure you want to uninstall <strong>{installation?.appName}</strong>? Any tokens
          generated through this installation will stop working.
        </p>
      </ConfirmationModal>
    </>
  )
}
