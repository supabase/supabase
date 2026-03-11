import { useParams } from 'common'
import { DeleteProjectDialog } from 'components/interfaces/Projects/DeleteProjectDialog'
import DefaultLayout from 'components/layouts/DefaultLayout'
import SettingsLayout from 'components/layouts/ProjectSettingsLayout/SettingsLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import type { NextPageWithLayout } from 'types'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Separator,
  Skeleton,
} from 'ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Eye, EyeOff, RefreshCw, Terminal, Trash2 } from 'lucide-react'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageContainer } from 'ui-patterns/PageContainer'

interface PlatformApiKeyPair {
  masked: string
  full: string
}

interface PlatformApiKeys {
  anon_key: PlatformApiKeyPair
  service_key: PlatformApiKeyPair
}

const CREDENTIALS_QUERY_KEY = (ref: string) => ['platform', 'projects', ref, 'api-keys'] as const

const ROTATION_REVEAL_SECONDS = 30

// ------- Key section component -------

interface KeySectionProps {
  label: string
  description: string
  keyPair: PlatformApiKeyPair
  revealed: boolean
  copied: boolean
  onRevealToggle: () => void
  onCopy: () => void
}

const KeySection = ({
  label,
  description,
  keyPair,
  revealed,
  copied,
  onRevealToggle,
  onCopy,
}: KeySectionProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        <p className="text-xs text-foreground-light mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 rounded-md border border-default bg-surface-100 px-3 py-2">
          <span className="font-mono text-xs text-foreground-light break-all">
            {revealed ? keyPair.full : keyPair.masked}
          </span>
        </div>
        <Button
          type="default"
          icon={revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          onClick={onRevealToggle}
          className="flex-shrink-0"
        >
          {revealed ? 'Hide' : 'Reveal'}
        </Button>
        <Button
          type="default"
          icon={<Copy size={14} />}
          onClick={onCopy}
          disabled={copied}
          className="flex-shrink-0"
        >
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
    </div>
  )
}

// ------- Main page -------

const CredentialsPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()
  const router = useRouter()

  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({
    anon: false,
    service: false,
  })
  const [copiedKeys, setCopiedKeys] = useState<Record<string, boolean>>({
    anon: false,
    service: false,
  })

  // Post-rotation countdown
  const [rotationCountdown, setRotationCountdown] = useState<number>(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [rotateError, setRotateError] = useState<string | null>(null)
  const [showRotateConfirm, setShowRotateConfirm] = useState(false)

  // Delete project dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Fetch platform API keys
  const {
    data: apiKeys,
    isPending: isLoadingKeys,
    isError: isKeysError,
    error: keysError,
    refetch: refetchKeys,
  } = useQuery<PlatformApiKeys>({
    queryKey: CREDENTIALS_QUERY_KEY(projectRef ?? ''),
    queryFn: async () => {
      if (!projectRef) throw new Error('No project ref')
      const response = await fetch(`/api/platform/projects/${projectRef}/api-keys`)
      if (!response.ok) {
        throw new Error(`Failed to fetch API keys: ${response.statusText}`)
      }
      return response.json()
    },
    enabled: !!projectRef,
  })

  // Rotate keys mutation
  const { mutate: rotateKeys, isPending: isRotating } = useMutation({
    mutationFn: async () => {
      if (!projectRef) throw new Error('No project ref')
      const response = await fetch(`/api/platform/projects/${projectRef}/rotate-keys`, {
        method: 'POST',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(
          (data as any)?.message || (data as any)?.error || 'Failed to rotate keys'
        )
      }
      return response.json()
    },
    onSuccess: () => {
      setRotateError(null)
      setShowRotateConfirm(false)

      // Invalidate and refetch keys
      queryClient.invalidateQueries({ queryKey: CREDENTIALS_QUERY_KEY(projectRef ?? '') })

      // Auto-reveal both keys for 30 seconds
      setRevealedKeys({ anon: true, service: true })
      setRotationCountdown(ROTATION_REVEAL_SECONDS)

      if (countdownRef.current) clearInterval(countdownRef.current)
      countdownRef.current = setInterval(() => {
        setRotationCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current)
            setRevealedKeys({ anon: false, service: false })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    },
    onError: (err: Error) => {
      setRotateError(err.message)
      setShowRotateConfirm(false)
    },
  })

  // Clean up countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  const handleRevealToggle = (key: 'anon' | 'service') => {
    setRevealedKeys((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleCopy = async (key: 'anon' | 'service') => {
    const value = key === 'anon' ? apiKeys?.anon_key.full : apiKeys?.service_key.full
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKeys((prev) => ({ ...prev, [key]: true }))
      setTimeout(() => setCopiedKeys((prev) => ({ ...prev, [key]: false })), 2000)
    } catch (_err) {
      // Clipboard write failed silently — user can reveal and copy manually
    }
  }

  // Derive project name from projectRef (used for delete dialog)
  const projectName = projectRef ?? ''

  return (
    <>
      <PageHeader size="small">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Platform Credentials</PageHeaderTitle>
            <PageHeaderDescription>
              JWT API keys for this project, managed by the platform provisioner
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer size="small">
        {/* Keys section */}
        <div className="flex flex-col gap-6">
          {isLoadingKeys && (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-20 w-full rounded-md" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          )}

          {isKeysError && (
            <Alert_Shadcn_ variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle_Shadcn_>Failed to load API keys</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                {(keysError as Error)?.message ?? 'Unknown error'}
              </AlertDescription_Shadcn_>
              <div className="mt-3">
                <Button type="default" size="tiny" onClick={() => refetchKeys()}>
                  Retry
                </Button>
              </div>
            </Alert_Shadcn_>
          )}

          {!isLoadingKeys && !isKeysError && apiKeys && (
            <>
              {rotationCountdown > 0 && (
                <Alert_Shadcn_ variant="default" className="border-brand-600 bg-brand-600/10">
                  <RefreshCw className="h-4 w-4" />
                  <AlertTitle_Shadcn_>Keys rotated successfully</AlertTitle_Shadcn_>
                  <AlertDescription_Shadcn_>
                    New keys are visible for {rotationCountdown} second
                    {rotationCountdown !== 1 ? 's' : ''}. Copy them now — they will be masked again
                    automatically.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}

              <KeySection
                label="anon key"
                description="Safe to use in browser clients. Respects Row Level Security policies."
                keyPair={apiKeys.anon_key}
                revealed={revealedKeys.anon}
                copied={copiedKeys.anon}
                onRevealToggle={() => handleRevealToggle('anon')}
                onCopy={() => handleCopy('anon')}
              />

              <Separator />

              <KeySection
                label="service_role key"
                description="Bypasses Row Level Security. Keep this secret — server-side only."
                keyPair={apiKeys.service_key}
                revealed={revealedKeys.service}
                copied={copiedKeys.service}
                onRevealToggle={() => handleRevealToggle('service')}
                onCopy={() => handleCopy('service')}
              />
            </>
          )}
        </div>

        {/* Rotate keys section */}
        <Separator className="my-2" />
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-medium text-foreground">Rotate keys</h3>
            <p className="text-xs text-foreground-light mt-0.5">
              Regenerate both anon and service_role keys. All existing clients using the current
              keys will lose access immediately.
            </p>
          </div>

          {rotateError && (
            <Alert_Shadcn_ variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle_Shadcn_>Rotation failed</AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>{rotateError}</AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          )}

          {showRotateConfirm ? (
            <div className="flex flex-col gap-2 border border-warning rounded-md p-4 bg-warning/5">
              <p className="text-sm text-foreground">
                This will invalidate existing keys. Continue?
              </p>
              <div className="flex gap-2">
                <Button
                  type="warning"
                  icon={<RefreshCw size={14} />}
                  loading={isRotating}
                  onClick={() => rotateKeys()}
                >
                  {isRotating ? 'Rotating...' : 'Yes, rotate keys'}
                </Button>
                <Button
                  type="default"
                  onClick={() => setShowRotateConfirm(false)}
                  disabled={isRotating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Button
                type="default"
                icon={<RefreshCw size={14} />}
                onClick={() => setShowRotateConfirm(true)}
                disabled={isLoadingKeys || isKeysError}
              >
                Rotate Keys
              </Button>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <Separator className="my-2" />
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-medium text-destructive">Danger zone</h3>
            <p className="text-xs text-foreground-light mt-0.5">
              Permanently delete this project and all its data. This cannot be undone.
            </p>
          </div>
          <div>
            <Button
              type="danger"
              icon={<Trash2 size={14} />}
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete project
            </Button>
          </div>
        </div>
      </PageContainer>

      <DeleteProjectDialog
        visible={showDeleteDialog}
        projectRef={projectName}
        projectName={projectName}
        onClose={() => setShowDeleteDialog(false)}
        onSuccess={() => router.push('/projects')}
      />
    </>
  )
}

CredentialsPage.getLayout = (page) => (
  <DefaultLayout>
    <SettingsLayout title="Platform Credentials">{page}</SettingsLayout>
  </DefaultLayout>
)

export default CredentialsPage
