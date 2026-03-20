import type { components } from 'api-types'
import { usePlatformAppCreateMutation } from 'data/platform-apps/platform-app-create-mutation'
import { usePlatformAppSigningKeyCreateMutation } from 'data/platform-apps/platform-app-signing-key-create-mutation'
import { Copy, Download, Key, Plus, RotateCcw, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
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

import { PERMISSIONS } from './PrivateApps.constants'
import { usePrivateApps } from './PrivateAppsContext'

type CreatePlatformAppResponse = components['schemas']['CreatePlatformAppResponse']
type CreatePlatformAppSigningKeyResponse =
  components['schemas']['CreatePlatformAppSigningKeyResponse']

const STEPS = [
  { key: 'details', label: 'App details' },
  { key: 'signing-key', label: 'Signing key' },
] as const

type Step = (typeof STEPS)[number]['key']

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const isActive = i === currentIndex
        const isDone = i < currentIndex
        return (
          <div key={step.key} className="flex items-center gap-2">
            {i > 0 && <div className="w-4 h-px bg-border-strong" />}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive || isDone ? 'bg-foreground' : 'bg-border-strong'}`}
              />
              <span
                className={`text-xs transition-colors ${isActive ? 'text-foreground' : 'text-foreground-muted'}`}
              >
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface CreateAppSheetProps {
  visible: boolean
  onClose: () => void
  onCreated: (app: CreatePlatformAppResponse) => void
}

export function CreateAppSheet({ visible, onClose, onCreated }: CreateAppSheetProps) {
  const { slug } = usePrivateApps()
  const [step, setStep] = useState<Step>('details')
  const [createdApp, setCreatedApp] = useState<CreatePlatformAppResponse | null>(null)
  const [generatedKey, setGeneratedKey] = useState<CreatePlatformAppSigningKeyResponse | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)

  const { mutate: createApp, isPending: isCreatingApp } = usePlatformAppCreateMutation({
    onSuccess: (data) => {
      toast.success(`App "${data.name}" created`)
      setCreatedApp(data)
      setStep('signing-key')
    },
  })

  const { mutate: createSigningKey, isPending: isCreatingKey } =
    usePlatformAppSigningKeyCreateMutation({
      onSuccess: (keyData) => {
        if (keyData) setGeneratedKey(keyData)
      },
    })

  const [name, setName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [permissionSearchOpen, setPermissionSearchOpen] = useState(false)

  function reset() {
    setName('')
    setSelectedPermissions([])
    setPermissionSearchOpen(false)
    setStep('details')
    setCreatedApp(null)
    setGeneratedKey(null)
    setKeyCopied(false)
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
      permissions:
        selectedPermissions as components['schemas']['CreatePlatformAppBody']['permissions'],
    })
  }

  function handleGenerateKey() {
    if (!slug || !createdApp) return
    createSigningKey({ slug, appId: createdApp.id })
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
          <SheetTitle>
            {step === 'details' ? 'Create private app' : 'Generate signing key'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {step === 'details'
              ? 'Create a private app to generate scoped access tokens for your organization.'
              : 'Generate a signing key for your new app.'}
          </SheetDescription>
        </SheetHeader>

        {step === 'details' ? (
          <>
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
                                  {PERMISSIONS.filter((p) => p.group === 'project').map((perm) => (
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

            <SheetFooter className="!flex-row !justify-between items-center w-full mt-auto py-4 border-t">
              <StepIndicator currentStep="details" />
              <div className="flex gap-2">
                <Button type="default" onClick={handleClose} disabled={isCreatingApp}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  disabled={!canCreate}
                  loading={isCreatingApp}
                  onClick={handleCreate}
                >
                  Create app
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : (
          <>
            <ScrollArea className="flex-1 max-h-[calc(100vh-116px)]">
              <div className="flex flex-col gap-0">
                {/* App info */}
                <div className="px-5 sm:px-6 py-6">
                  <div className="border border-border rounded-lg divide-y divide-border">
                    <div className="flex items-center px-4 py-3 gap-4">
                      <span className="text-sm text-foreground-light w-24 shrink-0">App name</span>
                      <span className="text-sm font-medium">{createdApp?.name}</span>
                    </div>
                    <div className="flex items-center px-4 py-3 gap-4">
                      <span className="text-sm text-foreground-light w-24 shrink-0">App ID</span>
                      <span className="font-mono text-xs truncate">{createdApp?.id}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Signing key */}
                <div className="px-5 sm:px-6 py-6">
                  {generatedKey ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Private key</h3>
                        <div className="flex items-center gap-2">
                          <Button
                            type="default"
                            size="tiny"
                            icon={<Copy size={12} />}
                            onClick={() => {
                              navigator.clipboard.writeText(generatedKey.private_key)
                              toast.success('Private key copied to clipboard')
                            }}
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
                        className="w-full rounded-md border border-control bg-surface-200 px-3 py-2 text-xs font-mono resize-none focus:outline-none"
                      />
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox_Shadcn_
                          id="key-copied"
                          checked={keyCopied}
                          onCheckedChange={(v) => setKeyCopied(Boolean(v))}
                        />
                        <span className="text-sm text-foreground-light cursor-pointer select-none">
                          I have copied the key and stored it securely
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Signing key</h3>
                      <p className="text-sm text-foreground-light">
                        Generate a signing key to authenticate requests made by this app. You'll
                        only be able to view the private key once — store it securely.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="!flex-row !justify-between items-center w-full mt-auto py-4 border-t">
              <StepIndicator currentStep="signing-key" />
              <div className="flex gap-2">
                {generatedKey ? (
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
                    icon={<Key size={14} />}
                    loading={isCreatingKey}
                    onClick={handleGenerateKey}
                  >
                    Generate signing key
                  </Button>
                )}
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
