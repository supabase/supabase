import { formatDistanceToNow } from 'date-fns'
import { MoreVertical, Plus, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import Table from 'components/to-be-cleaned/Table'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { CreateInstallationModal } from './CreateInstallationModal'
import { ViewInstallationSheet } from './ViewInstallationSheet'
import { Installation, usePrivateApps } from './PrivateAppsContext'

export function InstallationsList() {
  const { installations, deleteInstallation, toggleInstallationStatus } = usePrivateApps()

  const [showCreate, setShowCreate] = useState(false)
  const [viewInstallation, setViewInstallation] = useState<Installation | null>(null)
  const [installationToDelete, setInstallationToDelete] = useState<Installation | null>(null)

  function handleCreated(installation: Installation) {
    setShowCreate(false)
    setViewInstallation(installation)
  }

  function handleDelete() {
    if (!installationToDelete) return
    deleteInstallation(installationToDelete.id)
    toast.success(`Uninstalled "${installationToDelete.appName}"`)
    setInstallationToDelete(null)
  }

  function getScopeLabel(projectScope: 'all' | string[]) {
    if (projectScope === 'all') return 'All projects'
    const count = projectScope.length
    return count === 1 ? '1 project' : `${count} projects`
  }

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <p className="text-sm text-foreground-light">
            Manage where private apps are installed across your organization's projects.
          </p>
          <Button type="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
            Install app
          </Button>
        </div>

          {installations.length === 0 ? (
            <div className="bg-surface-100 border rounded-lg p-12 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-surface-300 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-foreground-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-medium">No app installations yet</p>
                <p className="text-sm text-foreground-light mt-1 max-w-sm">
                  Install a private app to start generating scoped access tokens for your projects
                </p>
              </div>
              <Button type="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
                Install your first app
              </Button>
            </div>
          ) : (
            <Table
              head={[
                <Table.th key="app">App name</Table.th>,
                <Table.th key="scope">Scope</Table.th>,
                <Table.th key="installed">Installed</Table.th>,
                <Table.th key="status">Status</Table.th>,
                <Table.th key="actions"></Table.th>,
              ]}
              body={installations.map((inst) => (
                <Table.tr key={inst.id}>
                  <Table.td>
                    <button
                      className="font-medium hover:underline text-left"
                      onClick={() => setViewInstallation(inst)}
                    >
                      {inst.appName}
                    </button>
                  </Table.td>
                  <Table.td>
                    <span className="inline-flex items-center rounded-full bg-surface-300 px-2 py-0.5 text-xs">
                      {getScopeLabel(inst.projectScope)}
                    </span>
                  </Table.td>
                  <Table.td>
                    <span className="text-sm text-foreground-light">
                      {formatDistanceToNow(inst.installedAt, { addSuffix: true })}
                    </span>
                  </Table.td>
                  <Table.td>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        inst.status === 'active'
                          ? 'bg-brand/20 text-brand'
                          : 'bg-warning/20 text-warning'
                      }`}
                    >
                      {inst.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </Table.td>
                  <Table.td align="right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="default" icon={<MoreVertical size={14} />} className="px-1" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="bottom" className="w-40">
                        <DropdownMenuItem onClick={() => setViewInstallation(inst)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleInstallationStatus(inst.id)}>
                          {inst.status === 'active' ? 'Suspend' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="!text-destructive gap-x-2"
                          onClick={() => setInstallationToDelete(inst)}
                        >
                          <Trash size={14} />
                          Uninstall
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Table.td>
                </Table.tr>
              ))}
            />
          )}
      </div>

      <CreateInstallationModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />

      <ViewInstallationSheet
        installation={viewInstallation}
        visible={viewInstallation !== null}
        onClose={() => setViewInstallation(null)}
      />

      <ConfirmationModal
        variant="destructive"
        visible={installationToDelete !== null}
        title={`Uninstall "${installationToDelete?.appName}"`}
        confirmLabel="Uninstall"
        onCancel={() => setInstallationToDelete(null)}
        onConfirm={handleDelete}
      >
        <p className="text-sm text-foreground-light py-2">
          Are you sure you want to uninstall <strong>{installationToDelete?.appName}</strong>? Any
          tokens generated through this installation will stop working.
        </p>
      </ConfirmationModal>
    </>
  )
}
