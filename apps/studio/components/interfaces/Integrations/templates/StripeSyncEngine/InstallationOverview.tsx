import { getAccessToken, useParams } from 'common'
import { NavigationItem, PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { useQueuesQuery } from 'data/database-queues/database-queues-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IntegrationOverviewTab } from '../../Integration/IntegrationOverviewTab'
import { useQueuesExposePostgrestStatusQuery } from 'data/database-queues/database-queues-expose-postgrest-status-query'
import {
  Button,
  Form_Shadcn_ as Form,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useState } from 'react'
import Link from 'next/link'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import { Input } from 'ui-patterns/DataInputs/Input'
import { Label } from '@ui/components/shadcn/ui/label'
import { BadgeCheck, ExternalLink, HelpCircle } from 'lucide-react'
import { executeSql } from 'data/sql/execute-sql-query'
import { deployEdgeFunction } from 'data/edge-functions/edge-functions-deploy-mutation'

export const StripeSyncInstallationPage = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const [shouldShowInstallSheet, setShouldShowInstallSheet] = useState(false)
  const [isClosingInstallSheet, setIsClosingInstallSheet] = useState(false)
  const [stripeKey, setStripeKey] = useState('')

  const { data: schemas } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const canInstall = true
  const isInstalled = schemas ? schemas.some(({ name }) => name === 'stripe') : false
  const [installing, setInstalling] = useState(false)

  return (
    <IntegrationOverviewTab
      actions={
        !isInstalled ? (
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
        ) : (
          <div className="flex items-center gap-x-1">
            <BadgeCheck size={14} className="text-brand" />
            <span className=" text-brand text-xs">Installed</span>
          </div>
        )
      }
    >
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
                  setInstalling(true)
                  await fetch('/api/integrations/setup-stripe-sync', {
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
                  setInstalling(false)
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

                    <Button asChild loading={installing} disabled={installing} type="primary">
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
