import { formatDistanceToNow } from 'date-fns'
import { Copy, Download, MoreVertical, Plus, Trash, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Checkbox_Shadcn_,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Label_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import Table from 'components/to-be-cleaned/Table'
import CopyButton from 'components/ui/CopyButton'
import { CreateAppSheet } from './CreateAppSheet'
import { DeleteAppModal } from './DeleteAppModal'
import { ViewAppSheet } from './ViewAppSheet'
import { PrivateApp, usePrivateApps } from './PrivateAppsContext'

interface NewAppKey {
  app: PrivateApp
  privateKey: string
  confirmed: boolean
}

export function AppsList() {
  const { apps, deleteApp } = usePrivateApps()

  const [showCreate, setShowCreate] = useState(false)
  const [newAppKey, setNewAppKey] = useState<NewAppKey | null>(null)
  const [viewApp, setViewApp] = useState<PrivateApp | null>(null)
  const [appToDelete, setAppToDelete] = useState<PrivateApp | null>(null)

  function handleCreated(app: PrivateApp, privateKey: string) {
    setShowCreate(false)
    setNewAppKey({ app, privateKey, confirmed: false })
  }

  function handleKeyDismiss() {
    setNewAppKey(null)
  }

  function handleCopyKey() {
    if (!newAppKey) return
    navigator.clipboard.writeText(newAppKey.privateKey)
    toast.success('Private key copied to clipboard')
  }

  function handleDownloadKey() {
    if (!newAppKey) return
    const blob = new Blob([newAppKey.privateKey], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${newAppKey.app.name.toLowerCase().replace(/\s+/g, '-')}-private-key.pem`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDelete() {
    if (!appToDelete) return
    deleteApp(appToDelete.id)
    toast.success(`Deleted "${appToDelete.name}"`)
    setAppToDelete(null)
  }

  function getPermissionsLabel(permissions: string[]) {
    return permissions.length === 1 ? '1 permission' : `${permissions.length} permissions`
  }

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
          <p className="text-sm text-foreground-light">
            Generate scoped access tokens for your organization using private apps.
          </p>
          <Button type="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
            Create app
          </Button>
        </div>

        {/* Private key banner — shown after creation, only dismissible once confirmed */}
        {newAppKey && (
          <Admonition
            type="tip"
            title="Save your private key now — you won't be able to see it again."
            className="relative"
            actions={
              newAppKey.confirmed ? (
                <Button
                  type="text"
                  icon={<X />}
                  className="w-7 h-7 absolute top-2.5 right-2.5"
                  onClick={handleKeyDismiss}
                />
              ) : undefined
            }
          >
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-foreground-light">App</span>
                  <span className="font-medium">{newAppKey.app.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground-light">Client ID</span>
                  <span className="font-mono text-xs">{newAppKey.app.clientId}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-light">Private key</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="default"
                      size="tiny"
                      icon={<Copy size={12} />}
                      onClick={handleCopyKey}
                    >
                      Copy
                    </Button>
                    <Button
                      type="default"
                      size="tiny"
                      icon={<Download size={12} />}
                      onClick={handleDownloadKey}
                    >
                      Download
                    </Button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={newAppKey.privateKey}
                  rows={8}
                  className="w-full rounded-md border border-control bg-surface-200 px-3 py-2 text-xs font-mono resize-none focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox_Shadcn_
                  id="key-confirmed"
                  checked={newAppKey.confirmed}
                  onCheckedChange={(v) =>
                    setNewAppKey((prev) => prev ? { ...prev, confirmed: Boolean(v) } : null)
                  }
                />
                <Label_Shadcn_ htmlFor="key-confirmed" className="cursor-pointer">
                  I have saved this private key
                </Label_Shadcn_>
              </label>
            </div>
          </Admonition>
        )}

        {apps.length === 0 ? (
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-medium">No private apps yet</p>
              <p className="text-sm text-foreground-light mt-1 max-w-sm">
                Create a private app to generate scoped access tokens for your organization
              </p>
            </div>
            <Button type="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
              Create your first app
            </Button>
          </div>
        ) : (
          <Table
            head={[
              <Table.th key="name">Name</Table.th>,
              <Table.th key="client-id">Client ID</Table.th>,
              <Table.th key="permissions">Permissions</Table.th>,
              <Table.th key="created">Created</Table.th>,
              <Table.th key="actions"></Table.th>,
            ]}
            body={apps.map((app) => (
              <Table.tr key={app.id}>
                <Table.td>
                  <button
                    className="font-medium hover:underline text-left"
                    onClick={() => setViewApp(app)}
                  >
                    {app.name}
                  </button>
                </Table.td>
                <Table.td>
                  <div className="flex items-center gap-x-2">
                    <span className="font-mono text-xs truncate max-w-[160px]">
                      {app.clientId}
                    </span>
                    <CopyButton type="default" iconOnly text={app.clientId} className="px-1" />
                  </div>
                </Table.td>
                <Table.td>
                  <span className="inline-flex items-center rounded-full bg-surface-300 px-2 py-0.5 text-xs">
                    {getPermissionsLabel(app.permissions)}
                  </span>
                </Table.td>
                <Table.td>
                  <span className="text-sm text-foreground-light">
                    {formatDistanceToNow(app.createdAt, { addSuffix: true })}
                  </span>
                </Table.td>
                <Table.td align="right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="default" icon={<MoreVertical size={14} />} className="px-1" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="bottom" className="w-32">
                      <DropdownMenuItem onClick={() => setViewApp(app)}>
                        View details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="!text-destructive gap-x-2"
                        onClick={() => setAppToDelete(app)}
                      >
                        <Trash size={14} />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Table.td>
              </Table.tr>
            ))}
          />
        )}
      </div>

      <CreateAppSheet
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />

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
      />
    </>
  )
}
