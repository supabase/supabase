'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
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
  Trash2,
} from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { useJwtSecrets } from 'state/jwt-secrets'
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

type KeyStatus = 'IN_USE' | 'STANDBY' | 'PREVIOUSLY_USED' | 'REVOKED'
type JWTAlgorithm = 'HS256' | 'RS256' | 'ES256'

export interface SecretKey {
  id: string
  status: KeyStatus
  keyId: string
  createdAt: string
  expiresAt: string | null
  algorithm: JWTAlgorithm
  publicKey: string
  jwksUrl: string
  customSigningKey?: string
}

const statusLabels: Record<KeyStatus, string> = {
  IN_USE: 'Current key',
  STANDBY: 'Standby key',
  PREVIOUSLY_USED: 'Previous key',
  REVOKED: 'Revoked',
}

const statusColors: Record<KeyStatus, string> = {
  STANDBY: 'bg-surface-300 bg-opacity-100 text-foreground border border-foreground-muted',
  IN_USE: 'bg-brand-200 bg-opacity-100 text-brand-600 border-brand-500',
  PREVIOUSLY_USED: 'bg-purple-300 dark:bg-purple-100 text-purple-1200 border-purple-800',
  REVOKED: 'bg-red-500 text-red-200',
}

const algorithmLabels: Record<JWTAlgorithm, string> = {
  HS256: 'HS256 (Symmetric)',
  RS256: 'RS256 (RSA)',
  ES256: 'ES256 (ECC)',
}

const algorithmDescriptions: Record<JWTAlgorithm, string> = {
  HS256: 'HMAC with SHA-256: Fast, simple, requires secure key exchange',
  RS256: 'RSA with SHA-256: Allows public key distribution, slower',
  ES256: 'ECDSA with SHA-256: Compact keys, fast, modern alternative to RSA',
}

export const INITIAL_SECRET_KEYS: SecretKey[] = [
  {
    id: '1',
    status: 'IN_USE',
    keyId: '64532ac2',
    createdAt: '2024-07-13 09:00',
    expiresAt: null,
    algorithm: 'ES256',
    publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0vx7agoebGcQSuuPiLJX
ZptN9nnJAMh+auCW4vJ1uF/OjQaB66Jx9kMSLEjAYGXKKLhSbGkIamFiJB5HqQ==
-----END PUBLIC KEY-----`,
    jwksUrl: 'https://example.com/jwks.json',
  },
  {
    id: '2',
    status: 'STANDBY',
    keyId: '4d3e7909',
    createdAt: '2024-07-14 10:30',
    expiresAt: null,
    algorithm: 'RS256',
    publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0vx7agoebGcQSuuPiLJX
ZptN9nnJAMh+auCW4vJ1uF/OjQaB66Jx9kMSLEjAYGXKKLhSbGkIamFiJB5HqQ==
-----END PUBLIC KEY-----`,
    jwksUrl: 'https://example.com/standby-jwks.json',
  },
  {
    id: '3',
    status: 'PREVIOUSLY_USED',
    keyId: '9a8b7c6d',
    createdAt: '2024-07-12 08:45',
    expiresAt: '2024-08-12 08:45',
    algorithm: 'HS256',
    publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0vx7agoebGcQSuuPiLJX
ZptN9nnJAMh+auCW4vJ1uF/OjQaB66Jx9kMSLEjAYGXKKLhSbGkIamFiJB5HqQ==
-----END PUBLIC KEY-----`,
    jwksUrl: 'https://example.com/previous-jwks.json',
  },
  {
    id: '4',
    status: 'REVOKED',
    keyId: '5e6f7g8h',
    createdAt: '2024-07-10 14:20',
    expiresAt: '2024-08-10 14:20',
    algorithm: 'ES256',
    publicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0vx7agoebGcQSuuPiLJX
ZptN9nnJAMh+auCW4vJ1uF/OjQaB66Jx9kMSLEjAYGXKKLhSbGkIamFiJB5HqQ==
-----END PUBLIC KEY-----`,
    jwksUrl: 'https://example.com/revoked-jwks.json',
  },
]

export const secretKeysAtom = atomWithStorage<SecretKey[]>('secretKeys', INITIAL_SECRET_KEYS)

export default function JWTSecretKeysTable() {
  const {
    secretKeys,
    actionInProgress,
    addNewStandbyKey,
    rotateKey,
    deleteStandbyKey,
    editStandbyKey,
    revokeKey,
  } = useJwtSecrets()

  const [selectedKey, setSelectedKey] = useState<SecretKey | null>(null)
  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false)
  const [showRotateKeyDialog, setShowRotateKeyDialog] = useState(false)
  const [showConfirmRotateDialog, setShowConfirmRotateDialog] = useState(false)
  const [showEditStandbyKeyDialog, setShowEditStandbyKeyDialog] = useState(false)
  const [showKeyDetailsDialog, setShowKeyDetailsDialog] = useState(false)
  const [newKeyAlgorithm, setNewKeyAlgorithm] = useState<JWTAlgorithm>('RS256')
  const [newKeyDescription, setNewKeyDescription] = useState('')
  const [customSigningKey, setCustomSigningKey] = useState('')
  const [formError, setFormError] = useState('')

  const sortedKeys = useMemo(() => {
    return [...secretKeys].sort((a, b) => {
      const order = { STANDBY: 0, IN_USE: 1, PREVIOUSLY_USED: 2, REVOKED: 3 }
      return (
        order[a.status] - order[b.status] ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    })
  }, [secretKeys])

  const standbyKey = useMemo(() => sortedKeys.find((key) => key.status === 'STANDBY'), [sortedKeys])
  const inUseKey = useMemo(() => sortedKeys.find((key) => key.status === 'IN_USE'), [sortedKeys])
  const previouslyUsedKey = useMemo(
    () => sortedKeys.find((key) => key.status === 'PREVIOUSLY_USED'),
    [sortedKeys]
  )
  const revokedKeys = useMemo(
    () => sortedKeys.filter((key) => key.status === 'REVOKED'),
    [sortedKeys]
  )

  const resetNewKeyForm = () => {
    setNewKeyAlgorithm('ES256')
    setNewKeyDescription('')
    setCustomSigningKey('')
    setFormError('')
  }

  const handleAddNewStandbyKey = async () => {
    setFormError('')
    await addNewStandbyKey(newKeyAlgorithm, customSigningKey)
    setShowCreateKeyDialog(false)
    resetNewKeyForm()
  }

  const handleRotateKey = async () => {
    await rotateKey(newKeyAlgorithm)
    setShowRotateKeyDialog(false)
    setShowConfirmRotateDialog(false)
  }

  const handleEditStandbyKey = async () => {
    await editStandbyKey(newKeyAlgorithm, customSigningKey)
    setShowEditStandbyKeyDialog(false)
  }

  const MotionTableRow = motion(TableRow)

  const renderKeyRow = (key: SecretKey) => (
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
      className={cn(key.status !== 'IN_USE' ? 'border-b border-dashed border-border' : 'border-b')}
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
            {key.status === 'STANDBY' ? <Timer size={13} /> : <Key size={13} />}
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
            <span className="truncate">{key.keyId}</span>
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
        {key.createdAt}
      </TableCell>
      {/* <TableCell className="truncate max-w-[150px]">{key.expiresAt || 'N/A'}</TableCell> */}
      <TableCell className="truncate max-w-[100px] py-2">
        {/* {algorithmLabels[key.algorithm]} */}
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
            {key.status === 'STANDBY' && (
              <>
                <DropdownMenuItem onSelect={() => setShowEditStandbyKeyDialog(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit standby key
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={deleteStandbyKey} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete standby key
                </DropdownMenuItem>
              </>
            )}
            {key.status === 'PREVIOUSLY_USED' && (
              <DropdownMenuItem onSelect={() => revokeKey(key.id)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Revoke key
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
          <div className={`${statusColors['STANDBY']} p-2 rounded`}>Standby</div>
          <ArrowRight className="h-6 w-6" />
          <div className={`${statusColors['IN_USE']} p-2 rounded`}>In Use</div>
        </div>
      )}
      <div className="flex items-center space-x-4">
        <div className={`${statusColors['IN_USE']} p-2 rounded`}>In Use</div>
        <ArrowRight className="h-6 w-6" />
        <div className={`${statusColors['PREVIOUSLY_USED']} p-2 rounded`}>Previously Used</div>
      </div>
      {!standbyKey && (
        <div className="flex items-center space-x-4">
          <div className="bg-green-100 text-green-800 p-2 rounded">New Key</div>
          <ArrowRight className="h-6 w-6" />
          <div className={`${statusColors['IN_USE']} p-2 rounded`}>In Use</div>
        </div>
      )}
      {previouslyUsedKey && (
        <div className="flex items-center space-x-4">
          <div className={`${statusColors['PREVIOUSLY_USED']} p-2 rounded`}>Previously Used</div>
          <ArrowRight className="h-6 w-6" />
          <div className={`${statusColors['REVOKED']} p-2 rounded`}>Revoked</div>
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
          <CardHeader className="lg:flex-row lg:items-center gap-3 lg:gap-10 py-4">
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
      <div className="flex flex-col -space-y-px">
        <ActionPanel
          title="Rotate Signing Key"
          description={
            standbyKey
              ? "This will promote the standby key to 'In use' and change the current 'In use' key to 'Previously used'."
              : "This will create a new 'In use' key and change the current 'In use' key to 'Previously used'."
          }
          buttonLabel="Rotate keys"
          onClick={() => setShowRotateKeyDialog(true)}
          loading={actionInProgress === 'rotate'}
          icon={<RotateCw />}
          type="warning"
        />

        {!standbyKey && (
          <ActionPanel
            title="Create Standby Key"
            description="Create a standby key for the next rotation which will be used on next key rotation."
            buttonLabel="Create Standby Key"
            onClick={() => setShowCreateKeyDialog(true)}
            loading={actionInProgress === 'new'}
            type="default"
            icon={<Timer />}
          />
        )}
      </div>
      <div>
        <h2 className="text-xl mb-4">Active keys</h2>
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
                    Created At
                  </TableHead>
                  {/* <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2">
                    Expires At
                  </TableHead> */}
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
                  {previouslyUsedKey && renderKeyRow(previouslyUsedKey)}
                </AnimatePresence>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* <div>
        <h2 className="text-xl mb-4">Revoked Keys</h2>
        <Card className="w-full py-6">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left font-medium text-gray-500">Status</TableHead>
                  <TableHead className="text-left font-medium text-gray-500">Key ID</TableHead>
                  <TableHead className="text-left font-medium text-gray-500">Created At</TableHead>
                  <TableHead className="text-left font-medium text-gray-500">Expires At</TableHead>
                  <TableHead className="text-left font-medium text-gray-500">Type</TableHead>
                  <TableHead className="text-right font-medium text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revokedKeys.length > 0 ? (
                  <AnimatePresence>{revokedKeys.map(renderKeyRow)}</AnimatePresence>
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>No revoked keys</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div> */}

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
            <Button onClick={() => handleAddNewStandbyKey()} disabled={actionInProgress === 'new'}>
              {actionInProgress === 'new' ? (
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
            <DialogDescription>
              {standbyKey
                ? "The standby key will be promoted to 'In use'."
                : 'Choose the algorithm for the new key:'}
            </DialogDescription>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection>
            {!standbyKey && (
              <div className="space-y-4">
                <Select
                  value={newKeyAlgorithm}
                  onValueChange={(value: JWTAlgorithm) => setNewKeyAlgorithm(value)}
                >
                  <SelectTrigger id="rotateAlgorithm">
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RS256">RS256 (RSA)</SelectItem>
                    <SelectItem value="ES256">ES256 (ECC)</SelectItem>
                    <SelectItem value="HS256">HS256 (Symmetric)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
            <Button onClick={() => handleEditStandbyKey()} disabled={actionInProgress === 'edit'}>
              {actionInProgress === 'edit' ? (
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Key Rotation</DialogTitle>
            <DialogDescription>Please review the key rotation process below:</DialogDescription>
          </DialogHeader>
          {renderKeyFlowVisual()}
          <DialogFooter>
            <Button type="outline" onClick={() => setShowConfirmRotateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleRotateKey()}>Confirm Rotation</Button>
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
                    {selectedKey.publicKey}
                  </pre>
                </div>
                <div>
                  <h4 className="text-sm mb-2">JWKS URL</h4>
                  <pre className="bg-surface-100 border p-3 rounded-md text-xs overflow-x-auto break-all">
                    {selectedKey.jwksUrl}
                  </pre>
                </div>
              </>
            )}
          </DialogSection>
          {selectedKey?.customSigningKey && (
            <DialogSection>
              <h4 className="text-sm mb-2">Custom Signing Key</h4>
              <pre className="bg-surface-100 border p-3 rounded-md text-xs overflow-x-auto break-all">
                {selectedKey?.customSigningKey}
              </pre>
            </DialogSection>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex items-center space-x-2">
        {/* 
        // @ts-expect-error */}
        <ShowPublicJWTsDialogComposer inUseKey={inUseKey} />
      </div>
    </>
  )
}
