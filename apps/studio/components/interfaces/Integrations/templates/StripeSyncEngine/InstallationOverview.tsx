import { zodResolver } from '@hookform/resolvers/zod'
import { useStripeSyncInstallMutation } from 'data/database-integrations/stripe/stripe-sync-install-mutation'
import { useStripeSyncUninstallMutation } from 'data/database-integrations/stripe/stripe-sync-uninstall-mutation'
import { useStripeSyncingState } from 'data/database-integrations/stripe/sync-state-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { formatRelative } from 'date-fns'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTrack } from 'lib/telemetry/track'
import { AlertCircle, BadgeCheck, Check, ExternalLink, RefreshCwIcon } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  INSTALLATION_ERROR_SUFFIX,
  INSTALLATION_INSTALLED_SUFFIX,
  INSTALLATION_STARTED_SUFFIX,
  STRIPE_SCHEMA_COMMENT_PREFIX,
} from 'stripe-experiment-sync/supabase'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
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

const installFormSchema = z.object({
  stripeSecretKey: z.string().min(1, 'Stripe API key is required'),
})

export const StripeSyncInstallationPage = () => {
  const { data: project } = useSelectedProjectQuery()
  const track = useTrack()
  const hasTrackedInstallFailed = useRef(false)

  const [shouldShowInstallSheet, setShouldShowInstallSheet] = useState(false)
  const [isInstallInitiated, setIsInstallInitiated] = useState(false)

  const formId = 'stripe-sync-install-form'
  const form = useForm<z.infer<typeof installFormSchema>>({
    resolver: zodResolver(installFormSchema),
    defaultValues: {
      stripeSecretKey: '',
    },
    mode: 'onSubmit',
  })

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

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
      },
    }
  )

  const stripeSchema = schemas?.find((s) => s.name === 'stripe')

  // Determine installation status from schema description
  const isInstalled =
    stripeSchema &&
    stripeSchema.comment?.startsWith(STRIPE_SCHEMA_COMMENT_PREFIX) &&
    stripeSchema.comment.includes(INSTALLATION_INSTALLED_SUFFIX)

  const schemaShowsInProgress =
    stripeSchema &&
    stripeSchema.comment?.startsWith(STRIPE_SCHEMA_COMMENT_PREFIX) &&
    stripeSchema.comment?.includes(INSTALLATION_STARTED_SUFFIX)

  const setupInProgress = schemaShowsInProgress || isInstalling || isInstallInitiated

  const setupError =
    stripeSchema &&
    stripeSchema.comment?.startsWith(STRIPE_SCHEMA_COMMENT_PREFIX) &&
    stripeSchema.comment?.includes(INSTALLATION_ERROR_SUFFIX)

  useEffect(() => {
    if (!setupError) {
      hasTrackedInstallFailed.current = false
      return
    }

    if (!hasTrackedInstallFailed.current) {
      hasTrackedInstallFailed.current = true
      // This isn't ideal because it will fire on every page load while in error state
      // in the future we should connect this in the backend to track accurately
      track('integration_install_failed', {
        integrationName: 'stripe_sync_engine',
      })
    }
  }, [setupError, track])

  useEffect(() => {
    // Clear the install initiated flag once we detect completion or error from the schema
    if (isInstallInitiated && (isInstalled || setupError)) {
      setIsInstallInitiated(false)
    }
  }, [isInstallInitiated, isInstalled, setupError])

  // Check if there's an existing stripe schema that wasn't created by this integration
  const hasConflictingSchema =
    stripeSchema && !stripeSchema.comment?.startsWith(STRIPE_SCHEMA_COMMENT_PREFIX)

  const canInstall = !hasConflictingSchema && !isInstalled && !setupInProgress

  // Sync state query - only enabled when installed
  const { data: syncState } = useStripeSyncingState(
    {
      projectRef: project?.ref!,
      connectionString: project?.connectionString,
    },
    {
      refetchInterval: 4000,
      enabled: !!isInstalled,
    }
  )

  // Poll for schema changes during installation
  useSchemasQuery(
    {
      projectRef: project?.ref,
      connectionString: project?.connectionString,
    },
    {
      refetchInterval: setupInProgress ? 5000 : false,
    }
  )

  const isSyncing = !!syncState && !syncState.closed_at && syncState.status === 'running'

  const handleUninstall = () => {
    if (!project?.ref) return

    uninstallStripeSync({
      projectRef: project.ref,
    })
  }

  const handleOpenInstallSheet = () => {
    resetInstallError()
    setShouldShowInstallSheet(true)
  }

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

    if (syncState) {
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
    setupError,
    setupInProgress,
    syncState,
    isSyncing,
    isUninstalling,
    handleOpenInstallSheet,
    handleUninstall,
  ])

  const status = useMemo(() => {
    if (isInstalled) {
      return (
        <span className="flex items-center gap-2 text-foreground-light text-sm">
          <Check size={14} strokeWidth={1.5} className="text-brand" /> Installed
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
    if (syncState) {
      return (
        <span className="flex items-center gap-2 text-foreground-light text-sm">
          <RefreshCwIcon size={14} className="animate-spin text-foreground-lighter" />
          Sync in progress...
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
    return (
      <span className="flex items-center gap-2 text-foreground-light text-sm">Not installed</span>
    )
  }, [isInstalled, setupInProgress, syncState, setupError])

  return (
    <IntegrationOverviewTab
      alert={alert}
      status={status}
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
                      description="Used to fetch your Stripe configuration and set up syncing."
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
