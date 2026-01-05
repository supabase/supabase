import type { StripeSyncInstallWorkflowInput } from './stripe-sync-install.steps'
import {
  deployEdgeFunctions,
  ensureProjectAccess,
  fetchDbConnectionString,
  grantAllTablesToPostgresRole,
  markError,
  markInstallationStarted,
  markInstalled,
  resolvePackageVersion,
  runMigrationsStep,
  scheduleWorker,
  setStripeSecrets,
  setupStripeWebhook,
  validateStripeKey,
} from './stripe-sync-install.steps'

export async function installStripeSyncWorkflow(input: StripeSyncInstallWorkflowInput) {
  'use workflow'

  const version = await resolvePackageVersion(input.packageVersion)
  const supabaseManagementUrl = input.supabaseManagementUrl ?? process.env.NEXT_PUBLIC_API_DOMAIN
  const projectBaseUrl =
    input.baseProjectUrl ?? process.env.NEXT_PUBLIC_CUSTOMER_DOMAIN ?? 'supabase.co'

  try {
    const trimmedStripeKey = await validateStripeKey(input.stripeSecretKey)
    await ensureProjectAccess(
      input.supabaseProjectRef,
      input.supabaseAccessToken,
      supabaseManagementUrl
    )
    await markInstallationStarted(
      input.supabaseProjectRef,
      input.supabaseAccessToken,
      supabaseManagementUrl,
      version
    )
    await deployEdgeFunctions(
      input.supabaseProjectRef,
      input.supabaseAccessToken,
      supabaseManagementUrl,
      version,
      true
    )
    await setStripeSecrets(
      input.supabaseProjectRef,
      input.supabaseAccessToken,
      supabaseManagementUrl,
      trimmedStripeKey
    )
    const databaseUrl = await fetchDbConnectionString(
      input.supabaseProjectRef,
      input.supabaseAccessToken,
      supabaseManagementUrl
    )

    await runMigrationsStep(databaseUrl)

    await grantAllTablesToPostgresRole({
      projectRef: input.supabaseProjectRef,
      accessToken: input.supabaseAccessToken,
      supabaseManagementUrl: supabaseManagementUrl,
    })

    await setupStripeWebhook(
      { ...input, stripeSecretKey: trimmedStripeKey },
      projectBaseUrl,
      databaseUrl
    )
    await scheduleWorker(
      input.supabaseProjectRef,
      input.supabaseAccessToken,
      supabaseManagementUrl,
      projectBaseUrl,
      input.workerIntervalSeconds
    )
    await markInstalled(
      input.supabaseProjectRef,
      input.supabaseAccessToken,
      supabaseManagementUrl,
      version
    )
  } catch (error) {
    try {
      await markError(
        input.supabaseProjectRef,
        input.supabaseAccessToken,
        supabaseManagementUrl,
        version,
        error
      )
    } catch {
      // If comment update fails we still bubble up original error
    }
    throw error
  }
}
