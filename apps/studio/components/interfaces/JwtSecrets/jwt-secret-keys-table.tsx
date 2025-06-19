import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  CircleArrowDown,
  CircleArrowUp,
  Eye,
  FileKey,
  Import,
  Key,
  MoreVertical,
  RotateCw,
  ShieldOff,
  Timer,
  Trash2,
} from 'lucide-react'
import React, { useMemo, useState } from 'react'

import type { components } from 'api-types'
import { useParams } from 'common'
import { useJWTSigningKeyCreateMutation } from 'data/jwt-signing-keys/jwt-signing-key-create-mutation'
import { useJWTSigningKeyDeleteMutation } from 'data/jwt-signing-keys/jwt-signing-key-delete-mutation'
import { useJWTSigningKeyUpdateMutation } from 'data/jwt-signing-keys/jwt-signing-key-update-mutation'
import { JWTSigningKey, useJWTSigningKeysQuery } from 'data/jwt-signing-keys/jwt-signing-keys-query'
import { useLegacyJWTSigningKeyCreateMutation } from 'data/jwt-signing-keys/legacy-jwt-signing-key-create-mutation'
import { useLegacyJWTSigningKeyQuery } from 'data/jwt-signing-keys/legacy-jwt-signing-key-query'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Label_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
import { algorithmDescriptions, algorithmLabels, JWTAlgorithm } from './algorithm-details'
import { AlgorithmHoverCard } from './algorithm-hover-card'
import { statusColors, statusLabels } from './jwt.constants'

export default function JWTSecretKeysTable() {
  const { ref: projectRef } = useParams()

  const [selectedKey, setSelectedKey] = useState<JWTSigningKey | null>(null)
  const [shownDialog, setShownDialog] = useState<
    'legacy' | 'create' | 'rotate' | 'confirm-rotate' | 'key-details' | 'revoke' | 'delete' | null
  >(null)

  const resetDialog = () => {
    setSelectedKey(null)
    setShownDialog(null)
  }

  const [newKeyAlgorithm, setNewKeyAlgorithm] = useState<JWTAlgorithm>('RS256')

  const { data: signingKeys, isLoading: isLoadingSigningKeys } = useJWTSigningKeysQuery({
    projectRef,
  })
  const { data: legacyKey, isLoading: isLoadingLegacyKey } = useLegacyJWTSigningKeyQuery({
    projectRef,
  })

  const legacyMutation = useLegacyJWTSigningKeyCreateMutation()
  const createMutation = useJWTSigningKeyCreateMutation()
  const updateMutation = useJWTSigningKeyUpdateMutation()
  const deleteMutation = useJWTSigningKeyDeleteMutation()

  const isLoadingMutation =
    createMutation.isLoading ||
    updateMutation.isLoading ||
    deleteMutation.isLoading ||
    legacyMutation.isLoading
  const isLoading = isLoadingSigningKeys || isLoadingLegacyKey

  const sortedKeys = useMemo(() => {
    if (!signingKeys || !Array.isArray(signingKeys.keys)) return []

    return signingKeys.keys.sort((a: JWTSigningKey, b: JWTSigningKey) => {
      const order: Record<JWTSigningKey['status'], number> = {
        standby: 0,
        in_use: 1,
        previously_used: 2,
        revoked: 3,
      }
      return (
        order[a.status] - order[b.status] ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    })
  }, [signingKeys])

  const standbyKey = useMemo(() => sortedKeys.find((key) => key.status === 'standby'), [sortedKeys])
  const inUseKey = useMemo(() => sortedKeys.find((key) => key.status === 'in_use'), [sortedKeys])
  const previouslyUsedKeys = useMemo(
    () => sortedKeys.filter((key) => key.status === 'previously_used'),
    [sortedKeys]
  )
  const revokedKeys = useMemo(
    () => sortedKeys.filter((key) => key.status === 'revoked'),
    [sortedKeys]
  )

  const resetNewKeyForm = () => {
    setNewKeyAlgorithm('RS256')
  }

  const handleLegacyMigration = async () => {
    try {
      await legacyMutation.mutateAsync({
        projectRef: projectRef!,
      })
    } catch (error) {
      console.error('Failed to migrate legacy JWT secret to new JWT signing keys', error)
    }
  }

  const handleAddNewStandbyKey = async () => {
    try {
      await createMutation.mutateAsync({
        projectRef: projectRef!,
        algorithm: newKeyAlgorithm,
        status: 'standby',
      })
      resetDialog()
    } catch (error) {
      console.error('Failed to add new standby key', error)
    }
  }

  const handlePreviouslyUsedKey = async (keyId: string) => {
    if (!projectRef) {
      return
    }
    try {
      await updateMutation.mutateAsync({ projectRef, keyId, status: 'previously_used' })
      resetDialog()
    } catch (error) {
      console.error('Failed to move key to previously used', error)
    }
  }

  const handleStandbyKey = async (keyId: string) => {
    try {
      await updateMutation.mutateAsync({ projectRef: projectRef!, keyId, status: 'standby' })
      resetDialog()
    } catch (error) {
      console.error('Failed to move key to standby', error)
    }
  }

  const handleRevokeKey = async (keyId: string) => {
    try {
      await updateMutation.mutateAsync({ projectRef: projectRef!, keyId, status: 'revoked' })
      resetDialog()
    } catch (error) {
      console.error('Failed to revoke key', error)
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    try {
      await deleteMutation.mutateAsync({ projectRef: projectRef!, keyId })
      resetDialog()
    } catch (error) {
      console.error('Failed to delete key', error)
    }
  }

  const handleRotateKey = async () => {
    try {
      await updateMutation.mutateAsync({
        projectRef: projectRef!,
        keyId: standbyKey!.id,
        status: 'in_use',
      })
      resetDialog()
    } catch (error) {
      console.error('Failed to rotate key', error)
    }
  }

  const MotionTableRow = motion(TableRow)

  const renderKeyRow = (key: components['schemas']['SigningKeyResponse']) => (
    <MotionTableRow
      key={key.id}
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{
        opacity: 1,
        height: 'auto',
        transition: { duration: 0.2 },
      }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(key.status !== 'in_use' ? 'border-b border-dashed border-border' : 'border-b')}
    >
      <TableCell className="w-[150px] pr-0 py-2">
        <div className="flex -space-x-px items-center">
          <Badge
            className={cn(
              statusColors[key.status],
              'rounded-r-none',
              'gap-2 w-full h-6',
              'uppercase font-mono',
              'border-r-0'
            )}
          >
            {key.status === 'standby' ? <Timer size={13} /> : <Key size={13} />}
            {statusLabels[key.status]}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="font-mono truncate max-w-[100px] pl-0 py-2">
        <div className="">
          <Badge
            className={cn(
              'bg-opacity-100 bg-200 border-foreground-muted',
              'rounded-l-none',
              'gap-2 py-2 h-6'
            )}
          >
            <span className="truncate">{key.id}</span>
            <button
              onClick={() => {
                setSelectedKey(key)
                setShownDialog('key-details')
              }}
            >
              <Eye size={13} strokeWidth={1.5} />
            </button>
          </Badge>
        </div>
      </TableCell>
      <TableCell className="truncate max-w-[100px] py-2">
        <AlgorithmHoverCard algorithm={key.algorithm} legacy={key.id === legacyKey?.id} />
      </TableCell>
      <TableCell className="text-right py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="text" className="px-2" icon={<MoreVertical />} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                setSelectedKey(key)
                setShownDialog('key-details')
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View key details
            </DropdownMenuItem>
            {key.status === 'standby' && (
              <>
                <DropdownMenuItem
                  onSelect={() => handlePreviouslyUsedKey(key.id)}
                  className="text-destructive"
                >
                  <CircleArrowDown className="mr-2 h-4 w-4" />
                  Move to previously used
                </DropdownMenuItem>
              </>
            )}
            {key.status === 'previously_used' && (
              <DropdownMenuItem
                onSelect={() => {
                  setSelectedKey(key)
                  setShownDialog('revoke')
                }}
                className="text-destructive"
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Revoke key
                <span className="text-xs text-foreground-light ml-2">(after 30 days)</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </MotionTableRow>
  )

  interface ActionPanelProps extends Omit<React.ComponentProps<typeof Card>, 'onClick' | 'type'> {
    title: string
    description: string
    buttonLabel: React.ComponentProps<typeof Button>['children']
    onClick: React.ComponentProps<typeof Button>['onClick']
    loading: React.ComponentProps<typeof Button>['loading']
    icon?: React.ComponentProps<typeof Button>['icon']
    type?: React.ComponentProps<typeof Button>['type']
  }

  const ActionPanel = React.forwardRef<HTMLDivElement, ActionPanelProps>(
    ({ title, description, buttonLabel, onClick, loading, icon, type, ...props }, ref) => {
      return (
        <Card
          className="bg-surface-100 first:rounded-b-none last:rounded-t-none shadow-none only:rounded-lg"
          ref={ref}
          {...props}
        >
          <CardHeader className="lg:flex-row lg:items-center gap-3 lg:gap-10 py-4 border-0">
            <div className="flex flex-col gap-0 flex-1 grow">
              <CardTitle className="text-sm">{title}</CardTitle>
              <CardDescription className="max-w-xl">{description}</CardDescription>
            </div>
            <div className="flex lg:justify-end flex-">
              <Button onClick={onClick} loading={loading} icon={icon} type={type}>
                {buttonLabel}
              </Button>
            </div>
          </CardHeader>
        </Card>
      )
    }
  )
  ActionPanel.displayName = 'ActionPanel'

  return (
    <>
      <div className="-space-y-px">
        {legacyKey ? (
          <>
            {standbyKey && (
              <ActionPanel
                title="Rotate Signing Key"
                description="Promote the standby key to in use. All new JWTs will be signed with this key. Make sure the standby key has been received by all of your application's components to avoid downtime."
                buttonLabel="Rotate keys"
                onClick={() => setShownDialog('rotate')}
                loading={isLoadingMutation}
                icon={<RotateCw />}
                type="warning"
              />
            )}

            {!standbyKey && (
              <ActionPanel
                title="Create standby key"
                description="Create a standby key for the next rotation which will be used on next key rotation."
                buttonLabel="Create Standby Key"
                onClick={() => setShownDialog('create')}
                loading={isLoadingMutation}
                type="primary"
                icon={<Timer />}
              />
            )}
          </>
        ) : (
          <ActionPanel
            title="Start using JWT signing keys"
            description="Right now your project is using the legacy JWT secret. To start taking advantage of the new JWT signing keys, migrate your project's secret to the new set up."
            buttonLabel="Migrate JWT secret"
            onClick={() => setShownDialog('legacy')}
            loading={isLoadingMutation}
            type="primary"
            icon={<Import />}
          />
        )}
      </div>

      {sortedKeys.length > 0 && (
        <>
          <div>
            <Card className="w-full overflow-hidden bg-surface-100 border rounded-md">
              <CardContent className="p-0">
                <Table className="p-5">
                  <TableHeader className="bg-200">
                    <TableRow>
                      <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2 pr-0 w-20">
                        Status
                      </TableHead>
                      <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2 pl-0">
                        Key ID
                      </TableHead>
                      <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2">
                        Type
                      </TableHead>
                      <TableHead className="text-right font-mono uppercase text-xs text-foreground-muted h-auto py-2">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {standbyKey && renderKeyRow(standbyKey)}
                      {inUseKey && renderKeyRow(inUseKey)}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="mt-2">
            <h2 className="text-xl mb-4">Previously used keys</h2>
            <p className="text-sm text-secondary mb-4">
              These JWT signing keys are still used to <strong>verify</strong> JWTs already issued.
              Revoke them once all JWTs have expired.
            </p>
            <Card className="w-full overflow-hidden bg-surface-100 border rounded-md">
              <CardContent className="p-0">
                {previouslyUsedKeys.length > 0 ? (
                  <Table className="p-5">
                    <TableHeader className="bg-200">
                      <TableRow>
                        <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2 pr-0 w-20">
                          Status
                        </TableHead>
                        <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2 pl-0">
                          Key ID
                        </TableHead>
                        <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2">
                          Type
                        </TableHead>
                        <TableHead className="text-right font-mono uppercase text-xs text-foreground-muted h-auto py-2">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {previouslyUsedKeys.map((key) => (
                          <MotionTableRow
                            key={key.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{
                              opacity: 1,
                              height: 'auto',
                              transition: { duration: 0.2 },
                            }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-b border-dashed border-border"
                          >
                            <TableCell className="w-[150px] pr-0 py-2">
                              <div className="flex -space-x-px items-center">
                                <Badge
                                  className={cn(
                                    statusColors[key.status],
                                    'rounded-r-none',
                                    'gap-2 w-full h-6',
                                    'uppercase font-mono',
                                    'border-r-0'
                                  )}
                                >
                                  <Key size={13} />
                                  {statusLabels[key.status]}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono truncate max-w-[100px] pl-0 py-2">
                              <div className="">
                                <Badge
                                  className={cn(
                                    'bg-opacity-100 bg-200 border-foreground-muted',
                                    'rounded-l-none',
                                    'gap-2 py-2 h-6'
                                  )}
                                >
                                  <span className="truncate">{key.id}</span>
                                  <button
                                    onClick={() => {
                                      setSelectedKey(key)
                                      setShownDialog('key-details')
                                    }}
                                  >
                                    <Eye size={13} strokeWidth={1.5} />
                                  </button>
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="truncate max-w-[100px] py-2">
                              <AlgorithmHoverCard
                                algorithm={key.algorithm}
                                legacy={key.id === legacyKey?.id}
                              />
                            </TableCell>
                            <TableCell className="text-right py-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button type="text" className="px-2" icon={<MoreVertical />} />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      setSelectedKey(key)
                                      setShownDialog('key-details')
                                    }}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View key details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={!!standbyKey}
                                    onSelect={() => handleStandbyKey(key.id)}
                                  >
                                    <CircleArrowUp className="mr-2 h-4 w-4" />
                                    Set as standby key
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      setSelectedKey(key)
                                      setShownDialog('revoke')
                                    }}
                                    className="text-destructive"
                                  >
                                    <ShieldOff className="mr-2 h-4 w-4" />
                                    Revoke key
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </MotionTableRow>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center text-sm text-foreground-light p-6">
                    No previously used keys
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {revokedKeys.length > 0 && (
        <div className="mt-2">
          <h2 className="text-xl mb-4">Revoked keys</h2>
          <p className="text-sm text-secondary mb-4">
            These keys are no longer used to verify or sign JWTs.
          </p>
          <Card className="w-full overflow-hidden bg-surface-100 border rounded-md">
            <CardContent className="p-0">
              <Table className="p-5">
                <TableHeader className="bg-200">
                  <TableRow>
                    <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2 pr-0 w-20">
                      Status
                    </TableHead>
                    <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2 pl-0">
                      Key ID
                    </TableHead>
                    <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2">
                      Type
                    </TableHead>
                    <TableHead className="text-right font-mono uppercase text-xs text-foreground-muted h-auto py-2">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {revokedKeys.map((key) => (
                      <MotionTableRow
                        key={key.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{
                          opacity: 1,
                          height: 'auto',
                          transition: { duration: 0.2 },
                        }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-b border-dashed border-border"
                      >
                        <TableCell className="w-[150px] pr-0 py-2">
                          <div className="flex -space-x-px items-center">
                            <Badge
                              className={cn(
                                statusColors[key.status],
                                'rounded-r-none',
                                'gap-2 w-full h-6',
                                'uppercase font-mono',
                                'border-r-0'
                              )}
                            >
                              <Key size={13} />
                              {statusLabels[key.status]}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono truncate max-w-[100px] pl-0 py-2">
                          <div className="">
                            <Badge
                              className={cn(
                                'bg-opacity-100 bg-200 border-foreground-muted',
                                'rounded-l-none',
                                'gap-2 py-2 h-6'
                              )}
                            >
                              <span className="truncate">{key.id}</span>
                              <button
                                onClick={() => {
                                  setSelectedKey(key)
                                  setShownDialog('key-details')
                                }}
                              >
                                <Eye size={13} strokeWidth={1.5} />
                              </button>
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="truncate max-w-[100px] py-2">
                          <AlgorithmHoverCard
                            algorithm={key.algorithm}
                            legacy={key.id === legacyKey?.id}
                          />
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="text" className="px-2" icon={<MoreVertical />} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => {
                                  setSelectedKey(key)
                                  setShownDialog('key-details')
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View key details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={!!standbyKey}
                                onSelect={() => handleStandbyKey(key.id)}
                              >
                                <CircleArrowUp className="mr-2 h-4 w-4" />
                                Set as standby key
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={key.id === legacyKey?.id}
                                onSelect={() => {
                                  setSelectedKey(key)
                                  setShownDialog('delete')
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Permanently delete key
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </MotionTableRow>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TODO(hf): For launch <div>
        <h2 className="text-xl mb-4">Resources</h2>

        <div className="flex flex-col lg:flex-row gap-6">
          <Card className="bg-surface-75 overflow-hidden">
            <div className="flex">
              <div className="bg-surface-200 px-0 flex items-center justify-center w-[180px]">
                <WhyRotateKeysIllustration />
              </div>
              <div className="flex-1 pl-8 border-l h-full py-6 px-5">
                <h4 className="text-sm">Why Rotate keys?</h4>
                <p className="text-xs text-foreground-light mb-4 max-w-xs">
                  Create Standby keys ahead of time which can then be promoted to 'In use' at any
                  time.
                </p>
                <Button type="outline" icon={<Book />}>
                  View guide
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-surface-75 overflow-hidden">
            <div className="flex">
              <div className="bg-surface-200 px-0 flex items-center justify-center w-[180px]">
                <WhyUseStandbyKeysIllustration />
              </div>
              <div className="flex-1 pl-8 border-l h-full py-6 px-5">
                <h4 className="text-sm">Why use a Standby key?</h4>
                <p className="text-xs text-foreground-light mb-4 max-w-xs">
                  Create Standby keys ahead of time which can then be promoted to 'In use' at any
                  time.
                </p>
                <Button type="outline" icon={<Book />}>
                  View guide
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div> */}

      <Dialog open={shownDialog === 'legacy'} onOpenChange={resetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Start using new JWT signing keys</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection>
            <p>
              Your project today uses a legacy symmetric JWT secret to create JWTs. To be able to
              use an asymmetric JWT signing key you first have to migrate it to the new system. This
              change does not cause any downtime on your project.
            </p>
          </DialogSection>
          <DialogFooter>
            <Button
              onClick={() => handleLegacyMigration()}
              disabled={isLoadingMutation}
              loading={isLoadingMutation}
            >
              Migrate JWT secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shownDialog === 'create'} onOpenChange={resetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a new Standby Key</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection className="space-y-4">
            <div>
              <Label_Shadcn_ htmlFor="algorithm">Choose the key type to use:</Label_Shadcn_>
              <Select_Shadcn_
                value={newKeyAlgorithm}
                onValueChange={(value: JWTAlgorithm) => setNewKeyAlgorithm(value)}
              >
                <SelectTrigger_Shadcn_ id="algorithm">
                  <SelectValue_Shadcn_ placeholder="Select algorithm" />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  <SelectItem_Shadcn_ value="HS256">HS256 (Symmetric)</SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="RS256">RS256 (RSA)</SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="ES256" disabled>
                    ES256 (ECC)
                  </SelectItem_Shadcn_>
                  <SelectItem_Shadcn_ value="EdDSA" disabled>
                    EdDSA (Ed25519)
                  </SelectItem_Shadcn_>
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
              <p className="text-sm text-muted-foreground mt-1">
                {algorithmDescriptions[newKeyAlgorithm]}
              </p>
            </div>
          </DialogSection>
          <DialogFooter>
            <Button
              onClick={() => handleAddNewStandbyKey()}
              disabled={isLoadingMutation}
              loading={isLoadingMutation}
            >
              Create standby key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shownDialog === 'rotate'} onOpenChange={resetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rotate Key</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection>
            <DialogDescription>
              {standbyKey ? (
                <>
                  The standby key ({algorithmLabels[standbyKey.algorithm]}) will be promoted to 'In
                  use'. This will:
                  <ul className="list-disc pl-4 mt-2 space-y-2">
                    <li>Change the current standby key to 'In use'</li>
                    <li>Move the current 'In use' key to 'Previously used'</li>
                    <li>Move any 'Previously used' key to 'Revoked'</li>
                  </ul>
                </>
              ) : (
                <>
                  Since there is no standby key, you need to choose an algorithm for the new key:
                  <div className="mt-4 space-y-4">
                    <Select_Shadcn_
                      value={newKeyAlgorithm}
                      onValueChange={(value: JWTAlgorithm) => setNewKeyAlgorithm(value)}
                    >
                      <SelectTrigger_Shadcn_ id="rotateAlgorithm">
                        <SelectValue_Shadcn_ placeholder="Select algorithm" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectItem_Shadcn_ value="HS256">HS256 (Symmetric)</SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="ES256">ES256 (ECC)</SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="RS256">RS256 (RSA)</SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="EdDSA">EdDSA (Ed25519)</SelectItem_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                    <p className="text-sm text-foreground-light">
                      {algorithmDescriptions[newKeyAlgorithm]}
                    </p>
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogSection>
          <DialogFooter>
            <Button onClick={() => setShownDialog('confirm-rotate')}>Review Rotation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shownDialog === 'confirm-rotate'} onOpenChange={resetDialog}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Confirm key rotation</DialogTitle>
            <DialogDescription>
              Review the key rotation process below. Ensure your application's components have
              already picked up and are trusting your standby key to avoid downtime.
            </DialogDescription>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection className="relative bg">
            <div className="relative flex flex-col items-center space-y-6 py-6">
              {standbyKey ? (
                <div className="flex items-center">
                  <Badge className={cn(statusColors['standby'], 'px-3 py-1 space-x-1')}>
                    <Timer size={13} className="mr-1.5" />
                    STANDBY KEY
                    <span className="text-xs font-mono text-foreground-light">
                      {algorithmLabels[standbyKey.algorithm]}
                    </span>
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-foreground-light" />
                  <Badge className={cn(statusColors['in_use'], 'px-3 py-1')}>
                    <Key size={13} className="mr-1.5" />
                    CURRENTLY USED
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Badge
                    className={cn(
                      'bg-surface-300 bg-opacity-100 text-foreground border border-foreground-muted px-3 py-1 space-x-1'
                    )}
                  >
                    <Key size={13} className="mr-1.5" />
                    <span>New Key</span>
                    <span className="text-xs font-mono text-foreground-light">
                      {algorithmLabels[newKeyAlgorithm]}
                    </span>
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-foreground-light" />
                  <Badge className={cn(statusColors['in_use'], 'px-3 py-1')}>
                    <Key size={13} className="mr-1.5" />
                    CURRENTLY USED
                  </Badge>
                </div>
              )}
              <div className="flex items-center">
                <Badge className={cn(statusColors['in_use'], 'px-3 py-1')}>
                  <Key size={13} className="mr-1.5" />
                  CURRENTLY USED
                  <span className="text-xs font-mono text-foreground-light">
                    {inUseKey?.algorithm && algorithmLabels[inUseKey.algorithm]}
                  </span>
                </Badge>
                <ArrowRight className="h-4 w-4 text-foreground-light" />
                <Badge className={cn(statusColors['previously_used'], 'px-3 py-1 space-x-1')}>
                  <Timer size={13} className="mr-1.5" />
                  <span>PREVIOUS KEY</span>
                </Badge>
              </div>
            </div>
          </DialogSection>
          <DialogFooter>
            <Button type="outline" onClick={resetDialog}>
              Cancel
            </Button>
            <Button onClick={() => handleRotateKey()} loading={isLoadingMutation}>
              Confirm rotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shownDialog === 'key-details'} onOpenChange={resetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Key Details</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection className="flex flex-col gap-6">
            {selectedKey && (
              <>
                <div className="bg-surface-100/50 border rounded-md">
                  <div className="flex items-center gap-2 px-3 py-2 border-b">
                    <FileKey strokeWidth={1.5} size={15} className="text-foreground-light" />
                    <h4 className="text-xs font-mono">Public Key (PEM format)</h4>
                  </div>
                  <pre className="bg-surface-100 p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-40">
                    {typeof selectedKey.public_jwk === 'string'
                      ? selectedKey.public_jwk
                      : JSON.stringify(selectedKey.public_jwk ?? '', null, 2)}
                  </pre>
                </div>
                <div>
                  <h4 className="text-sm mb-2">JWKS URL</h4>
                  <pre className="bg-surface-100 border p-3 rounded-md text-xs overflow-x-auto break-all">
                    {`${window.location.origin}/jwt/v1/jwks.json`}
                  </pre>
                </div>
              </>
            )}
          </DialogSection>
        </DialogContent>
      </Dialog>

      {selectedKey && selectedKey.status === 'previously_used' && (
        <TextConfirmModal
          visible={shownDialog === 'revoke'}
          loading={isLoadingMutation}
          onConfirm={() => handleRevokeKey(selectedKey.id)}
          onCancel={resetDialog}
          title={`Revoke ${selectedKey.id}`}
          confirmString={selectedKey.id}
          confirmLabel="Yes, revoke this signing key"
          confirmPlaceholder="Type the ID of the key to confirm"
          variant="destructive"
          alert={{
            title: 'This key will no longer be trusted!',
            description:
              'By revoking a signing key, all applications trusting it will no longer do so. If there are JWTs (access tokens) that are valid at the time of revocation, they will no longer be trusted, causing users with such JWTs to be signed out.',
          }}
        />
      )}

      {selectedKey && selectedKey.status === 'revoked' && (
        <TextConfirmModal
          visible={shownDialog === 'delete'}
          loading={isLoadingMutation}
          onConfirm={() => handleDeleteKey(selectedKey.id)}
          onCancel={resetDialog}
          title={`Permanently delete ${selectedKey.id}`}
          confirmString={selectedKey.id}
          confirmLabel="Yes, permanently delete this key"
          confirmPlaceholder="Type the ID of the key to confirm"
          variant="destructive"
          alert={{
            title: 'This key will be permanently deleted.',
            description:
              'The private key and all information about this key will be permanently deleted from our records. This action cannot be undone.',
          }}
        />
      )}
    </>
  )
}
