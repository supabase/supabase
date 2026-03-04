import { Key, Plus, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Checkbox_Shadcn_,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  WarningIcon,
} from 'ui'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import { MOCK_PERMISSIONS } from './PrivateApps.constants'
import { PrivateApp, usePrivateApps } from './PrivateAppsContext'

interface CreateAppSheetProps {
  visible: boolean
  onClose: () => void
  onCreated: (app: PrivateApp, privateKey: string) => void
}

export function CreateAppSheet({ visible, onClose, onCreated }: CreateAppSheetProps) {
  const { createApp } = usePrivateApps()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [permissionSearchOpen, setPermissionSearchOpen] = useState(false)

  function reset() {
    setName('')
    setDescription('')
    setSelectedPermissions([])
    setPermissionSearchOpen(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleCreate() {
    const app = createApp({
      name: name.trim(),
      description: description.trim(),
      permissions: selectedPermissions,
    })
    const privateKey = generateMockPrivateKey()
    reset()
    onCreated(app, privateKey)
  }

  function toggle(id: string) {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const canCreate = name.trim().length > 0 && selectedPermissions.length > 0

  return (
    <Sheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <SheetContent
        showClose={false}
        size="default"
        className="!min-w-[600px] flex flex-col h-full gap-0"
      >
        <SheetHeader>
          <SheetTitle>Create private app</SheetTitle>
          <SheetDescription className="sr-only">
            Create a private app to generate scoped access tokens for your organization.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 max-h-[calc(100vh-116px)]">
          <div className="flex flex-col gap-0">
            {/* Basic info */}
            <div className="px-5 sm:px-6 py-6 space-y-4">
              <FormLayout label="App name" id="app-name">
                <Input_Shadcn_
                  id="app-name"
                  placeholder="My integration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormLayout>

              <FormLayout label="Description" id="app-description">
                <textarea
                  id="app-description"
                  placeholder="Optional description of what this app does"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-control bg-transparent px-3 py-2 text-sm placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-foreground-muted resize-none"
                />
              </FormLayout>
            </div>

            <Separator />

            {/* Permissions */}
            <div className="px-5 sm:px-6 py-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Configure permissions</span>
                <div className="flex items-center gap-2">
                  {selectedPermissions.length > 0 && (
                    <Button
                      type="default"
                      size="tiny"
                      className="p-1"
                      icon={<RotateCcw size={16} />}
                      onClick={() => setSelectedPermissions([])}
                    />
                  )}
                  <Popover_Shadcn_
                    open={permissionSearchOpen}
                    onOpenChange={setPermissionSearchOpen}
                    modal
                  >
                    <PopoverTrigger_Shadcn_ asChild>
                      <Button type="default" size="tiny" icon={<Plus size={14} />}>
                        Add permission
                      </Button>
                    </PopoverTrigger_Shadcn_>
                    <PopoverContent_Shadcn_ className="w-[400px] p-0" align="end">
                      <Command_Shadcn_>
                        <CommandInput_Shadcn_ placeholder="Search permissions..." />
                        <CommandList_Shadcn_>
                          <CommandEmpty_Shadcn_>No permissions found.</CommandEmpty_Shadcn_>
                          <CommandGroup_Shadcn_ className="[&>div]:text-left">
                            <div className="max-h-[210px] overflow-y-auto">
                              {MOCK_PERMISSIONS.map((perm) => (
                                <CommandItem_Shadcn_
                                  key={perm.id}
                                  value={`${perm.id} ${perm.label}`}
                                  onSelect={() => toggle(perm.id)}
                                >
                                  <div className="flex items-center gap-3 w-full">
                                    <Checkbox_Shadcn_
                                      checked={selectedPermissions.includes(perm.id)}
                                      onCheckedChange={() => toggle(perm.id)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <Key size={12} className="text-foreground-lighter" />
                                    <div className="flex flex-col text-left flex-1">
                                      <span className="font-medium text-foreground font-mono text-sm">
                                        {perm.label}
                                      </span>
                                      <span className="text-xs text-foreground-light">
                                        {perm.description}
                                      </span>
                                    </div>
                                  </div>
                                </CommandItem_Shadcn_>
                              ))}
                            </div>
                          </CommandGroup_Shadcn_>
                        </CommandList_Shadcn_>
                      </Command_Shadcn_>
                    </PopoverContent_Shadcn_>
                  </Popover_Shadcn_>
                </div>
              </div>

              {selectedPermissions.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-lg">
                  <p className="text-sm text-foreground-light">No permissions configured yet.</p>
                </div>
              ) : (
                <div className="border border-border rounded-lg">
                  {selectedPermissions.map((id, index) => {
                    const perm = MOCK_PERMISSIONS.find((p) => p.id === id)
                    return (
                      <div key={id}>
                        <div className="flex items-center gap-3 p-3">
                          <div className="flex-1">
                            <p className="text-sm font-mono font-medium">{perm?.label}</p>
                            <p className="text-xs text-foreground-light">{perm?.description}</p>
                          </div>
                          <Button
                            type="text"
                            size="tiny"
                            className="p-1"
                            icon={<X size={16} />}
                            onClick={() =>
                              setSelectedPermissions((prev) => prev.filter((p) => p !== id))
                            }
                          />
                        </div>
                        {index < selectedPermissions.length - 1 && (
                          <div className="border-t border-border" />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="w-full flex gap-x-2 items-center">
                <WarningIcon />
                <span className="text-xs text-foreground-lighter">
                  Once you've set these permissions, you cannot edit them.
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="!justify-end w-full mt-auto py-4 border-t">
          <div className="flex gap-2">
            <Button type="default" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="primary" disabled={!canCreate} onClick={handleCreate}>
              Create app
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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
