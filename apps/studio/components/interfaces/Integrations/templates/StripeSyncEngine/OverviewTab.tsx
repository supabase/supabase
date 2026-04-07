import { zodResolver } from '@hookform/resolvers/zod'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useFlag } from 'common'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
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
import { IntegrationOverviewTabV2 } from '../../Integration/IntegrationOverviewTabV2'
import { InstallationError } from './InstallationError'
import { IntegrationInstalledActions, IntegrationNotInstalledActions } from './IntegrationActions'
import { StatusDisplay } from './StatusDisplay'
import {
  canInstall as checkCanInstall,
  hasInstallError,
  hasUninstallError,
  isInstallDone,
  isInstalled,
  isInstalling,
  isUninstallDone,
  isUninstalling,
} from './stripe-sync-status'
import { StripeSyncChangesCard } from './StripeSyncChangesCard'
import { useStripeSyncStatus } from '@/components/interfaces/Integrations/templates/StripeSyncEngine/useStripeSyncStatus'
import { useStripeSyncInstallMutation } from '@/data/database-integrations/stripe/stripe-sync-install-mutation'
import { useStripeSyncUninstallMutation } from '@/data/database-integrations/stripe/stripe-sync-uninstall-mutation'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'

const installFormSchema = z.object({
  stripeSecretKey: z.string().min(1, 'Stripe API key is required'),
})

export const StripeSyncEngineOverviewTab = () => {
  const track = useTrack()
  const hasTrackedInstallFailed = useRef(false)
  const { data: project } = useSelectedProjectQuery()
  const isMarketplaceEnabled = useFlag('marketplaceIntegrations')

  const [showUninstallModal, setShowUninstallModal] = useState(false)
  const [shouldShowInstallSheet, setShouldShowInstallSheet] = useState(false)
  // These flags bridge the gap between mutation success and schema update
  const [isInstallInitiated, setIsInstallInitiated] = useState(false)
  const [isUninstallInitiated, setIsUninstallInitiated] = useState(false)

  const formId = 'stripe-sync-install-form'
  const form = useForm<z.infer<typeof installFormSchema>>({
    resolver: zodResolver(installFormSchema),
    defaultValues: { stripeSecretKey: '' },
    mode: 'onSubmit',
  })

  const {
    schemaComment,
    schemaComment: { status: installationStatus },
    latestAvailableVersion,
    timedOut,
  } = useStripeSyncStatus()

  // Check permissions for managing function secrets
  const { can: canManageSecrets } = useAsyncCheckPermissions(
    PermissionAction.FUNCTIONS_SECRET_WRITE,
    '*'
  )

  const installed = isInstalled(installationStatus)
  const installError = hasInstallError(installationStatus)
  const uninstallError = hasUninstallError(installationStatus)
  const installInProgress = isInstalling(installationStatus)
  const uninstallInProgress = isUninstalling(installationStatus)
  const installDone = isInstallDone(installationStatus)
  const uninstallDone = isUninstallDone(installationStatus)

  // Detect if this is an upgrade (both old and new versions present)
  let oldVersion
  let newVersion
  if (installed) {
    // when installed we compare the installed version against the latest available
    oldVersion = schemaComment?.newVersion
    newVersion = latestAvailableVersion
  } else {
    // otherwise compare the old and new versions from the schema
    oldVersion = schemaComment?.oldVersion
    newVersion = schemaComment?.newVersion
  }

  const upgradeAvailable = !!(oldVersion && newVersion && oldVersion !== newVersion)
  const upgradeDone = latestAvailableVersion == schemaComment?.newVersion

  const {
    mutate: installStripeSync,
    isPending: isInstallRequested,
    error: installRequestError,
    reset: resetInstallError,
  } = useStripeSyncInstallMutation({
    onSuccess: () => {
      toast.success(
        upgradeAvailable ? 'Stripe Sync upgrade started' : 'Stripe Sync installation started'
      )
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
  const installing = (installInProgress || isInstallRequested || isInstallInitiated) && !timedOut
  const uninstalling =
    (uninstallInProgress || isUninstallRequested || isUninstallInitiated) && !timedOut
  const canInstall = checkCanInstall(installationStatus) && !installed && !installing

  const hasError = (uninstallError || installError) && ((!uninstalling && !installing) || timedOut)

  // Poll for schema changes during transitions
  useSchemasQuery(
    { projectRef: project?.ref, connectionString: project?.connectionString },
    { refetchInterval: installing || uninstalling ? 5000 : false }
  )

  const handleUninstall = useCallback(() => {
    if (!project?.ref) return

    uninstallStripeSync({
      projectRef: project.ref,
      startTime: Date.now(),
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

  // Clear install initiated flag once schema reflects successful completion
  // For errors, the flag is cleared when user manually retries (handleOpenInstallSheet)
  useEffect(() => {
    if (isInstallInitiated && installDone && upgradeDone && !installError) {
      setIsInstallInitiated(false)
    }
  }, [isInstallInitiated, installDone, upgradeDone, installError])

  // Clear uninstall initiated flag once schema is removed or error
  useEffect(() => {
    if (isUninstallInitiated && uninstallDone) {
      setIsUninstallInitiated(false)
    }
  }, [isUninstallInitiated, uninstallDone])

  return (
    <>
      {isMarketplaceEnabled ? (
        <IntegrationOverviewTabV2>
          {hasError && (
            <InstallationError
              error={uninstallError ? 'uninstall' : 'install'}
              handleUninstall={handleUninstall}
              handleOpenInstallSheet={handleOpenInstallSheet}
              isUpgrade={upgradeAvailable}
              installing={installing}
              uninstalling={uninstalling}
            />
          )}

          {!installed && !uninstalling && !uninstallError ? (
            <IntegrationNotInstalledActions
              hideInstallCTA
              installing={installing}
              canInstall={canInstall}
              isUninstallRequested={isUninstallRequested}
              handleUninstall={handleUninstall}
              setShouldShowInstallSheet={setShouldShowInstallSheet}
            />
          ) : (
            (installed || uninstalling || uninstallError) && (
              <IntegrationInstalledActions
                disabled={installing || uninstalling || !canManageSecrets}
                upgradeAvailable={upgradeAvailable}
                installing={installing}
                uninstalling={uninstalling}
                isUninstallRequested={isUninstallRequested}
                setShouldShowInstallSheet={setShouldShowInstallSheet}
                setShowUninstallModal={setShowUninstallModal}
              />
            )
          )}
        </IntegrationOverviewTabV2>
      ) : (
        <IntegrationOverviewTab
          alert={
            hasError ? (
              <InstallationError
                error={uninstallError ? 'uninstall' : 'install'}
                handleUninstall={handleUninstall}
                handleOpenInstallSheet={handleOpenInstallSheet}
                isUpgrade={upgradeAvailable}
                installing={installing}
                uninstalling={uninstalling}
              />
            ) : null
          }
          status={
            <StatusDisplay
              status={installationStatus}
              isInstallRequested={isInstallRequested}
              isInstallInitiated={isInstallInitiated}
              isUninstallRequested={isUninstallRequested}
              isUninstallInitiated={isUninstallInitiated}
              isUpgrade={upgradeAvailable}
              timedOut={timedOut}
            />
          }
          actions={
            !installed && !uninstalling && !uninstallError ? (
              <>
                <StripeSyncChangesCard
                  installationStatus={installationStatus}
                  isUpgrade={upgradeAvailable}
                />
                <IntegrationNotInstalledActions
                  className="mt-4"
                  installing={installing}
                  canInstall={canInstall}
                  isUninstallRequested={isUninstallRequested}
                  handleUninstall={handleUninstall}
                  setShouldShowInstallSheet={setShouldShowInstallSheet}
                />
              </>
            ) : installed || uninstalling || uninstallError ? (
              <>
                <StripeSyncChangesCard
                  installationStatus={installationStatus}
                  isUpgrade={upgradeAvailable}
                />
                <IntegrationInstalledActions
                  className="mt-4"
                  disabled={installing || uninstalling || !canManageSecrets}
                  upgradeAvailable={upgradeAvailable}
                  installing={installing}
                  uninstalling={uninstalling}
                  isUninstallRequested={isUninstallRequested}
                  setShouldShowInstallSheet={setShouldShowInstallSheet}
                  setShowUninstallModal={setShowUninstallModal}
                />
              </>
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
                    installStripeSync({
                      projectRef: project.ref,
                      stripeSecretKey,
                      startTime: Date.now(),
                    })
                  })}
                  className="overflow-auto flex-grow px-0 flex flex-col"
                >
                  <SheetHeader>
                    <SheetTitle>
                      {upgradeAvailable ? 'Upgrade' : 'Install'} Stripe Sync Engine
                    </SheetTitle>
                  </SheetHeader>
                  <SheetSection className="flex-1 flex flex-col gap-y-6">
                    <StripeSyncChangesCard
                      installationStatus={installationStatus}
                      isUpgrade={upgradeAvailable}
                    />

                    <h3 className="heading-default">Configuration</h3>

                    <div className="flex flex-col gap-y-2">
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
                      {isInstallRequested
                        ? upgradeAvailable
                          ? 'Upgrading'
                          : 'Installing'
                        : upgradeAvailable
                          ? 'Upgrade integration'
                          : 'Install integration'}
                    </Button>
                  </SheetFooter>
                </form>
              </Form_Shadcn_>
            </SheetContent>
          </Sheet>
        </IntegrationOverviewTab>
      )}
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
    </>
  )
}
