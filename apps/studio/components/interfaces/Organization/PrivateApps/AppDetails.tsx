import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, ChevronRight, Pencil, RotateCcw, Trash, X } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  Input_Shadcn_,
} from 'ui'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import CopyButton from 'components/ui/CopyButton'
import { MOCK_PERMISSIONS } from './PrivateApps.constants'
import { DeleteAppModal } from './DeleteAppModal'
import { PrivateApp, usePrivateApps } from './PrivateAppsContext'

interface AppDetailsProps {
  app: PrivateApp
}

export function AppDetails({ app }: AppDetailsProps) {
  const router = useRouter()
  const { slug } = router.query as { slug: string }
  const { updateApp, deleteApp } = usePrivateApps()

  const [editingName, setEditingName] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [nameValue, setNameValue] = useState(app.name)
  const [descriptionValue, setDescriptionValue] = useState(app.description)
  const [showPublicKey, setShowPublicKey] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  function saveName() {
    if (nameValue.trim() && nameValue.trim() !== app.name) {
      updateApp(app.id, { name: nameValue.trim() })
      toast.success('App name updated')
    }
    setEditingName(false)
  }

  function saveDescription() {
    if (descriptionValue !== app.description) {
      updateApp(app.id, { description: descriptionValue })
      toast.success('Description updated')
    }
    setEditingDescription(false)
  }

  function handleDelete() {
    deleteApp(app.id)
    toast.success(`Deleted "${app.name}"`)
    router.push(`/org/${slug}/private-apps`)
  }

  const orgPermissions = app.permissions
    .map((id) => MOCK_PERMISSIONS.find((p) => p.id === id))
    .filter(Boolean)
    .filter((p) => p!.group === 'organization')

  const projectPermissions = app.permissions
    .map((id) => MOCK_PERMISSIONS.find((p) => p.id === id))
    .filter(Boolean)
    .filter((p) => p!.group === 'project')

  return (
    <>
      <ScaffoldContainer className="px-6 xl:px-10">
        <ScaffoldSection isFullWidth className="flex flex-col gap-y-8">
          {/* App Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">App Information</h3>
            <div className="border border-default rounded-lg divide-y divide-default">
              {/* Name */}
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <span className="text-sm text-foreground-light w-32 shrink-0">Name</span>
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
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-medium flex-1">{app.name}</span>
                    <Button
                      type="text"
                      size="tiny"
                      icon={<Pencil size={12} />}
                      className="px-1 opacity-0 group-hover:opacity-100"
                      onClick={() => setEditingName(true)}
                    />
                  </div>
                )}
                {!editingName && (
                  <Button
                    type="text"
                    size="tiny"
                    icon={<Pencil size={12} />}
                    className="px-1"
                    onClick={() => setEditingName(true)}
                  />
                )}
              </div>

              {/* Description */}
              <div className="flex items-start justify-between px-4 py-3 gap-4">
                <span className="text-sm text-foreground-light w-32 shrink-0 pt-0.5">
                  Description
                </span>
                {editingDescription ? (
                  <div className="flex flex-col gap-2 flex-1">
                    <textarea
                      value={descriptionValue}
                      onChange={(e) => setDescriptionValue(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-control bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-foreground-muted"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button type="primary" size="tiny" onClick={saveDescription}>
                        Save
                      </Button>
                      <Button
                        type="default"
                        size="tiny"
                        onClick={() => {
                          setDescriptionValue(app.description)
                          setEditingDescription(false)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-sm flex-1 text-foreground-light">
                      {app.description || (
                        <span className="italic text-foreground-muted">No description</span>
                      )}
                    </span>
                    <Button
                      type="text"
                      size="tiny"
                      icon={<Pencil size={12} />}
                      className="px-1"
                      onClick={() => setEditingDescription(true)}
                    />
                  </div>
                )}
              </div>

              {/* Client ID */}
              <div className="flex items-center px-4 py-3 gap-4">
                <span className="text-sm text-foreground-light w-32 shrink-0">Client ID</span>
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-mono text-sm">{app.clientId}</span>
                  <CopyButton type="default" iconOnly text={app.clientId} className="px-1" />
                </div>
              </div>

              {/* Created */}
              <div className="flex items-center px-4 py-3 gap-4">
                <span className="text-sm text-foreground-light w-32 shrink-0">Created</span>
                <span className="text-sm">
                  {formatDistanceToNow(app.createdAt, { addSuffix: true })}
                </span>
              </div>

              {/* Public Key */}
              <Collapsible_Shadcn_
                open={showPublicKey}
                onOpenChange={setShowPublicKey}
              >
                <CollapsibleTrigger_Shadcn_ asChild>
                  <div className="flex items-center px-4 py-3 gap-4 cursor-pointer hover:bg-surface-100">
                    <span className="text-sm text-foreground-light w-32 shrink-0">Public Key</span>
                    <span className="text-sm text-foreground-light flex-1">
                      {showPublicKey ? 'Hide' : 'Show public key'}
                    </span>
                    {showPublicKey ? (
                      <ChevronDown size={14} className="text-foreground-muted" />
                    ) : (
                      <ChevronRight size={14} className="text-foreground-muted" />
                    )}
                  </div>
                </CollapsibleTrigger_Shadcn_>
                <CollapsibleContent_Shadcn_>
                  <div className="px-4 pb-3">
                    <textarea
                      readOnly
                      value={app.publicKey}
                      rows={6}
                      className="w-full rounded-md border border-control bg-surface-100 px-3 py-2 text-xs font-mono resize-none focus:outline-none"
                    />
                  </div>
                </CollapsibleContent_Shadcn_>
              </Collapsible_Shadcn_>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Requested Permissions</h3>
            <div className="border border-default rounded-lg divide-y divide-default">
              {orgPermissions.length > 0 && (
                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                    Organization permissions
                  </p>
                  <div className="space-y-2">
                    {orgPermissions.map((p) => (
                      <div key={p!.id} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm font-mono">{p!.label}</p>
                          <p className="text-xs text-foreground-light">{p!.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {projectPermissions.length > 0 && (
                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                    Project permissions
                  </p>
                  <div className="space-y-2">
                    {projectPermissions.map((p) => (
                      <div key={p!.id} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-foreground-muted mt-1.5 shrink-0" />
                        <div>
                          <p className="text-sm font-mono">{p!.label}</p>
                          <p className="text-xs text-foreground-light">{p!.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Installations */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Installations</h3>
            <div className="bg-surface-100 border border-default rounded-lg p-8 flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-foreground-light">This app hasn't been installed yet</p>
              <p className="text-xs text-foreground-muted max-w-sm">
                Install this app to specific projects to start generating tokens
              </p>
              <Button type="default" disabled>
                Create installation
              </Button>
            </div>
          </div>

          {/* Danger zone */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
            <div className="border border-destructive/30 rounded-lg divide-y divide-default">
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Rotate key pair</p>
                  <p className="text-xs text-foreground-light">
                    Generate a new key pair and invalidate the current private key
                  </p>
                </div>
                <Button type="default" icon={<RotateCcw size={14} />} disabled>
                  Rotate key
                </Button>
              </div>
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
                  Delete app
                </Button>
              </div>
            </div>
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      <DeleteAppModal
        app={app}
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </>
  )
}
