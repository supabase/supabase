import Link from 'next/link'

import { ProjectConfigVariables } from './ProjectConfigVariables'
import {
  AccordionContent_Shadcn_,
  AccordionItem_Shadcn_,
  AccordionTrigger_Shadcn_,
  Accordion_Shadcn_,
} from 'ui'

type MetricsAccessSectionProps = {
  defaultOpen?: boolean
  title?: string
  accordionId?: string
}

const TOKEN_DASHBOARD_URL = 'https://supabase.com/dashboard/account/tokens'
const MANAGEMENT_API_DOC = '/docs/reference/api/management-projects-api-keys-retrieve'
const JWT_SETTINGS_URL = 'https://supabase.com/dashboard/project/sdmizzrivujzvxocsuhw/settings/jwt'

export function MetricsAccessSection({
  defaultOpen = false,
  title = 'Access the Metrics API',
  accordionId = 'metrics-access',
}: MetricsAccessSectionProps) {
  const defaultValue = defaultOpen ? accordionId : undefined

  return (
    <div className="my-6 not-prose">
      <Accordion_Shadcn_
        type="single"
        collapsible
        defaultValue={defaultValue}
        className="rounded-lg border border-foreground/10 bg-surface-100"
      >
        <AccordionItem_Shadcn_ value={accordionId} className="border-0">
          <AccordionTrigger_Shadcn_ className="px-5 py-4 text-left text-base font-medium text-foreground hover:no-underline">
            {title}
          </AccordionTrigger_Shadcn_>
          <AccordionContent_Shadcn_ className="px-5 pb-4">
            <div className="space-y-4 text-sm text-foreground-light">
              <p>
                Every Supabase project exposes a metrics feed at{' '}
                <code>https://&lt;project-ref&gt;.supabase.co/customer/v1/privileged/metrics</code>.
                Replace
                <code>&lt;project-ref&gt;</code> with the identifier from your project URL or from
                the dashboard sidebar.
              </p>

              <ol className="list-decimal space-y-2 pl-5">
                <li>
                  Copy your project reference and confirm the base URL using the helper below.
                  <ProjectConfigVariables variable="url" />
                </li>
                <li>
                  Configure your collector to scrape once per minute. The endpoint already emits the
                  full set of metrics on each request.
                </li>
                <li>
                  Authenticate with HTTP Basic Auth:
                  <ul className="mt-2 list-disc space-y-1 pl-6">
                    <li>
                      <span className="font-medium text-foreground">Username:</span>{' '}
                      <code>service_role</code>
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Password:</span> a service role
                      secret (JWT) from{' '}
                      <Link href={JWT_SETTINGS_URL} target="_blank" rel="noreferrer">
                        Project Settings → JWT (opens in a new tab)
                      </Link>{' '}
                      or any other Secret API key from{' '}
                      <Link
                        href="/dashboard/project/_/settings/api-keys"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Project Settings → API keys (opens in a new tab)
                      </Link>
                      .
                    </li>
                  </ul>
                </li>
              </ol>

              <p>
                Testing locally is as simple as running <code>curl</code> with your service role
                secret:
              </p>

              <pre className="overflow-x-auto rounded border border-foreground/10 bg-muted p-4 text-xs leading-relaxed text-foreground">
                {`curl <project-url>/customer/v1/privileged/metrics \\
  --user 'service_role:sb_secret_...'`}
              </pre>

              <div>
                <p>You can provision long-lived automation tokens in two ways:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>
                    Create an account access token once at{' '}
                    <Link href={TOKEN_DASHBOARD_URL} target="_blank" rel="noreferrer">
                      Account Settings → Access Tokens (opens in a new tab)
                    </Link>{' '}
                    and reuse it wherever you configure observability tooling.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Optional:</span> programmatically
                    exchange an access token for project API keys via the{' '}
                    <Link href={MANAGEMENT_API_DOC} target="_blank" rel="noreferrer">
                      Management API (opens in a new tab)
                    </Link>
                    .
                  </li>
                </ul>
              </div>

              <pre className="overflow-x-auto rounded border border-foreground/10 bg-muted p-4 text-xs leading-relaxed text-foreground">
                {`# (Optional) Exchange an account access token for project API keys
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \\
  "https://api.supabase.com/v1/projects/$PROJECT_REF/api-keys?reveal=true"`}
              </pre>
            </div>
          </AccordionContent_Shadcn_>
        </AccordionItem_Shadcn_>
      </Accordion_Shadcn_>
    </div>
  )
}
