import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useStripeSyncInstallMutation } from 'data/database-integrations/stripe/stripe-sync-install-mutation'
import { useStripeSyncUninstallMutation } from 'data/database-integrations/stripe/stripe-sync-uninstall-mutation'
import { useSchemasQuery } from 'data/database/schemas-query'
import { formatRelative } from 'date-fns'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTrack } from 'lib/telemetry/track'
import { AlertCircle, BadgeCheck, Check, ExternalLink, RefreshCwIcon } from 'lucide-react'
import Link from 'next/link'
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
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { IntegrationOverviewTab } from '../../Integration/IntegrationOverviewTab'
import {
  canInstall as checkCanInstall,
  hasInstallError,
  hasUninstallError,
  isInstallDone,
  isInstalled,
  isInstalling,
  isSyncRunning,
  isUninstallDone,
  isUninstalling,
} from './stripe-sync-status'
import { StripeSyncChangesCard } from './StripeSyncChangesCard'
import { useStripeSyncStatus } from '@/components/interfaces/Integrations/templates/StripeSyncEngine/useStripeSyncStatus'
import { InlineLink } from '@/components/ui/InlineLink'

const installFormSchema = z.object({
  stripeSecretKey: z.string().min(1, 'Stripe API key is required'),
})

export const StripeSyncInstallationPage = () => {
  const track = useTrack()
  const hasTrackedInstallFailed = useRef(false)
  const { data: project } = useSelectedProjectQuery()

  const [shouldShowInstallSheet, setShouldShowInstallSheet] = useState(false)
  const [showUninstallModal, setShowUninstallModal] = useState(false)
  // These flags bridge the gap between mutation success and schema update
  const [isInstallInitiated, setIsInstallInitiated] = useState(false)
  const [isUninstallInitiated, setIsUninstallInitiated] = useState(false)

  const formId = 'stripe-sync-install-form'
  const form = useForm<z.infer<typeof installFormSchema>>({
    resolver: zodResolver(installFormSchema),
    defaultValues: { stripeSecretKey: '' },
    mode: 'onSubmit',
  })

  // Use the unified status hook
  const { installationStatus, syncState } = useStripeSyncStatus({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  // Check permissions for managing function secrets
  const { can: canManageSecrets } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_SECRET_WRITE,
    '*'
  )

  const isSyncing = isSyncRunning(syncState)

  const installed = isInstalled(installationStatus)
  const installError = hasInstallError(installationStatus)
  const uninstallError = hasUninstallError(installationStatus)
  const installInProgress = isInstalling(installationStatus)
  const uninsallInProgress = isUninstalling(installationStatus)
  const installDone = isInstallDone(installationStatus)
  const uninstallDone = isUninstallDone(installationStatus)

  const {
    mutate: installStripeSync,
    isPending: isInstallRequested,
    error: installRequestError,
    reset: resetInstallError,
  } = useStripeSyncInstallMutation({
    onSuccess: () => {
      toast.success('Stripe Sync installation started')
      setShouldShowInstallSheet(false)
      form.reset()
      setIsInstallInitiated(true)
    },
  })

  const { mutate: uninstallStripeSync, isPending: isUninstallRequested } =
    useStripeSyncUninstallMutation({
      onSuccess: () => {
        toast.success('Stripe Sync uninstallation started')
        setShowUninstallModal(false)
        setIsUninstallInitiated(true)
      },
    })

  // Combine schema status with mutation/initiated states for UI
  const installing = installInProgress || isInstallRequested || isInstallInitiated
  const uninstalling = uninsallInProgress || isUninstallRequested || isUninstallInitiated
  const canInstall = checkCanInstall(installationStatus) && !installed && !installing

  // Poll for schema changes during transitions
  useSchemasQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { refetchInterval: installing || uninstalling ? 5000 : false }
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
    if (isInstallRequested) return

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
              loading={isUninstallRequested}
              disabled={isUninstallRequested}
            >
              Try Again
            </Button>
          </div>
        </Admonition>
      )
    }

    if (installError) {
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
              loading={isUninstallRequested}
              disabled={isUninstallRequested}
            >
              Uninstall
            </Button>
          </div>
        </Admonition>
      )
    }

    if (syncState && installed && !uninstalling) {
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
                  <Button asChild type="text">
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
    installError,
    syncState,
    isSyncing,
    installed,
    isUninstallRequested,
    tableEditorUrl,
    uninstalling,
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
    if (uninstalling) {
      return (
        <span className="flex items-center gap-2 text-foreground-light text-sm">
          <RefreshCwIcon size={14} className="animate-spin text-foreground-lighter" />
          Uninstalling...
        </span>
      )
    }
    if (installError) {
      return (
        <span className="flex items-center gap-2 text-foreground-light text-sm">
          <AlertCircle size={14} className="text-destructive" />
          Installation error
        </span>
      )
    }
    if (installing) {
      return (
        <span className="flex items-center gap-2 text-foreground-light text-sm">
          <RefreshCwIcon size={14} className="animate-spin text-foreground-lighter" />
          Installing...
        </span>
      )
    }
    if (isSyncing && installed) {
      return (
        <span className="flex items-center gap-2 text-foreground-light text-sm">
          <RefreshCwIcon size={14} className="animate-spin text-foreground-lighter" />
          Sync in progress...
        </span>
      )
    }
    if (installed) {
      return (
        <span className="flex items-center gap-2 text-foreground-light text-sm">
          <Check size={14} strokeWidth={1.5} className="text-brand" /> Installed
        </span>
      )
    }
    return (
      <span className="flex items-center gap-2 text-foreground-light text-sm">Not installed</span>
    )
  }, [uninstallError, uninstalling, installError, installing, isSyncing, installed])

  // Track install failures
  useEffect(() => {
    if (!installError) {
      hasTrackedInstallFailed.current = false
      return
    }

    if (!hasTrackedInstallFailed.current) {
      hasTrackedInstallFailed.current = true
      track('integration_install_failed', {
        integrationName: 'stripe_sync_engine',
      })
    }
  }, [installError, track])

  // Clear install initiated flag once schema reflects completion or error
  useEffect(() => {
    if (isInstallInitiated && installDone) {
      setIsInstallInitiated(false)
    }
  }, [isInstallInitiated, installDone])

  // Clear uninstall initiated flag once schema is removed or error
  useEffect(() => {
    if (isUninstallInitiated && uninstallDone) {
      setIsUninstallInitiated(false)
    }
  }, [isUninstallInitiated, uninstallDone])

  return (
    <>
      <IntegrationOverviewTab
        alert={alert}
        status={statusDisplay}
        actions={
          !installed && !installing && !installError ? (
            <>
              <StripeSyncChangesCard />
              <div className="flex justify-end mt-4">
                <ButtonTooltip
                  type="primary"
                  onClick={() => setShouldShowInstallSheet(true)}
                  disabled={!canInstall || !canManageSecrets}
                  tooltip={{
                    content: {
                      text: !canInstall
                        ? 'Your database already uses a schema named "stripe"'
                        : !canManageSecrets
                          ? 'You need additional permissions to install the Stripe Sync Engine.'
                          : undefined,
                    },
                  }}
                >
                  Install integration
                </ButtonTooltip>
              </div>
            </>
          ) : installed && !uninstalling ? (
            <div className="flex justify-end mt-4">
              <ButtonTooltip
                type="default"
                onClick={() => setShowUninstallModal(true)}
                disabled={!canManageSecrets}
                tooltip={{
                  content: {
                    text: !canManageSecrets
                      ? 'You need additional permissions to uninstall the Stripe Sync Engine.'
                      : undefined,
                  },
                }}
              >
                Uninstall integration
              </ButtonTooltip>
            </div>
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
                <SheetSection className="flex-1 flex flex-col gap-y-6">
                  <StripeSyncChangesCard />

                  <Admonition type="warning">
                    <h5 className="mb-0.5">
                      This integration currently requires{' '}
                      <InlineLink href="https://supabase.com/docs/guides/platform/ssl-enforcement">
                        SSL Enforcement
                      </InlineLink>{' '}
                      to be disabled during initial setup.
                    </h5>
                    <p className="text-foreground-light">
                      Support for SSL Enforcement will be added in a future update. Once installed,
                      all webhook and sync operations use HTTPS/SSL.
                    </p>
                  </Admonition>

                  <h3 className="heading-default">Configuration</h3>

                  <FormField_Shadcn_
                    control={form.control}
                    name="stripeSecretKey"
                    render={({ field }) => (
                      <FormItemLayout
                        layout="flex-row-reverse"
                        label="Stripe API secret key"
                        description="Your Stripe secret key. Requires write access to Webhook Endpoints and read-only access to all other categories."
                      >
                        <FormControl_Shadcn_ className="col-span-8">
                          <Input
                            id="stripe_api_key"
                            name="stripe_api_key"
                            placeholder="Enter your Stripe API key"
                            autoComplete="stripe-api-key"
                            reveal={false}
                            disabled={isInstallRequested}
                            type="password"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl_Shadcn_>
                      </FormItemLayout>
                    )}
                  />

                  <div className="flex items-center gap-x-2">
                    <Button asChild type="default" icon={<ExternalLink />}>
                      <Link
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://dashboard.stripe.com/apikeys"
                      >
                        Get Stripe API key
                      </Link>
                    </Button>
                    <Button asChild type="default" icon={<ExternalLink />}>
                      <Link
                        target="_blank"
                        rel="noopener noreferrer"
                        href="https://support.stripe.com/questions/what-are-stripe-api-keys-and-how-to-find-them"
                      >
                        What are Stripe API keys?
                      </Link>
                    </Button>
                  </div>

                  {installRequestError && (
                    <Admonition
                      type="destructive"
                      title="Installation failed"
                      description={installRequestError.message}
                    />
                  )}
                </SheetSection>

                <SheetFooter>
                  <Button
                    type="default"
                    disabled={isInstallRequested}
                    onClick={() => handleCloseInstallSheet(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    form={formId}
                    htmlType="submit"
                    type="primary"
                    loading={isInstallRequested}
                    disabled={!form.formState.isValid || isInstallRequested}
                  >
                    {isInstallRequested ? 'Installing' : 'Install'}
                  </Button>
                </SheetFooter>
              </form>
            </Form_Shadcn_>
          </SheetContent>
        </Sheet>

        <ConfirmationModal
          visible={showUninstallModal}
          title="Uninstall Stripe Sync Engine"
          confirmLabel="Uninstall"
          confirmLabelLoading="Uninstalling..."
          variant="destructive"
          loading={isUninstallRequested}
          onCancel={() => setShowUninstallModal(false)}
          onConfirm={handleUninstall}
        >
          <p className="text-sm text-foreground-light">
            Are you sure you want to uninstall the Stripe Sync Engine? This will:
          </p>
          <ul className="list-disc pl-5 mt-2 text-sm text-foreground-light space-y-1">
            <li>
              Remove the <code className="text-code-inline">stripe</code> schema and all tables
            </li>
            <li>Delete all synced Stripe data</li>
            <li>Remove the associated Edge Functions</li>
            <li>Remove the scheduled sync jobs</li>
          </ul>
          <p className="mt-4 text-sm text-foreground-light font-medium">
            This action cannot be undone.
          </p>
        </ConfirmationModal>
      </IntegrationOverviewTab>
    </>
  )
}
