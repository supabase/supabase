'use client'

import React, { useState, useMemo } from 'react'
import { atom, useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'ui/src/components/shadcn/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui/src/components/shadcn/ui/table'
import { Badge } from 'ui/src/components/shadcn/ui/badge'
import { Button } from 'ui/src/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui/src/components/shadcn/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogSectionSeparator,
  DialogSection,
} from 'ui/src/components/shadcn/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui/src/components/shadcn/ui/select'
import { Input } from 'ui/src/components/shadcn/ui/input'
import { Textarea } from 'ui/src/components/shadcn/ui/textarea'
import { Label } from 'ui/src/components/shadcn/ui/label'
import { Separator } from 'ui/src/components/shadcn/ui/separator'
import {
  MoreVertical,
  Loader2,
  Key,
  RotateCw,
  Trash2,
  Eye,
  Edit,
  ArrowRight,
  CirclePower,
  Timer,
  Book,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlgorithmHoverCard } from './AlgorithmHoverCard'
import { cn } from 'ui'
import {
  StandbyKeyIllustration,
  WhyRotateKeysIllustration,
  WhyUseStandbyKeysIllustration,
} from './illustrations'

type KeyStatus = 'IN_USE' | 'STANDBY' | 'PREVIOUSLY_USED' | 'REVOKED'
type JWTAlgorithm = 'HS256' | 'RS256' | 'ES256'

interface SecretKey {
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

const initialKeys: SecretKey[] = [
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

const secretKeysAtom = atomWithStorage<SecretKey[]>('secretKeys', initialKeys)

export default function JWTSecretKeysTablev2() {
  const [secretKeys, setSecretKeys] = useAtom(secretKeysAtom)
  const [selectedKey, setSelectedKey] = useState<SecretKey | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
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

  const createNewKey = (status: KeyStatus): SecretKey => ({
    id: Date.now().toString(),
    status: status,
    keyId: Math.random().toString(36).substr(2, 8),
    createdAt: new Date().toISOString(),
    expiresAt:
      status === 'PREVIOUSLY_USED'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null,
    algorithm: newKeyAlgorithm,
    publicKey: `-----BEGIN PUBLIC KEY-----
NEW_KEY_CONTENT
-----END PUBLIC KEY-----`,
    jwksUrl: `https://example.com/new-${status.toLowerCase()}-key-jwks.json`,
    ...(customSigningKey && { customSigningKey }),
  })

  const addNewStandbyKey = async () => {
    setFormError('')
    setActionInProgress('new')
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
    const newKey = createNewKey('STANDBY')
    setSecretKeys((prevKeys) => {
      const existingStandbyKey = prevKeys.find((key) => key.status === 'STANDBY')
      if (existingStandbyKey) {
        return prevKeys
          .map((key) => (key.id === existingStandbyKey.id ? { ...key, status: 'REVOKED' } : key))
          .concat(newKey)
      }
      return [...prevKeys, newKey]
    })
    setActionInProgress(null)
    setShowCreateKeyDialog(false)
    resetNewKeyForm()
  }

  const rotateKey = async () => {
    setActionInProgress('rotate')
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call

    setSecretKeys((prevKeys) => {
      const updatedKeys = prevKeys.map((key) => {
        if (key.status === 'IN_USE') {
          return {
            ...key,
            status: 'PREVIOUSLY_USED',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          }
        } else if (key.status === 'PREVIOUSLY_USED') {
          return { ...key, status: 'REVOKED' }
        } else if (key.status === 'STANDBY') {
          return { ...key, status: 'IN_USE' }
        }
        return key
      })

      if (!standbyKey) {
        const newInUseKey = createNewKey('IN_USE')
        return [...updatedKeys, newInUseKey]
      }

      return updatedKeys
    })

    setActionInProgress(null)
    setShowRotateKeyDialog(false)
    setShowConfirmRotateDialog(false)
  }

  const deleteStandbyKey = async () => {
    setActionInProgress('delete')
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
    setSecretKeys((prevKeys) => prevKeys.filter((key) => key.status !== 'STANDBY'))
    setActionInProgress(null)
  }

  const editStandbyKey = async () => {
    setActionInProgress('edit')
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
    setSecretKeys((prevKeys) =>
      prevKeys.map((key) =>
        key.status === 'STANDBY'
          ? { ...key, algorithm: newKeyAlgorithm, customSigningKey: customSigningKey || undefined }
          : key
      )
    )
    setActionInProgress(null)
    setShowEditStandbyKeyDialog(false)
  }

  const revokeKey = async (id: string) => {
    setActionInProgress('revoke')
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
    setSecretKeys((prevKeys) =>
      prevKeys.map((key) => (key.id === id ? { ...key, status: 'REVOKED' } : key))
    )
    setActionInProgress(null)
  }

  const resetNewKeyForm = () => {
    setNewKeyAlgorithm('ES256')
    setNewKeyDescription('')
    setCustomSigningKey('')
    setFormError('')
  }

  const renderKeyRow = (key: SecretKey) => (
    <motion.tr
      key={key.id}
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{
        opacity: 1,
        height: 'auto',
        transition: { duration: 0.2 },
      }}
      exit={{ opacity: 0, height: 0 }}
      className={key.status !== 'IN_USE' ? 'border-b border-dashed border-border' : 'border-b'}
    >
      <TableCell className="py-4 w-[150px] pr-0">
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
      <TableCell className="font-mono truncate max-w-[100px] pl-0">
        <div className="">
          <Badge
            className={cn(
              'bg-opacity-100 bg-200 border-foreground-muted',
              'rounded-l-none',
              'gap-2 py-0 h-6'
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
      <TableCell className="truncate max-w-[150px] font-mono text-xs">{key.createdAt}</TableCell>
      {/* <TableCell className="truncate max-w-[150px]">{key.expiresAt || 'N/A'}</TableCell> */}
      <TableCell className="truncate max-w-[100px]">
        {/* {algorithmLabels[key.algorithm]} */}
        <AlgorithmHoverCard algorithm={key.algorithm} />
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
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
    </motion.tr>
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
          <CardHeader className="lg:flex-row lg:items-center gap-3 lg:gap-10">
            <div className="flex flex-col gap-1 flex-1 grow">
              <CardTitle>{title}</CardTitle>
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
          type="danger"
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
        <Card className="w-full bg-surface-100 overflow-hidden">
          <CardContent className="p-0">
            <Table className="p-5">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5 text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2 pr-0 w-20">
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
                  <TableHead className="pr-5 text-right font-mono uppercase text-xs text-foreground-muted h-auto py-2">
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
            <Button onClick={() => addNewStandbyKey()} disabled={actionInProgress === 'new'}>
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
            <Button onClick={() => editStandbyKey()} disabled={actionInProgress === 'edit'}>
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
            <Button variant="outline" onClick={() => setShowConfirmRotateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => rotateKey()}>Confirm Rotation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showKeyDetailsDialog} onOpenChange={setShowKeyDetailsDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Key Details</DialogTitle>
          </DialogHeader>
          {selectedKey && (
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="font-bold text-base mb-2">Public Key (PEM format)</h4>
                <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-40">
                  {selectedKey.publicKey}
                </pre>
              </div>
              <div>
                <h4 className="font-bold text-base mb-2">JWKS URL</h4>
                <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto break-all">
                  {selectedKey.jwksUrl}
                </pre>
              </div>
              {selectedKey.customSigningKey && (
                <div>
                  <h4 className="font-bold text-base mb-2">Custom Signing Key</h4>
                  <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto break-all">
                    {selectedKey.customSigningKey}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
