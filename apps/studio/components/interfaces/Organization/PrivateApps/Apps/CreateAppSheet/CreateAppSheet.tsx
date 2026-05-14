import type { components } from 'api-types'
import { Copy, Download, Key, Plus, RotateCcw, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Checkbox,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  WarningIcon,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'

import { usePrivateApps } from '../../PrivateAppsContext'
import { PERMISSIONS } from '../Apps.constants'
import { CreateAppSheetStep } from './CreateAppSheetStep'
import { usePlatformAppCreateMutation } from '@/data/platform-apps/platform-app-create-mutation'
import { usePlatformAppDeleteMutation } from '@/data/platform-apps/platform-app-delete-mutation'
import { usePlatformAppInstallationCreateMutation } from '@/data/platform-apps/platform-app-installation-create-mutation'
import { usePlatformAppSigningKeyCreateMutation } from '@/data/platform-apps/platform-app-signing-key-create-mutation'
import { useCopyToClipboard } from '@/hooks/ui/useCopyToClipboard'

type CreatePlatformAppResponse = components['schemas']['CreatePlatformAppResponse']
type CreatePlatformAppSigningKeyResponse =
  components['schemas']['CreatePlatformAppSigningKeyResponse']

interface CreateAppSheetProps {
  visible: boolean
  onClose: () => void
  onCreated: (app: CreatePlatformAppResponse) => void
}

export function CreateAppSheet({ visible, onClose, onCreated }: CreateAppSheetProps) {
  const { slug, installations, addInstallation } = usePrivateApps()
  const { copy } = useCopyToClipboard()

  const [name, setName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [permissionSearchOpen, setPermissionSearchOpen] = useState(false)
  const [createdApp, setCreatedApp] = useState<CreatePlatformAppResponse | null>(null)
  const [generatedKey, setGeneratedKey] = useState<CreatePlatformAppSigningKeyResponse | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const step3Ref = useRef<HTMLDivElement>(null)

  const { mutate: deleteApp, isPending: isDeleting } = usePlatformAppDeleteMutation({
    onSuccess: () => handleClose(),
  })

  const { mutate: installApp } = usePlatformAppInstallationCreateMutation({
    onSuccess: (data) => {
      if (data) addInstallation(data, 'all')
    },
  })

  const { mutate: createSigningKey, isPending: isCreatingKey } =
    usePlatformAppSigningKeyCreateMutation({
      onSuccess: (keyData, vars) => {
        if (keyData) setGeneratedKey(keyData)
        if (installations.length === 0 && slug) {
          installApp({ slug, app_id: vars.appId })
        }
      },
    })

  const { mutate: createApp, isPending: isCreatingApp } = usePlatformAppCreateMutation({
    onSuccess: (data) => {
      toast.success(`App "${data.name}" created`)
      setCreatedApp(data)
      createSigningKey({ slug: slug!, appId: data.id })
    },
  })

  function reset() {
    setName('')
    setSelectedPermissions([])
    setPermissionSearchOpen(false)
    setCreatedApp(null)
    setGeneratedKey(null)
    setKeyCopied(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleRequestClose() {
    setShowCloseConfirm(true)
  }

  function handleCreate() {
    if (!slug) return
    createApp({
      slug,
      name: name.trim(),
      permissions:
        selectedPermissions as components['schemas']['CreatePlatformAppBody']['permissions'],
    })
  }

  function toggle(id: string) {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const canCreate = name.trim().length > 0 && selectedPermissions.length > 0
  const isLoading = isCreatingApp || isCreatingKey || isDeleting
  const keyRevealed = generatedKey !== null

  useEffect(() => {
    if (generatedKey) {
      step3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [generatedKey])

  return (
    <>
      <Sheet
        open={visible}
        onOpenChange={(open) => {
          if (!open) handleRequestClose()
        }}
      >
        <SheetContent
          showClose={false}
          size="default"
          className="min-w-[600px]! flex flex-col h-full gap-0"
        >
          <SheetHeader>
            <SheetTitle>Create private app</SheetTitle>
            <SheetDescription className="sr-only">
              Create a private app to generate scoped access tokens for your organization.
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 max-h-[calc(100vh-116px)]">
            <div className="px-5 sm:px-6 py-6">
              <CreateAppSheetStep
                number={1}
                title="App details"
                description="The first app you create will be automatically installed."
                disabled={keyRevealed}
              >
                <FormLayout label="Name" id="app-name">
                  <Input_Shadcn_
                    id="app-name"
                    placeholder="My integration"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </FormLayout>
              </CreateAppSheetStep>

              <CreateAppSheetStep
                number={2}
                title="Permissions"
                description="Select the permissions this app requires."
                disabled={keyRevealed}
              >
                <div className="space-y-4">
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
                          disabled={isLoading}
                        />
                      )}
                      <Popover_Shadcn_
                        open={permissionSearchOpen}
                        onOpenChange={setPermissionSearchOpen}
                        modal
                      >
                        <PopoverTrigger_Shadcn_ asChild>
                          <Button
                            type="default"
                            size="tiny"
                            icon={<Plus size={14} />}
                            disabled={isLoading}
                          >
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
                                  {PERMISSIONS.map((perm) => (
                                    <CommandItem_Shadcn_
                                      key={perm.id}
                                      value={`${perm.id} ${perm.label}`}
                                      onSelect={() => toggle(perm.id)}
                                      className="text-foreground"
                                    >
                                      <div className="flex items-center gap-3 w-full">
                                        <Checkbox
                                          checked={selectedPermissions.includes(perm.id)}
                                          onCheckedChange={() => toggle(perm.id)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <Key size={12} className="text-foreground-lighter" />
                                        <span className="font-medium text-foreground">
                                          {perm.label}
                                        </span>
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
                      <p className="text-sm text-foreground-light">
                        No permissions configured yet.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-border rounded-lg">
                      {selectedPermissions.map((id, index) => {
                        const perm = PERMISSIONS.find((p) => p.id === id)
                        return (
                          <div key={id}>
                            <div className="flex items-center gap-3 p-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{perm?.label}</p>
                                {perm?.description && (
                                  <p className="text-xs text-foreground-lighter">
                                    {perm.description}
                                  </p>
                                )}
                              </div>
                              <Button
                                type="text"
                                size="tiny"
                                className="p-1"
                                icon={<X size={16} />}
                                disabled={isLoading}
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
              </CreateAppSheetStep>

              <div ref={step3Ref}>
                <CreateAppSheetStep
                  number={3}
                  title="Signing key"
                  description={
                    isCreatingKey
                      ? 'Generating your signing key...'
                      : keyRevealed
                        ? 'This is the only time you can view this key. Copy or download it and store it securely.'
                        : "A signing key will be generated automatically when you create the app. You'll only be able to view it once."
                  }
                  isLast
                  disabled={createdApp === null && !isLoading}
                >
                  {isCreatingKey && (
                    <p className="text-sm text-foreground-light animate-pulse">
                      Generating signing key...
                    </p>
                  )}
                  {keyRevealed && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Private key</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            type="default"
                            size="tiny"
                            icon={<Copy size={12} />}
                            onClick={() => copy(generatedKey.private_key, { withToast: true })}
                          >
                            Copy
                          </Button>
                          <Button
                            type="default"
                            size="tiny"
                            icon={<Download size={12} />}
                            onClick={() => {
                              const blob = new Blob([generatedKey.private_key], {
                                type: 'text/plain',
                              })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `${createdApp?.name.toLowerCase().replace(/\s+/g, '-')}-private-key.pem`
                              a.click()
                              URL.revokeObjectURL(url)
                            }}
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                      <textarea
                        readOnly
                        value={generatedKey.private_key}
                        rows={8}
                        className="w-full rounded-md border border-control bg-surface-200 px-3 py-2 text-xs font-mono resize-none focus:outline-hidden"
                      />
                      <label className="flex items-center gap-3 cursor-pointer bg-warning-200 border border-warning-400 rounded-md px-3 py-2">
                        <Checkbox
                          id="key-copied"
                          checked={keyCopied}
                          onCheckedChange={(v) => setKeyCopied(Boolean(v))}
                        />
                        <span className="text-sm text-warning cursor-pointer select-none">
                          I have copied the key and stored it securely
                        </span>
                      </label>
                    </div>
                  )}
                </CreateAppSheetStep>
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="justify-end! w-full mt-auto py-4 border-t">
            <div className="flex gap-2">
              <Button type="default" onClick={handleRequestClose} disabled={isLoading}>
                Cancel
              </Button>
              {keyRevealed ? (
                <Button
                  type="primary"
                  disabled={!keyCopied}
                  onClick={() => {
                    onCreated(createdApp!)
                    handleClose()
                  }}
                >
                  Done
                </Button>
              ) : (
                <Button
                  type="primary"
                  disabled={!canCreate}
                  loading={isLoading}
                  onClick={handleCreate}
                >
                  Create app
                </Button>
              )}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmationModal
        variant="destructive"
        visible={showCloseConfirm}
        title="Close without saving?"
        confirmLabel="Close"
        confirmLabelLoading="Closing..."
        onCancel={() => setShowCloseConfirm(false)}
        onConfirm={() => {
          setShowCloseConfirm(false)
          if (createdApp && slug) {
            deleteApp({ slug, appId: createdApp.id })
          } else {
            handleClose()
          }
        }}
      >
        <p className="text-sm text-foreground-light py-2">
          {createdApp
            ? 'The app will be deleted and your signing key will be permanently lost.'
            : 'Any progress you have made will be lost.'}
        </p>
      </ConfirmationModal>
    </>
  )
}
