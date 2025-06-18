'use client'

import { useParams } from 'common'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Book,
  Edit,
  Eye,
  FileKey,
  Key,
  Loader2,
  MoreVertical,
  RotateCw,
  Timer,
  Trash,
  Trash2,
} from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { Badge, Button, cn } from 'ui'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'ui/src/components/shadcn/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui/src/components/shadcn/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui/src/components/shadcn/ui/dropdown-menu'
import { Input } from 'ui/src/components/shadcn/ui/input'
import { Label } from 'ui/src/components/shadcn/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui/src/components/shadcn/ui/select'
import { Separator } from 'ui/src/components/shadcn/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui/src/components/shadcn/ui/table'
import { Textarea } from 'ui/src/components/shadcn/ui/textarea'
import { AlgorithmHoverCard } from './AlgorithmHoverCard'
import { WhyRotateKeysIllustration, WhyUseStandbyKeysIllustration } from './illustrations'
import ShowPublicJWTsDialogComposer from './ShowPublicJWTsDialogComposer'
import DotGrid from 'components/ui/DotGrid'
import type { components } from 'api-types'
import {
  JWTAlgorithm,
  SigningKey,
  useJwtSecrets,
  useSigningKeysQuery,
  useSigningKeyCreateMutation,
  useSigningKeyDeleteMutation,
} from 'state/jwt-secrets'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Admonition } from 'ui-patterns'
import { useJWTSigningKeysQuery } from 'data/jwt-signing-keys/jwt-signing-keys-query'
import { useLegacyJWTSigningKeyQuery } from 'data/jwt-signing-keys/legacy-jwt-signing-key-query'

import { algorithmLabels, algorithmDescriptions } from './algorithmDetails'
import { statusLabels, statusColors } from './constants'

dayjs.extend(relativeTime)

export default function JWTSecretKeysTable() {
  const { ref: projectRef } = useParams()
  const createMutation = useSigningKeyCreateMutation()
  const deleteMutation = useSigningKeyDeleteMutation()
  //const { data: signingKeys, isLoading } = useSigningKeysQuery({ projectRef })
  const { rotateKey } = useJwtSecrets()

  const [selectedKey, setSelectedKey] = useState<SigningKey | null>(null)
  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false)
  const [showRotateKeyDialog, setShowRotateKeyDialog] = useState(false)
  const [showConfirmRotateDialog, setShowConfirmRotateDialog] = useState(false)
  const [showEditStandbyKeyDialog, setShowEditStandbyKeyDialog] = useState(false)
  const [showKeyDetailsDialog, setShowKeyDetailsDialog] = useState(false)
  const [newKeyAlgorithm, setNewKeyAlgorithm] = useState<JWTAlgorithm>('RS256')
  const [newKeyDescription, setNewKeyDescription] = useState('')
  const [customSigningKey, setCustomSigningKey] = useState('')
  const [formError, setFormError] = useState('')
  const [isRotating, setIsRotating] = useState(false)
  const [showRevokeKeyDialog, setShowRevokeKeyDialog] = useState(false)

  const { data: signingKeys, isLoading: isLoadingSigningKeys } = useJWTSigningKeysQuery({
    projectRef,
  })
  const { data: legacyKey, isLoading: isLoadingLegacyKey } = useLegacyJWTSigningKeyQuery({
    projectRef,
  })

  const isLoading = isLoadingSigningKeys || isLoadingLegacyKey

  const sortedKeys = useMemo(() => {
    if (!signingKeys || !Array.isArray(signingKeys.keys)) return []

    return signingKeys.keys.sort((a: SigningKey, b: SigningKey) => {
      const order: Record<SigningKey['status'], number> = {
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
    setNewKeyAlgorithm('ES256')
    setNewKeyDescription('')
    setCustomSigningKey('')
    setFormError('')
  }

  const handleAddNewStandbyKey = async () => {
    if (!projectRef) {
      setFormError('Project reference is required')
      return
    }
    setFormError('')
    try {
      await createMutation.mutateAsync({
        projectRef,
        algorithm: newKeyAlgorithm,
        status: 'standby',
      })
      setShowCreateKeyDialog(false)
      resetNewKeyForm()
    } catch (error) {
      setFormError('Failed to create key')
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!projectRef) {
      console.error('Project reference is required')
      return
    }
    try {
      await deleteMutation.mutateAsync({ projectRef, keyId })
    } catch (error) {
      console.error('Failed to delete key', error)
    }
  }

  const handleRotateKey = async () => {
    if (!projectRef) {
      setFormError('Project reference is required')
      return
    }
    setIsRotating(true)
    try {
      await rotateKey(newKeyAlgorithm)
      setShowRotateKeyDialog(false)
      setShowConfirmRotateDialog(false)
    } catch (error) {
      setFormError('Failed to rotate key')
    } finally {
      setIsRotating(false)
    }
  }

  const handleEditStandbyKey = async () => {
    if (!projectRef || !selectedKey) {
      setFormError('Project reference and key are required')
      return
    }
    try {
      await createMutation.mutateAsync({
        projectRef,
        algorithm: newKeyAlgorithm,
        status: 'standby',
      })
      setShowEditStandbyKeyDialog(false)
      resetNewKeyForm()
    } catch (error) {
      setFormError('Failed to update key')
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
                setShowKeyDetailsDialog(true)
              }}
            >
              <Eye size={13} strokeWidth={1.5} />
            </button>
          </Badge>
        </div>
      </TableCell>
      <TableCell className="truncate max-w-[150px] font-mono text-xs py-2">
        {dayjs(key.updated_at).format('YYYY-MM-DD HH:mm:ss')}
      </TableCell>
      <TableCell className="truncate max-w-[100px] py-2">
        <AlgorithmHoverCard algorithm={key.algorithm} />
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
                setShowKeyDetailsDialog(true)
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View key details
            </DropdownMenuItem>
            {key.status === 'standby' && (
              <>
                <DropdownMenuItem onSelect={() => setShowEditStandbyKeyDialog(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit standby key
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => handleDeleteKey(key.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete standby key
                </DropdownMenuItem>
              </>
            )}
            {key.status === 'previously_used' && (
              <DropdownMenuItem
                onSelect={() => {
                  setSelectedKey(key)
                  setShowRevokeKeyDialog(true)
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Revoke key
                <span className="text-xs text-foreground-light ml-2">(after 30 days)</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </MotionTableRow>
  )

  const renderKeyFlowVisual = () => (
    <div className="flex flex-col items-center space-y-4 py-4">
      {standbyKey && (
        <div className="flex items-center space-x-4">
          <div className={`${statusColors['standby']} p-2 rounded`}>Standby</div>
          <ArrowRight className="h-6 w-6" />
          <div className={`${statusColors['in_use']} p-2 rounded`}>In Use</div>
        </div>
      )}
      <div className="flex items-center space-x-4">
        <div className={`${statusColors['in_use']} p-2 rounded`}>In Use</div>
        <ArrowRight className="h-6 w-6" />
        <div className={`${statusColors['previously_used']} p-2 rounded`}>Previously Used</div>
      </div>
      {!standbyKey && (
        <div className="flex items-center space-x-4">
          <div className="bg-green-100 text-green-800 p-2 rounded">New Key</div>
          <ArrowRight className="h-6 w-6" />
          <div className={`${statusColors['in_use']} p-2 rounded`}>In Use</div>
        </div>
      )}
      {previouslyUsedKeys.length > 0 && (
        <div className="flex items-center space-x-4">
          <div className="text-sm text-foreground-light flex items-center">
            <Timer size={13} className="mr-1.5" />
            {previouslyUsedKeys.length} Previously Used{' '}
            {previouslyUsedKeys.length === 1 ? 'Key' : 'Keys'}
          </div>
        </div>
      )}
      {revokedKeys.length > 0 && (
        <div className="flex items-center space-x-4">
          <Badge className={cn(statusColors['revoked'], 'px-3 py-1')}>
            <Key size={13} className="mr-1.5" />
            Revoked Keys ({revokedKeys.length})
          </Badge>
        </div>
      )}
    </div>
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
        <ActionPanel
          title="Rotate Signing Key"
          description={
            standbyKey
              ? "This will promote the standby key to 'In use' and change the current 'In use' key to 'Previously used'."
              : "This will create a new 'In use' key and change the current 'In use' key to 'Previously used'."
          }
          buttonLabel="Rotate keys"
          onClick={() => setShowRotateKeyDialog(true)}
          loading={isLoading}
          icon={<RotateCw />}
          type="warning"
        />

        {!standbyKey && (
          <ActionPanel
            title="Create Standby Key"
            description="Create a standby key for the next rotation which will be used on next key rotation."
            buttonLabel="Create Standby Key"
            onClick={() => setShowCreateKeyDialog(true)}
            loading={isLoading}
            type="default"
            icon={<Timer />}
          />
        )}
      </div>
      <div>
        <h2 className="text-xl mb-4">Active Key</h2>
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
                    Updated At
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
        <h2 className="text-xl mb-4">Previously Used Keys</h2>
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
                      Time Until Revokable
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
                                  setShowKeyDetailsDialog(true)
                                }}
                              >
                                <Eye size={13} strokeWidth={1.5} />
                              </button>
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="truncate max-w-[150px] font-mono text-xs py-2">
                          {(() => {
                            const now = dayjs()
                            const updatedAt = dayjs(key.updated_at)
                            const daysElapsed = now.diff(updatedAt, 'days')
                            const daysRemaining = Math.max(0, 30 - daysElapsed)
                            return `${daysRemaining} days`
                          })()}
                        </TableCell>
                        <TableCell className="truncate max-w-[100px] py-2">
                          <AlgorithmHoverCard algorithm={key.algorithm} />
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
                                  setShowKeyDetailsDialog(true)
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View key details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => setShowRevokeKeyDialog(true)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
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

      <Separator />

      <div>
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
      </div>

      <Dialog open={showCreateKeyDialog} onOpenChange={setShowCreateKeyDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a new Standby Key</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection className="space-y-4">
            <div>
              <Label htmlFor="algorithm">Choose the key type to use:</Label>
              <Select
                value={newKeyAlgorithm}
                onValueChange={(value: JWTAlgorithm) => setNewKeyAlgorithm(value)}
              >
                <SelectTrigger id="algorithm">
                  <SelectValue placeholder="Select algorithm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HS256">HS256 (Symmetric)</SelectItem>
                  <SelectItem value="RS256">RS256 (RSA)</SelectItem>
                  <SelectItem value="ES256">ES256 (ECC)</SelectItem>
                  <SelectItem value="EdDSA">EdDSA (Ed25519)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {algorithmDescriptions[newKeyAlgorithm]}
              </p>
            </div>
            <div>
              <Label htmlFor="description">Description:</Label>
              <Input
                id="description"
                value={newKeyDescription}
                onChange={(e) => setNewKeyDescription(e.target.value)}
                placeholder="Enter key description"
              />
            </div>
            <div>
              <Label htmlFor="customSigningKey">Custom Signing Key (Optional):</Label>
              <Textarea
                id="customSigningKey"
                value={customSigningKey}
                onChange={(e) => setCustomSigningKey(e.target.value)}
                placeholder="Enter custom signing key (optional)"
                rows={4}
              />
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
          </DialogSection>
          <DialogFooter>
            <Button onClick={() => handleAddNewStandbyKey()} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Standby Key'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRotateKeyDialog} onOpenChange={setShowRotateKeyDialog}>
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
                    <Select
                      value={newKeyAlgorithm}
                      onValueChange={(value: JWTAlgorithm) => setNewKeyAlgorithm(value)}
                    >
                      <SelectTrigger id="rotateAlgorithm">
                        <SelectValue placeholder="Select algorithm" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HS256">HS256 (Symmetric)</SelectItem>
                        <SelectItem value="ES256">ES256 (ECC)</SelectItem>
                        <SelectItem value="RS256">RS256 (RSA)</SelectItem>
                        <SelectItem value="EdDSA">EdDSA (Ed25519)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-foreground-light">
                      {algorithmDescriptions[newKeyAlgorithm]}
                    </p>
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogSection>
          <DialogFooter>
            <Button onClick={() => setShowConfirmRotateDialog(true)}>Review Rotation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditStandbyKeyDialog} onOpenChange={setShowEditStandbyKeyDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Standby Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editAlgorithm">Choose the key type to use:</Label>
              <Select
                value={newKeyAlgorithm}
                onValueChange={(value: JWTAlgorithm) => setNewKeyAlgorithm(value)}
              >
                <SelectTrigger id="editAlgorithm">
                  <SelectValue placeholder="Select algorithm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HS256">HS256 (Symmetric)</SelectItem>
                  <SelectItem value="RS256">RS256 (RSA)</SelectItem>
                  <SelectItem value="ES256">ES256 (ECC)</SelectItem>
                  <SelectItem value="EdDSA">EdDSA (Ed25519)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-1">
                {algorithmDescriptions[newKeyAlgorithm]}
              </p>
            </div>
            <div>
              <Label htmlFor="editCustomSigningKey">Custom Signing Key (Optional):</Label>
              <Textarea
                id="editCustomSigningKey"
                value={customSigningKey}
                onChange={(e) => setCustomSigningKey(e.target.value)}
                placeholder="Enter custom signing key (optional)"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => handleEditStandbyKey()} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Standby Key'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmRotateDialog} onOpenChange={setShowConfirmRotateDialog}>
        <DialogContent className="sm:max-w-[425px] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Confirm Key Rotation</DialogTitle>
            <DialogDescription>
              Review the key rotation process below. This action will update your signing keys and
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection className="relative bg">
            <div className="absolute inset-0 opacity-[0.15]">
              <DotGrid rows={20} columns={20} count={100} />
            </div>
            <div className="relative flex flex-col items-center space-y-6 py-6">
              {standbyKey ? (
                <div className="flex items-center space-x-4">
                  <Badge className={cn(statusColors['standby'], 'px-3 py-1 space-x-1')}>
                    <Timer size={13} className="mr-1.5" />
                    Standby Key
                    <span className="text-xs font-mono text-foreground-light">
                      {algorithmLabels[standbyKey.algorithm]}
                    </span>
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-foreground-light" />
                  <Badge className={cn(statusColors['in_use'], 'px-3 py-1')}>
                    <Key size={13} className="mr-1.5" />
                    In Use
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
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
                    In Use
                  </Badge>
                </div>
              )}
              <div className="flex items-center space-x-4">
                <Badge className={cn(statusColors['in_use'], 'px-3 py-1')}>
                  <Key size={13} className="mr-1.5" />
                  In Use
                </Badge>
                <ArrowRight className="h-4 w-4 text-foreground-light" />
                <Badge className={cn(statusColors['previously_used'], 'px-3 py-1 space-x-1')}>
                  <Timer size={13} className="mr-1.5" />
                  <span>Previously Used</span>
                  <span className="text-xs font-mono text-foreground-light">
                    {inUseKey?.algorithm && algorithmLabels[inUseKey.algorithm]}
                  </span>
                </Badge>
              </div>
            </div>
          </DialogSection>
          <DialogFooter>
            <Button type="outline" onClick={() => setShowConfirmRotateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleRotateKey()} loading={isRotating}>
              Confirm Rotation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showKeyDetailsDialog} onOpenChange={setShowKeyDetailsDialog}>
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

      <div className="flex items-center space-x-2">
        <ShowPublicJWTsDialogComposer inUseKey={inUseKey} />
      </div>

      <Dialog open={showRevokeKeyDialog} onOpenChange={setShowRevokeKeyDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Revoke JWT Key</DialogTitle>
          </DialogHeader>

          {!selectedKey ? null : dayjs().diff(dayjs(selectedKey.updated_at), 'days') < 30 ? (
            <Admonition type="note" className="!border-l-0 !border-r-0 rounded-none mb-0">
              <h3 className="font-bold">This key cannot be revoked yet</h3>
              <p className="text-sm text-foreground-light">
                You must wait {30 - dayjs().diff(dayjs(selectedKey.updated_at), 'days')} days before
                this key can be revoked.
              </p>
            </Admonition>
          ) : (
            <Admonition type="warning" className="!border-l-0 !border-r-0 rounded-none">
              <h3 className="font-bold">Warning: This action is irreversible</h3>
              <p className="text-sm text-foreground-light">
                Revoking this key will invalidate any active sessions using this JWT secret. Users
                will need to log in again.
              </p>
            </Admonition>
          )}
          <DialogSection>
            <DialogDescription>
              <p>Are you sure you want to revoke this key?</p>
            </DialogDescription>
          </DialogSection>
          <DialogFooter>
            <Button type="default" onClick={() => setShowRevokeKeyDialog(false)}>
              Cancel
            </Button>
            {selectedKey && dayjs().diff(dayjs(selectedKey.updated_at), 'days') >= 30 && (
              <Button type="warning" onClick={() => handleDeleteKey(selectedKey.id)}>
                Revoke key
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
