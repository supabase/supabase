import { zodResolver } from '@hookform/resolvers/zod'
import { useStripeSyncInstallMutation } from 'data/database-integrations/stripe/stripe-sync-install-mutation'
import { useStripeSyncUninstallMutation } from 'data/database-integrations/stripe/stripe-sync-uninstall-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { formatRelative } from 'date-fns'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTrack } from 'lib/telemetry/track'
import { AlertCircle, BadgeCheck, Check, ExternalLink, RefreshCwIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { IntegrationOverviewTab } from '../../Integration/IntegrationOverviewTab'
import { StripeSyncChangesCard } from './StripeSyncChangesCard'
import { canInstall as checkCanInstall } from '@/components/interfaces/Integrations/templates/StripeSyncEngine/stripe-sync-status'
import { useStripeSyncStatus } from '@/components/interfaces/Integrations/templates/StripeSyncEngine/useStripeSyncStatus'

const installFormSchema = z.object({
  stripeSecretKey: z.string().min(1, 'Stripe API key is required'),
})

export const StripeSyncInstallationPage = () => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const track = useTrack()
  const hasTrackedInstallFailed = useRef(false)

  const [shouldShowInstallSheet, setShouldShowInstallSheet] = useState(false)
  // These flags bridge the gap between mutation success and schema update
  const [isInstallInitiated, setIsInstallInitiated] = useState(false)
  const [isUninstallInitiated, setIsUninstallInitiated] = useState(
    router.query.status === 'uninstalling'
  )

  const formId = 'stripe-sync-install-form'
  const form = useForm<z.infer<typeof installFormSchema>>({
    resolver: zodResolver(installFormSchema),
    defaultValues: {
      stripeSecretKey: '',
    },
    mode: 'onSubmit',
  })

  // Use the unified status hook
  const { installationStatus, stripeSchema, syncState, isSyncing } = useStripeSyncStatus({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const isInstalled = installationStatus === 'installed'
  const setupError = installationStatus === 'install_error'
  const uninstallError = installationStatus === 'uninstall_error'
  const schemaShowsInProgress = installationStatus === 'installing'
  const schemaShowsUninstallInProgress = installationStatus === 'uninstalling'

  const {
    mutate: installStripeSync,
    isPending: isInstalling,
    error: installError,
    reset: resetInstallError,
  } = useStripeSyncInstallMutation({
    onSuccess: () => {
      toast.success('Stripe Sync installation started')
      setShouldShowInstallSheet(false)
      form.reset()
      setIsInstallInitiated(true)
    },
  })

  const { mutate: uninstallStripeSync, isPending: isUninstalling } = useStripeSyncUninstallMutation(
    {
      onSuccess: () => {
        toast.success('Stripe Sync uninstallation started')
        setIsUninstallInitiated(true)
      },
    }
  )

  // Combine schema status with mutation/initiated states for UI
  const setupInProgress = schemaShowsInProgress || isInstalling || isInstallInitiated
  const uninstallInProgress =
    schemaShowsUninstallInProgress || isUninstalling || isUninstallInitiated

  // Track install failures
  useEffect(() => {
    if (!setupError) {
      hasTrackedInstallFailed.current = false
      return
    }

    if (!hasTrackedInstallFailed.current) {
      hasTrackedInstallFailed.current = true
      track('integration_install_failed', {
        integrationName: 'stripe_sync_engine',
      })
    }
  }, [setupError, track])

  // Clear install initiated flag once schema reflects completion or error
  useEffect(() => {
    if (isInstallInitiated && (isInstalled || setupError)) {
      setIsInstallInitiated(false)
    }
  }, [isInstallInitiated, isInstalled, setupError])

  // Clear uninstall initiated flag once schema is removed or error
  useEffect(() => {
    if (isUninstallInitiated && (!stripeSchema || uninstallError)) {
      setIsUninstallInitiated(false)
    }
  }, [isUninstallInitiated, stripeSchema, uninstallError])

  // Clean up the status query parameter after schema confirms uninstall status
  useEffect(() => {
    if (
      router.query.status === 'uninstalling' &&
      (schemaShowsUninstallInProgress || !stripeSchema || uninstallError)
    ) {
      const { status: _, ...rest } = router.query
      router.replace({ query: rest }, undefined, { shallow: true })
    }
  }, [router, schemaShowsUninstallInProgress, stripeSchema, uninstallError])

  const canInstall = checkCanInstall(installationStatus) && !isInstalled && !setupInProgress

  // Poll for schema changes during transitions
  useSchemasQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { refetchInterval: setupInProgress || uninstallInProgress ? 5000 : false }
  )

  const handleUninstall = useCallback(() => {
    if (!project?.ref) return

    uninstallStripeSync({
      projectRef: project.ref,
    })
  }, [project?.ref, uninstallStripeSync])

  const handleOpenInstallSheet = useCallback(() => {
    resetInstallError()
    setShouldShowInstallSheet(true)
  }, [resetInstallError])

  const handleCloseInstallSheet = (isOpen: boolean) => {
    if (isInstalling) return

    setShouldShowInstallSheet(isOpen)
    if (!isOpen) {
      form.reset()
      resetInstallError()
    }
  }

  const tableEditorUrl = `/project/${project?.ref}/editor?schema=stripe`

  const alert = useMemo(() => {
    if (uninstallError) {
      return (
        <Admonition type="destructive" showIcon={true} title="Uninstallation Error">
          <div>
            There was an error during the uninstallation of the Stripe Sync Engine. Please try
            again. If the problem persists, contact support.
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              type="warning"
              onClick={handleUninstall}
              loading={isUninstalling}
              disabled={isUninstalling}
            >
              Try Again
            </Button>
          </div>
        </Admonition>
      )
    }

    if (setupError) {
      return (
        <Admonition type="destructive" showIcon={true} title="Installation Error">
          <div>
            There was an error during the installation of the Stripe Sync Engine. Please try
            reinstalling the integration. If the problem persists, contact support.
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleOpenInstallSheet}>Try Again</Button>
            <Button
              type="warning"
              onClick={handleUninstall}
              loading={isUninstalling}
              disabled={isUninstalling}
            >
              Uninstall
            </Button>
          </div>
        </Admonition>
      )
    }

    if (syncState && isInstalled && !uninstallInProgress) {
      return (
        <Admonition type="default" showIcon={false}>
          <div className="flex items-center justify-between gap-2">
            {isSyncing ? (
              <>
                <div className="flex items-center gap-2 animate-pulse">
                  <RefreshCwIcon size={14} />
                  <div>Sync in progress...</div>
                </div>
                <div className="text-foreground-light text-sm">
                  Started {formatRelative(new Date(syncState.started_at!), new Date())}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <BadgeCheck size={14} className="text-brand" />
                  <div>All up to date</div>
                  <Button asChild type="link">
                    <Link href={tableEditorUrl}>View data</Link>
                  </Button>
                </div>
                <div className="text-foreground-light text-sm">
                  Last synced {formatRelative(new Date(syncState.closed_at!), new Date())}
                </div>
              </>
            )}
          </div>
        </Admonition>
      )
    }

    return null
  }, [
    uninstallError,
    setupError,
    syncState,
    isSyncing,
    isInstalled,
    isUninstalling,
    tableEditorUrl,
    uninstallInProgress,
    handleOpenInstallSheet,
    handleUninstall,
  ])

  const statusDisplay = useMemo(() => {
    if (uninstallError) {
      return (
        <span className="flex items-center gap-2 text-foreground-light text-sm">
          <AlertCircle size={14} className="text-destructive" />
          Uninstallation error
        </span>
      )
    }
    if (uninstallInProgress) {
      return (
        <span className="flex items-center gap-2 text-foreground-light text-sm">
          <RefreshCwIcon size={14} className="animate-spin text-foreground-lighter" />
          Uninstalling...
        </span>
      )
    }
    if (setupError) {
      return (
        <span className="flex items-center gap-2 text-foreground-light text-sm">
          <AlertCircle size={14} className="text-destructive" />
          Installation error
        </span>
      )
    }
    if (setupInProgress) {
      return (
        <span className="flex items-center gap-2 text-foreground-light text-sm">
          <RefreshCwIcon size={14} className="animate-spin text-foreground-lighter" />
          Installing...
        </span>
      )
    }
    if (isSyncing && isInstalled) {
      return (
        <span className="flex items-center gap-2 text-foreground-light text-sm">
          <RefreshCwIcon size={14} className="animate-spin text-foreground-lighter" />
          Sync in progress...
        </span>
      )
    }
    if (isInstalled) {
      return (
        <span className="flex items-center gap-2 text-foreground-light text-sm">
          <Check size={14} strokeWidth={1.5} className="text-brand" /> Installed
        </span>
      )
    }
    return (
      <span className="flex items-center gap-2 text-foreground-light text-sm">Not installed</span>
    )
  }, [uninstallError, uninstallInProgress, setupError, setupInProgress, isSyncing, isInstalled])

  return (
    <IntegrationOverviewTab
      alert={alert}
      status={statusDisplay}
      actions={
        !isInstalled && !setupInProgress && !setupError ? (
          <StripeSyncChangesCard
            canInstall={canInstall}
            onInstall={() => setShouldShowInstallSheet(true)}
          />
        ) : null
      }
    >
      <Sheet open={!!shouldShowInstallSheet} onOpenChange={handleCloseInstallSheet}>
        <SheetContent size="lg" tabIndex={undefined} className="flex flex-col gap-0">
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              onSubmit={form.handleSubmit(({ stripeSecretKey }) => {
                if (!project?.ref) return
                installStripeSync({ projectRef: project.ref, stripeSecretKey })
              })}
              className="overflow-auto flex-grow px-0 flex flex-col"
            >
              <SheetHeader>
                <SheetTitle>Install Stripe Sync Engine</SheetTitle>
              </SheetHeader>
              <SheetSection className="flex-1">
                <StripeSyncChangesCard />
                <Admonition type="warning" className="mt-6">
                  <p>
                    This integration currently requires{' '}
                    <Link
                      href="https://supabase.com/docs/guides/platform/ssl-enforcement"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      SSL Enforcement
                    </Link>{' '}
                    to be disabled during initial setup. Support for SSL Enforcement will be added
                    in a future update. Once installed, all webhook and sync operations use
                    HTTPS/SSL.
                  </p>
                </Admonition>
                <h3 className="heading-default mb-4 mt-6">Configuration</h3>
                {installError && (
                  <Admonition type="destructive" className="mb-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Installation failed</p>
                        <p className="text-sm">{installError.message}</p>
                      </div>
                    </div>
                  </Admonition>
                )}

                <FormField_Shadcn_
                  control={form.control}
                  name="stripeSecretKey"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex-row-reverse"
                      label="Stripe API key"
                      description="Your Stripe secret key. Requires write access to Webhook Endpoints and read-only access to all other categories."
                    >
                      <FormControl_Shadcn_ className="col-span-8">
                        <Input
                          id="stripe_api_key"
                          name="stripe_api_key"
                          placeholder="Enter your Stripe API key"
                          autoComplete="stripe-api-key"
                          reveal={false}
                          disabled={isInstalling}
                          type="password"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />

                <div className="flex items-center mt-4 gap-2">
                  <Button asChild type="default" icon={<ExternalLink />}>
                    <Link
                      href="https://dashboard.stripe.com/apikeys"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get Stripe API key
                    </Link>
                  </Button>
                  <Button asChild type="default" icon={<ExternalLink />}>
                    <Link
                      href="https://support.stripe.com/questions/what-are-stripe-api-keys-and-how-to-find-them"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      What are Stripe API keys?
                    </Link>
                  </Button>
                </div>
              </SheetSection>
              <SheetFooter>
                <Button
                  type="default"
                  disabled={isInstalling}
                  onClick={() => handleCloseInstallSheet(false)}
                >
                  Cancel
                </Button>
                <Button
                  form={formId}
                  htmlType="submit"
                  type="primary"
                  loading={isInstalling}
                  disabled={!form.formState.isValid || isInstalling}
                >
                  {isInstalling ? 'Starting Installation...' : 'Start Installation'}
                </Button>
              </SheetFooter>
            </form>
          </Form_Shadcn_>
        </SheetContent>
      </Sheet>
    </IntegrationOverviewTab>
  )
}
