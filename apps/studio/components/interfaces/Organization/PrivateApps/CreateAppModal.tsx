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
import { MOCK_PERMISSIONS } from './PrivateApps.constants'
import { PrivateApp, usePrivateApps } from './PrivateAppsContext'

interface CreateAppModalProps {
  visible: boolean
  onClose: () => void
  onCreated: (app: PrivateApp, privateKey: string) => void
}

export function CreateAppModal({ visible, onClose, onCreated }: CreateAppModalProps) {
  const { createApp } = usePrivateApps()
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
    const app = createApp({
      name: name.trim(),
      description: description.trim(),
      permissions: Array.from(selectedPermissions),
    })
    const privateKey = generateMockPrivateKey()
    reset()
    onCreated(app, privateKey)
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

  const filtered = MOCK_PERMISSIONS.filter(
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
                      <label
                        key={perm.id}
                        className="flex items-start gap-3 cursor-pointer group"
                      >
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
                      <label
                        key={perm.id}
                        className="flex items-start gap-3 cursor-pointer group"
                      >
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
          <Button type="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="primary" disabled={!canCreate} onClick={handleCreate}>
            Create app
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function generateMockPrivateKey(): string {
  return `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAy8Dbv8prpJ/0kKhlGeJYozo2t60EG8L0561g13R29LvMR5hy
vGZlGJpmn65+A4xHXInJYiPuKzrKUnApeLZ+vw1HocOAZtWK0z3r26uA8kQYOKX9
QQlcPuZFw7nMhOt9NpFpPAP2cHnwC8tqzK6iMYa2MhRy0vUNF8x6jKRXzRJkYqGX
bAm+aeZd8GFnYGblRv0ZeYhV8xoITaS6MkSxrIaAPKlqJFJtCxCEhGpnqkZpUkBj
b0gHK8pQzZ7GzQQ4r7v3Vk0NG9i8H1Q+rOuq2jMDiY9xHEZxHr/xoVN2pBZ1rGp5
K1nxZnBR2yN9P1Zu0f6V4jWK7rF7Z8Q2kMWLWQIDAQABAoIBAC5RgZ+hBx7xHNaM
pPgwGptyVGJBPBgzKpJLUXlchGCFHRMDekrpWo0kFCqkPZqgc9DcnAVKf3MJ5iMy
b3m4K+Q5DKFE2Rl4Aqy5QkWwjU2V3PtMfpuiHvW4hXp+9SEDqJ4sFexaKqMBN2R
5kOCm8n0J9YlJ4Gy+dV3KXjCPpB8Q/Vh9G0gvJDgDFT8RqyPhMbEW3M/ckTzB+Zk
HRlbMNxf2PQRCP+EQPE0sZXS2D3VN/rCmq0B7h7i8K4Y5n7+8rN9dEQpvO5dMnkq
T2CQVR/APzCFrH0l6LkFpYW7DuMkVqFR9s/1R9I0GpIXfAMElCFbNSxXVaGe8oYp
+cUJKAECgYEA7jk3PtnhFH+c0mMK7HEGXw1n1xFcDY5M7V3MV7oFSp5nxc/l9nGn
B7yQK9GVFxJL5Uy8Fzr9W0X6z+PvTNDp3F0dIBMpP9tYZHQBvOa9L4VJpGa1aAkM
5LbsY0kK3ABMQ5b+MKbw9T1sKSb5CuPGCVFM6H8O0X1aFd/nLgkCgYEA2fBhS4+G
8dCOaXpJ1hI8MH8Q7vMn/SJuZoAu5XMHqy3lJdPvv8G4OuiIB/fNkqF2l7Y0yFME
5LZAB1eFlf/7OcfiFjp1V9mQ1VODHulDq9rB3fHM2b9mGKq+hHXqCBg8B6dZL9s7
5U6kZ2S6PtP8JxfUqHcLGFWFXMr9v9M5hgECgYEAjvCNrFQj3WJHEX4r0k4lajkF
4VqxH8iGqBJf7CkECqd+R8mFqRsBP/GQJT0sxIMn7JEK9MJ0c3H2nR6hIp/TYMGM
sEVPrP5cqmS2Ue/VjLYq3+sUVSJjCaA5R6cSqe0d7TPUqj7dBvh0rG28/Y9M3Lvs
0Jys9TbqNfRN1lkCgYBfkEMjRlzGZ3rQ8JYG+3VOVL5u2Qm5ygJ0O5QKqA+5g9aA
m7MUiJpWL2X/nVCi7V0JFjJqN7gN7oiH9tQDlgQ3lXhsZ6L5iXvHi1LXXq3cFLUZ
TG0moBvH4+LOXbsZ5kFkWUe8OJqaQZxP2BjRB1mE5HRY7qOFdK0K7m7BAQKBgQCQ
3KpM8GFRI6mjxvyCChFv+fq1P5AqF1r7Y/rrOV7BxBZ3p3wWG7RqYF7IbZFdYa/n
VYvN6UgL1KJbJ7kh6dEWCGJLMEDpx5zHg5gEV9V3fxMl8T3p+HVQR9iJuL2mGnhb
Rx4z7Q8mXZ98vqP7N8DPRM2a8T/iFUjJBRrM3Q==
-----END RSA PRIVATE KEY-----`
}
