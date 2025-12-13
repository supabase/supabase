import { getAccessToken, useParams } from 'common'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IntegrationOverviewTab } from '../../Integration/IntegrationOverviewTab'
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from 'ui'
import { Admonition } from 'ui-patterns'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useState } from 'react'
import Link from 'next/link'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { Input } from 'ui-patterns/DataInputs/Input'
import { Label } from '@ui/components/shadcn/ui/label'
import { BadgeCheck, ExternalLink, HelpCircle, RefreshCwIcon } from 'lucide-react'
import { useStripeSyncingState } from 'data/database-integrations/stripe/sync-state-query'
import { formatRelative } from 'date-fns'
import {
  STRIPE_SCHEMA_COMMENT_PREFIX,
  INSTALLATION_INSTALLED_SUFFIX,
  INSTALLATION_STARTED_SUFFIX,
  INSTALLATION_ERROR_SUFFIX,
} from 'stripe-experiment-sync/supabase'

export const StripeSyncInstallationPage = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [shouldShowInstallSheet, setShouldShowInstallSheet] = useState(false)
  const [stripeKey, setStripeKey] = useState('')

  const { data: schemas, refetch: refetchSchemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const canInstall = true
  const stripeSchema = schemas?.find((s) => s.name === 'stripe')
  const isInstalled =
    stripeSchema &&
    stripeSchema.description?.startsWith(STRIPE_SCHEMA_COMMENT_PREFIX) &&
    stripeSchema.description.includes(INSTALLATION_INSTALLED_SUFFIX)

  const setupInProgress =
    stripeSchema &&
    stripeSchema.description?.startsWith(STRIPE_SCHEMA_COMMENT_PREFIX) &&
    stripeSchema.description?.startsWith(INSTALLATION_STARTED_SUFFIX)

  const setupError =
    stripeSchema &&
    stripeSchema.description?.startsWith(STRIPE_SCHEMA_COMMENT_PREFIX) &&
    stripeSchema.description?.includes(INSTALLATION_ERROR_SUFFIX)

  const [isStartingInstall, setIsStartingInstall] = useState(false)
  console.log({
    canInstall,
    isInstalled,
    setupInProgress,
    setupError,
  })
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

  const isSyncing = !!syncState && !syncState.closed_at

  return (
    <IntegrationOverviewTab
      actions={
        !isInstalled && !setupInProgress && !setupError ? (
          <Admonition
            type="default"
            title="Installing Stripe Sync Engine will make the following changes to your Supabase project:"
          >
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Creates a new database schema named <code>stripe</code>
              </li>
              <li>
                Creates multiple tables and views in the <code>stripe</code> schema to store and
                manage synced Stripe data
              </li>
              <li>Deploys Edge Functions to handle incoming webhooks from Stripe</li>
              <li>
                Sets up scheduled jobs using Supabase Queues to periodically sync data from your
                Stripe account to your database
              </li>
            </ul>
            <ButtonTooltip
              type="primary"
              className="my-2"
              onClick={() => setShouldShowInstallSheet(true)}
              disabled={!canInstall}
              tooltip={{
                content: {
                  text: !canInstall
                    ? 'Your database already uses a schema named "stripe"'
                    : undefined,
                },
              }}
            >
              Install
            </ButtonTooltip>
          </Admonition>
        ) : // <div className="flex items-center gap-x-1">
        //   <BadgeCheck size={14} className="text-brand" />
        //   <span className=" text-brand text-xs">Installed</span>
        // </div>
        null
      }
    >
      {setupError && (
        <div className="px-10 max-w-4xl">
          <Admonition type="destructive" showIcon={true} title="Installation Error">
            <div>
              There was an error during the installation of the Stripe Sync Engine. Please try
              reinstalling the integration. If the problem persists, contact support.
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShouldShowInstallSheet(true)
                }}
              >
                Try Again
              </Button>
              <Button type="warning">Uninstall</Button>
            </div>
          </Admonition>
        </div>
      )}
      {setupInProgress && (
        <div className="px-10 max-w-4xl">
          <Admonition type="default" showIcon={false}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 animate-pulse">
                <RefreshCwIcon size={14} />
                <div>Installation in progress...</div>
              </div>
            </div>
          </Admonition>
        </div>
      )}
      {syncState && (
        <div className="px-10 max-w-4xl">
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
                  </div>
                  <div className="text-foreground-light text-sm">
                    Last synced {formatRelative(new Date(syncState.closed_at!), new Date())}
                  </div>
                </>
              )}
            </div>
          </Admonition>
        </div>
      )}
      <Sheet
        open={!!shouldShowInstallSheet}
        onOpenChange={(isOpen) => setShouldShowInstallSheet(isOpen)}
      >
        <SheetContent size="lg" tabIndex={undefined}>
          <SheetHeader>
            <SheetTitle>Install Stripe Sync Engine</SheetTitle>
            <div className="flex-grow overflow-y-auto">
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  setIsStartingInstall(true)
                  const resp = await fetch('/api/integrations/stripe-sync-integration', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${await getAccessToken()}`,
                    },
                    body: JSON.stringify({
                      projectRef: project?.ref,
                      stripeSecretKey: stripeKey,
                    }),
                  })
                  if (resp.ok) {
                    setIsStartingInstall(false)
                    setShouldShowInstallSheet(false)
                    refetchSchemas()
                  } else {
                    setIsStartingInstall(false)
                    // TODO setError state
                  }
                }}
              >
                <FormSection
                  header={<FormSectionLabel>Stripe Syncing Configuration</FormSectionLabel>}
                >
                  <FormSectionContent loading={false}>
                    <Label htmlFor="stripe_api_key">Stripe API Key</Label>
                    <Input
                      id="stripe_api_key"
                      placeholder="Enter your Stripe API key"
                      reveal={false}
                      value={stripeKey}
                      onChange={(e) => setStripeKey(e.target.value)}
                    />
                    <p>
                      <Button asChild type="default" className="w-min" icon={<ExternalLink />}>
                        <Link
                          href="https://dashboard.stripe.com/apikeys"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Get Stripe API
                        </Link>
                      </Button>
                    </p>
                    <p className="text-xs flex gap-1 items-center">
                      <HelpCircle size={12} />
                      <Link
                        href="https://support.stripe.com/questions/what-are-stripe-api-keys-and-how-to-find-them"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        What are Stripe API Keys and How to Find Them?
                      </Link>
                    </p>

                    <Button
                      asChild
                      loading={isStartingInstall}
                      disabled={!stripeKey || isStartingInstall}
                      type="primary"
                    >
                      <button type="submit">Start Installation</button>
                    </Button>
                  </FormSectionContent>
                </FormSection>
              </form>
            </div>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </IntegrationOverviewTab>
  )
}

async function installStripeSyncIntegration() {}
