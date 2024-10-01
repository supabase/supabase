'use client'

import React, { useState, useMemo } from 'react'
import { atom, useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { Card, CardContent, CardHeader, CardTitle } from 'ui/src/components/shadcn/ui/card'
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
  DropdownMenuSeparator,
} from 'ui/src/components/shadcn/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
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
import { Checkbox } from 'ui/src/components/shadcn/ui/checkbox'
import { Label } from 'ui/src/components/shadcn/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'ui/src/components/shadcn/ui/tabs'
import {
  MoreVertical,
  Loader2,
  Copy,
  ChevronDown,
  ChevronUp,
  Plus,
  AlertTriangle,
  Trash2,
  Eye,
  ArrowUpCircle,
  Key,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

type KeyStatus = 'STANDBY' | 'IN_USE' | 'PREVIOUSLY_USED'
type JWTAlgorithm = 'HS256' | 'RS256' | 'ES256'

interface SecretKey {
  id: string
  status: KeyStatus
  keyId: string
  description: string
  createdAt: string
  signingCertificate: string
  jwksUrl: string
  algorithm: JWTAlgorithm
}

const statusLabels: Record<KeyStatus, string> = {
  STANDBY: 'Standby',
  IN_USE: 'In use',
  PREVIOUSLY_USED: 'Previously used',
}

const statusColors: Record<KeyStatus, string> = {
  STANDBY: 'text-xs font-mono uppercase bg-warning bg-opacity-100 text-warning-200 border-warning',
  IN_USE: 'text-xs font-mono uppercase bg-brand bg-opacity-100 text-brand-200 border-brand',
  PREVIOUSLY_USED: 'text-xs font-mono uppercase bg-alternative text-gray-800',
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
    description: 'Primary key for API authentication',
    createdAt: '2024-07-13 09:00',
    signingCertificate: `-----BEGIN EC PUBLIC KEY-----
MHcCAQEEIH4BVMWZHYgcNp2ZghycNpSzZdaZfr9tNjGjvmrNJJ7doAoGCCqGSM49
AwEHoUQDQgAE98vdXVxshHIIm2ZhGxMuLpeHHHVlnzBUc7lsumMGtm3HVoUQASV3
K1d9l1zeI6qizbf1wTXMa1kqbktfO03buQ==
-----END EC PUBLIC KEY-----`,
    jwksUrl: 'https://ezakimiacqsutfvoabc.supabase.co/auth/v1/well-known/jwks.json',
    algorithm: 'ES256',
  },
  {
    id: '2',
    status: 'STANDBY',
    keyId: '4d3e7909',
    description: 'Backup key for high-traffic periods',
    createdAt: '2024-07-13 09:00',
    signingCertificate: `-----BEGIN EC PUBLIC KEY-----
MHcCAQEEIH4BVMWZHYgcNp2ZghycNpSzZdaZfr9tNjGjvmrNJJ7doAoGCCqGSM49
AwEHoUQDQgAE98vdXVxshHIIm2ZhGxMuLpeHHHVlnzBUc7lsumMGtm3HVoUQASV3
K1d9l1zeI6qizbf1wTXMa1kqbktfO03buQ==
-----END EC PUBLIC KEY-----`,
    jwksUrl: 'https://ezakimiacqsutfvoabc.supabase.co/auth/v1/well-known/jwks.json',
    algorithm: 'ES256',
  },
]

const secretKeysAtom = atomWithStorage<SecretKey[]>('secretKeys', initialKeys)

const ApiKeySection: React.FC<{ inUseKey: SecretKey | undefined }> = ({ inUseKey }) => {
  const generateJWT = (role: string) => {
    if (!inUseKey) return ''

    const header = {
      alg: inUseKey.algorithm,
      typ: 'JWT',
      kid: inUseKey.keyId,
    }

    const payload = {
      iss: 'supabase',
      sub: '',
      role: role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 315360000, // 10 years from now
    }

    const encodedHeader = btoa(JSON.stringify(header))
    const encodedPayload = btoa(JSON.stringify(payload))

    // Note: In a real implementation, you would sign this properly.
    // For demonstration purposes, we're using a placeholder signature.
    const signature = 'PLACEHOLDER_SIGNATURE'

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }

  const legacyPublishableKey = useMemo(() => generateJWT('anon'), [inUseKey])
  const legacySecretKey = useMemo(() => generateJWT('service_role'), [inUseKey])

  const betaPublishableKey = 'sb_publishable_1234567890abcdefghijklmnopqrstuvwxyz'
  const betaSecretKey = 'sb_secret_1234567890abcdefghijklmnopqrstuvwxyz'

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast({
          title: 'Copied!',
          description: `${description} has been copied to your clipboard.`,
        })
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err)
        toast({
          title: 'Error',
          description: 'Failed to copy to clipboard.',
          variant: 'destructive',
        })
      })
  }

  const generateJWKS = () => {
    if (!inUseKey) return 'No in-use key available'

    const jwk = {
      kty: inUseKey.algorithm.startsWith('RS') ? 'RSA' : 'EC',
      use: 'sig',
      alg: inUseKey.algorithm,
      kid: inUseKey.keyId,
      // This is a simplified representation. In a real scenario, you'd need to properly format the key based on its type
      key: inUseKey.signingCertificate,
    }

    const jwks = {
      keys: [jwk],
    }

    return JSON.stringify(jwks, null, 2)
  }

  const jwksContent = generateJWKS()

  return (
    <Card className="w-full max-w-4xl mx-auto py-6">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Project API keys</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="beta">
          <TabsList className="mb-4">
            <TabsTrigger value="beta">Beta</TabsTrigger>
            <TabsTrigger value="legacy">Legacy</TabsTrigger>
          </TabsList>
          <TabsContent value="beta">
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="secondary">publishable</Badge>
                  <Badge variant="secondary">public</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-muted p-2 rounded text-sm truncate">
                    {betaPublishableKey}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(betaPublishableKey, 'Beta publishable key')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  This key is safe to use in a browser if you have enabled Row Level Security for
                  your tables and configured policies. It's equivalent to the legacy 'anon' key.
                </p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge>secret</Badge>
                  <Badge variant="destructive">secret</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-muted p-2 rounded text-sm truncate">
                    {betaSecretKey}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(betaSecretKey, 'Beta secret key')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  This key has the ability to bypass Row Level Security. Never share it publicly.
                  It's equivalent to the legacy 'service_role' key.
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between space-x-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">JWKS</Badge>
                    <Badge variant="secondary">public</Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(jwksContent, 'JWKS')}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy JWKS
                  </Button>
                </div>
                <Textarea className="font-mono text-sm" value={jwksContent} readOnly rows={3} />
                <p className="text-sm text-muted-foreground mt-2">
                  This is the JSON Web Key Set (JWKS) for verifying JWTs. It updates when the in-use
                  JWT secret changes.
                </p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="legacy">
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="secondary">anon</Badge>
                  <Badge variant="secondary">public</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-muted p-2 rounded text-sm truncate">
                    {legacyPublishableKey}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(legacyPublishableKey, 'Legacy publishable key')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  This key is safe to use in a browser if you have enabled Row Level Security for
                  your tables and configured policies.
                </p>
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge>service_role</Badge>
                  <Badge variant="destructive">secret</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-muted p-2 rounded text-sm truncate">
                    {legacySecretKey}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(legacySecretKey, 'Legacy secret key')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  This key has the ability to bypass Row Level Security. Never share it publicly.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export function JWTSecretKeysTable() {
  const [secretKeys, setSecretKeys] = useAtom(secretKeysAtom)
  const [selectedKey, setSelectedKey] = useState<SecretKey | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [showAllPreviousKeys, setShowAllPreviousKeys] = useState(false)
  const [promotingKey, setPromotingKey] = useState<SecretKey | null>(null)
  const [removingInUseKey, setRemovingInUseKey] = useState(false)
  const [replacementKeyId, setReplacementKeyId] = useState<string | null>(null)
  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false)
  const [newKeyAlgorithm, setNewKeyAlgorithm] = useState<JWTAlgorithm>('ES256')
  const [useCustomSigningKey, setUseCustomSigningKey] = useState(false)
  const [customSigningKey, setCustomSigningKey] = useState('')
  const [newKeyDescription, setNewKeyDescription] = useState('')
  const [formError, setFormError] = useState('')

  const inUseKey = useMemo(() => secretKeys.find((key) => key.status === 'IN_USE'), [secretKeys])

  const activeKeys = useMemo(() => {
    return secretKeys
      .filter((key) => key.status === 'IN_USE' || key.status === 'STANDBY')
      .sort((a, b) => {
        if (a.status === 'IN_USE') return -1
        if (b.status === 'IN_USE') return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [secretKeys])

  const previouslyUsedKeys = useMemo(
    () =>
      secretKeys
        .filter((key) => key.status === 'PREVIOUSLY_USED')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [secretKeys]
  )

  const createNewKey = (): SecretKey => ({
    id: Date.now().toString(),
    status: 'STANDBY',
    keyId: Math.random().toString(36).substr(2, 8),
    description: newKeyDescription || 'Newly created standby key',
    createdAt: new Date().toISOString(),
    signingCertificate: useCustomSigningKey
      ? customSigningKey
      : `-----BEGIN EC PUBLIC KEY-----
NEW_STANDBY_KEY_CONTENT
-----END EC PUBLIC KEY-----`,
    jwksUrl: `https://example.com/new-standby-key-jwks.json`,
    algorithm: newKeyAlgorithm,
  })

  const addNewStandbyKey = async (autoPromote = false) => {
    if (useCustomSigningKey && !customSigningKey.trim()) {
      setFormError("Custom signing key is required when 'Use custom signing key' is checked.")
      return
    }
    setFormError('')
    setActionInProgress('new')
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call
    const newKey = createNewKey()
    setSecretKeys((prevKeys) => {
      if (autoPromote) {
        return prevKeys
          .map((key) => (key.status === 'IN_USE' ? { ...key, status: 'PREVIOUSLY_USED' } : key))
          .concat({ ...newKey, status: 'IN_USE' })
      }
      return [...prevKeys, newKey]
    })
    setActionInProgress(null)
    setShowCreateKeyDialog(false)
    resetNewKeyForm()
    if (autoPromote) {
      setRemovingInUseKey(false)
    }
  }

  const resetNewKeyForm = () => {
    setNewKeyAlgorithm('ES256')
    setUseCustomSigningKey(false)
    setCustomSigningKey('')
    setNewKeyDescription('')
    setFormError('')
  }

  const generateJWKS = (key: SecretKey) => {
    const jwk = {
      kty: key.algorithm.startsWith('RS') ? 'RSA' : 'EC',
      use: 'sig',
      alg: key.algorithm,
      kid: key.keyId,
      // This is a simplified representation. In a real scenario, you'd need to properly format the key based on its type
      key: key.signingCertificate,
    }

    const jwks = {
      keys: [jwk],
    }

    return JSON.stringify(jwks, null, 2)
  }

  const promoteToInUse = async (id: string) => {
    const keyToPromote = secretKeys.find((key) => key.id === id)
    if (!keyToPromote) return

    setPromotingKey(keyToPromote)
  }

  const confirmPromotion = async () => {
    if (!promotingKey) return

    setActionInProgress(promotingKey.id)
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call

    setSecretKeys((prevKeys) => {
      return prevKeys.map((key) => {
        if (key.id === promotingKey.id) {
          return { ...key, status: 'IN_USE' }
        } else if (key.status === 'IN_USE') {
          return { ...key, status: 'PREVIOUSLY_USED' }
        }
        return key
      })
    })
    setActionInProgress(null)
    setPromotingKey(null)
  }

  const revokeKey = async (id: string) => {
    setActionInProgress(id)
    await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate API call

    setSecretKeys((prevKeys) => prevKeys.filter((key) => key.id !== id))
    setActionInProgress(null)
  }

  const removeInUseKey = async () => {
    if (!replacementKeyId && activeKeys.length === 0) {
      // If there are no standby keys, create a new one and promote it
      await addNewStandbyKey(true)
      return
    }

    if (!replacementKeyId) return

    setActionInProgress('remove')
    await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call

    setSecretKeys((prevKeys) => {
      return prevKeys.map((key) => {
        if (key.status === 'IN_USE') {
          return { ...key, status: 'PREVIOUSLY_USED' }
        } else if (key.id === replacementKeyId) {
          return { ...key, status: 'IN_USE' }
        }
        return key
      })
    })

    setActionInProgress(null)
    setRemovingInUseKey(false)
    setReplacementKeyId(null)
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
        transition: { duration: 0.3 },
      }}
      exit={{ opacity: 0, height: 0 }}
      className={`border-t border-dashed ${key.status === 'IN_USE' ? 'bg-surface-200' : ''}`}
    >
      <TableCell className="py-4">
        <Badge className={`${statusColors[key.status]} font-medium px-2 py-1 rounded-full`}>
          {statusLabels[key.status]}
        </Badge>
      </TableCell>
      <TableCell className="font-mono truncate max-w-[100px]">{key.keyId}</TableCell>
      <TableCell className="truncate max-w-[150px]">{key.createdAt}</TableCell>
      <TableCell className="truncate max-w-[100px]">{algorithmLabels[key.algorithm]}</TableCell>
      <TableCell className="text-right">
        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={() => setSelectedKey(key)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View signing credentials
                </DropdownMenuItem>
              </DialogTrigger>
              {key.status === 'STANDBY' && (
                <DropdownMenuItem
                  onSelect={() => promoteToInUse(key.id)}
                  disabled={actionInProgress !== null}
                >
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Promote to In-Use
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {key.status === 'STANDBY' && (
                <DropdownMenuItem
                  onSelect={() => revokeKey(key.id)}
                  disabled={actionInProgress !== null}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Revoke key
                </DropdownMenuItem>
              )}
              {key.status === 'IN_USE' && (
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={() => setRemovingInUseKey(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove key
                  </DropdownMenuItem>
                </DialogTrigger>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Signing Credentials</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <h4 className="font-bold text-lg mb-2">Signing Certificate (PEM file)</h4>
                <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-all max-h-40">
                  {key.signingCertificate}
                </pre>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-2">JWKS URL</h4>
                <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto break-all">
                  {key.jwksUrl}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </TableCell>
    </MotionTableRow>
  )

  return (
    <>
      <div className="space-y-8">
        <Button
          onClick={() => setShowCreateKeyDialog(true)}
          disabled={actionInProgress !== null}
          icon={<Key />}
        >
          Create New Standby Key
        </Button>

        <Card className="w-full bg-surface-100">
          <CardHeader>
            <CardTitle>Active Keys</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table className="p-5">
              <TableHeader>
                <TableRow className="bg-surface-300">
                  <TableHead className="pl-5 text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                    Status
                  </TableHead>
                  <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                    Key ID
                  </TableHead>
                  <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                    Created At
                  </TableHead>
                  <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                    Type
                  </TableHead>
                  <TableHead className="pr-5 text-right font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>{activeKeys.map(renderKeyRow)}</AnimatePresence>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {previouslyUsedKeys.length > 0 && (
          <Card className="w-full bg-surface-100">
            <CardHeader>
              <CardTitle>Previously Used Keys</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table className="p-5">
                <TableHeader>
                  <TableRow className="bg-surface-300">
                    <TableHead className="pl-5 text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                      Status
                    </TableHead>
                    <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                      Key ID
                    </TableHead>
                    <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                      Created At
                    </TableHead>
                    <TableHead className="text-left font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                      Type
                    </TableHead>
                    <TableHead className="pr-5 text-right font-mono uppercase text-xs text-foreground-lighter h-auto py-2">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {previouslyUsedKeys
                      .slice(0, showAllPreviousKeys ? undefined : 2)
                      .map(renderKeyRow)}
                  </AnimatePresence>
                </TableBody>
              </Table>
              {previouslyUsedKeys.length > 2 && (
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() => setShowAllPreviousKeys(!showAllPreviousKeys)}
                >
                  {showAllPreviousKeys ? (
                    <>
                      <ChevronUp className="mr-2 h-4 w-4" />
                      Hide older keys
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-4 w-4" />
                      Show {previouslyUsedKeys.length - 2} more previously used keys
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <Dialog open={showCreateKeyDialog} onOpenChange={setShowCreateKeyDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create a new JWT Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useCustomKey"
                checked={useCustomSigningKey}
                onCheckedChange={(checked) => setUseCustomSigningKey(checked as boolean)}
              />
              <Label htmlFor="useCustomKey">Use custom signing key?</Label>
            </div>
            {useCustomSigningKey && (
              <div>
                <Label htmlFor="customKey">Custom Signing Key:</Label>
                <Textarea
                  id="customKey"
                  value={customSigningKey}
                  onChange={(e) => setCustomSigningKey(e.target.value)}
                  placeholder="Enter your custom signing key"
                  rows={4}
                />
              </div>
            )}
            {formError && <p className="text-sm text-red-500">{formError}</p>}
          </div>
          <DialogFooter>
            <Button onClick={() => addNewStandbyKey()} disabled={actionInProgress === 'new'}>
              {actionInProgress === 'new' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={removingInUseKey} onOpenChange={setRemovingInUseKey}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove In-Use Key</DialogTitle>
            <DialogDescription>
              {activeKeys.length > 0
                ? 'Select a standby key to promote as the new in-use key:'
                : 'There are no standby keys available. A new standby key will be created and promoted to in-use.'}
            </DialogDescription>
          </DialogHeader>
          {activeKeys.length > 0 ? (
            <Select onValueChange={setReplacementKeyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a standby key" />
              </SelectTrigger>
              <SelectContent>
                {activeKeys.map((key) => (
                  <SelectItem key={key.id} value={key.id} className="py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{key.keyId}</span>
                      <span className="text-sm text-gray-500">Created: {key.createdAt}</span>
                      <span className="text-sm text-gray-500">
                        Type: {algorithmLabels[key.algorithm]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <p className="text-sm text-yellow-700">No standby keys available</p>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={removeInUseKey}
              disabled={
                (!replacementKeyId && activeKeys.length > 0) || actionInProgress === 'remove'
              }
            >
              {actionInProgress === 'remove' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : activeKeys.length > 0 ? (
                'Remove and Replace'
              ) : (
                'Remove and Create New Key'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!promotingKey} onOpenChange={() => setPromotingKey(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Promote Key to In-Use</DialogTitle>
            <DialogDescription>
              Warning: Promoting this key to In-Use will change the JWKS. If it's in use in your
              app, you'll need to update it with the new JWKS.
            </DialogDescription>
          </DialogHeader>
          {promotingKey && (
            <div className="space-y-4">
              <div>
                <Label>New JWKS:</Label>
                <Textarea
                  value={generateJWKS(promotingKey)}
                  readOnly
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generateJWKS(promotingKey))
                  toast({
                    title: 'Copied!',
                    description: 'New JWKS has been copied to your clipboard.',
                  })
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy New JWKS
              </Button>
            </div>
          )}
          <DialogFooter>
            <Button onClick={confirmPromotion} disabled={actionInProgress === promotingKey?.id}>
              {actionInProgress === promotingKey?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Promoting...
                </>
              ) : (
                'Confirm Promotion'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
