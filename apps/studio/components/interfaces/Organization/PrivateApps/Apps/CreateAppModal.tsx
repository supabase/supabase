import { Search } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Checkbox_Shadcn_,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Input_Shadcn_,
  Label_Shadcn_,
  ScrollArea,
  cn,
} from 'ui'
import type { components } from 'api-types'
import { usePlatformAppCreateMutation } from 'data/platform-apps/platform-app-create-mutation'
import { usePrivateApps } from '../PrivateAppsContext'
import { PERMISSIONS } from './Apps.constants'

type CreatePlatformAppResponse = components['schemas']['CreatePlatformAppResponse']

interface CreateAppModalProps {
  visible: boolean
  onClose: () => void
  onCreated: (app: CreatePlatformAppResponse) => void
}

export function CreateAppModal({ visible, onClose, onCreated }: CreateAppModalProps) {
  const { slug } = usePrivateApps()
  const { mutate: createApp, isPending: isLoading } = usePlatformAppCreateMutation({
    onSuccess: (data) => {
      reset()
      onCreated(data)
    },
  })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  function reset() {
    setName('')
    setDescription('')
    setSelectedPermissions(new Set())
    setSearch('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleCreate() {
    if (!slug) return
    createApp({
      slug,
      name: name.trim(),
      description: description.trim() || undefined,
      permissions: Array.from(
        selectedPermissions
      ) as components['schemas']['CreatePlatformAppBody']['permissions'],
    })
  }

  function togglePermission(id: string) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filtered = PERMISSIONS.filter(
    (p) =>
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  )
  const orgPerms = filtered.filter((p) => p.group === 'organization')
  const projectPerms = filtered.filter((p) => p.group === 'project')

  const canCreate = name.trim().length > 0 && selectedPermissions.size > 0

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Create private app</DialogTitle>
          <DialogDescription>
            Generate a scoped access token for your organization using a private key.
          </DialogDescription>
        </DialogHeader>

        <DialogSection className="space-y-4">
          <div className="space-y-2">
            <Label_Shadcn_ htmlFor="app-name">
              App name <span className="text-destructive">*</span>
            </Label_Shadcn_>
            <Input_Shadcn_
              id="app-name"
              placeholder="My integration"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label_Shadcn_ htmlFor="app-description">Description</Label_Shadcn_>
            <textarea
              id="app-description"
              placeholder="Optional description of what this app does"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={cn(
                'w-full rounded-md border border-control bg-transparent px-3 py-2 text-sm',
                'placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-foreground-muted',
                'resize-none'
              )}
            />
          </div>
        </DialogSection>

        <div className="border-t border-default" />

        <DialogSection className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Permissions</p>
              <p className="text-xs text-foreground-light">
                Select the permissions this app requires
              </p>
            </div>
            {selectedPermissions.size > 0 && (
              <span className="text-xs bg-surface-300 text-foreground-light px-2 py-0.5 rounded-full">
                {selectedPermissions.size} selected
              </span>
            )}
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted"
            />
            <Input_Shadcn_
              placeholder="Search permissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <ScrollArea className="h-64 rounded-md border border-control">
            <div className="p-3 space-y-4">
              {orgPerms.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                    Organization permissions
                  </p>
                  <div className="space-y-2">
                    {orgPerms.map((perm) => (
                      <label key={perm.id} className="flex items-start gap-3 cursor-pointer group">
                        <Checkbox_Shadcn_
                          id={perm.id}
                          checked={selectedPermissions.has(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-mono leading-none">{perm.label}</p>
                          <p className="text-xs text-foreground-light mt-0.5">{perm.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {projectPerms.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
                    Project permissions
                  </p>
                  <div className="space-y-2">
                    {projectPerms.map((perm) => (
                      <label key={perm.id} className="flex items-start gap-3 cursor-pointer group">
                        <Checkbox_Shadcn_
                          id={perm.id}
                          checked={selectedPermissions.has(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-mono leading-none">{perm.label}</p>
                          <p className="text-xs text-foreground-light mt-0.5">{perm.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {filtered.length === 0 && (
                <p className="text-sm text-foreground-light text-center py-4">
                  No permissions match your search
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogSection>

        <DialogFooter>
          <Button type="default" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="primary" disabled={!canCreate} loading={isLoading} onClick={handleCreate}>
            Create app
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
