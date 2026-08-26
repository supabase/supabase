import { TroubleshootingPreview } from '~/features/docs/Troubleshooting.ui'
import {
  TroubleshootingFilter,
  TroubleshootingFilterEmptyState,
  TroubleshootingListController,
} from '~/features/docs/Troubleshooting.ui.client'
import {
  getAllTroubleshootingEntries,
  getAllTroubleshootingErrors,
  getAllTroubleshootingKeywords,
  getAllTroubleshootingProducts,
} from '~/features/docs/Troubleshooting.utils'
import { TROUBLESHOOTING_CONTAINER_ID } from '~/features/docs/Troubleshooting.utils.shared'
import { SidebarSkeleton } from '~/layouts/MainSkeleton'
import { PROD_URL } from '~/lib/constants'
import { getCustomContent } from '~/lib/custom-content/getCustomContent'
import { mdAlternate } from '~/lib/md-alternates'
import { type Metadata } from 'next'
import Link from 'next/link'
import { Admonition } from 'ui-patterns/Admonition'

const { metadataTitle } = getCustomContent(['metadata:title'])

export default async function GlobalTroubleshootingPage() {
  const troubleshootingEntries = await getAllTroubleshootingEntries()
  const keywords = await getAllTroubleshootingKeywords()
  const products = await getAllTroubleshootingProducts()
  const errors = await getAllTroubleshootingErrors()

  return (
    <SidebarSkeleton hideSideNav className="w-full max-w-(--breakpoint-lg) mx-auto">
      <div className="py-8 px-5">
        <h1 className="text-4xl tracking-tight mb-7">Troubleshooting</h1>
        <p className="text-lg text-foreground-light">
          Search or browse our troubleshooting guides for solutions to common Supabase issues.
        </p>
        <p className="text-foreground-light mt-4">
          Don&apos;t have a specific error yet? Start with{' '}
          <Link
            href="/docs/guides/observability/detecting"
            className="text-brand-link hover:underline"
          >
            Detecting
          </Link>{' '}
          to pick up a signal first. If you already have one, confirm one cause before you change
          anything:
        </p>
        <ol className="list-decimal list-outside pl-5 text-foreground-light mt-4 space-y-1">
          <li>
            Capture the exact HTTP status, error code, and message. A <code>401</code> is not a{' '}
            <code>403</code>; <code>PGRST002</code> is not <code>PGRST106</code>. If you use{' '}
            <code>supabase-js</code>, errors are returned in <code>{'{ data, error }'}</code>, not
            thrown. Inspect <code>error</code>; ignoring it hides the failure.
          </li>
          <li>
            Query the{' '}
            <Link
              href="/docs/guides/observability/advanced-log-filtering#logs-explorer"
              className="text-brand-link hover:underline"
            >
              log source
            </Link>{' '}
            for that layer. When two layers could fit, start closer to the database.
          </li>
          <li>
            Search below for that error. Each article confirms one cause, applies one fix, and tells
            you how to verify it.
          </li>
          <li>
            Re-run the failing operation. Keep the change only when the original symptom is gone. If
            verification fails, reverse the change and look again.
          </li>
        </ol>
        <p className="text-foreground-light mt-4">
          For client-side or local debugging, see{' '}
          <Link
            href="/docs/guides/auth/debugging/error-codes"
            className="text-brand-link hover:underline"
          >
            Auth error codes
          </Link>
          ,{' '}
          <Link
            href="/docs/guides/storage/debugging/logs"
            className="text-brand-link hover:underline"
          >
            Storage logs
          </Link>
          , and{' '}
          <Link
            href="/docs/guides/functions/debugging-tools"
            className="text-brand-link hover:underline"
          >
            Edge Functions debugging tools
          </Link>
          .
        </p>
        <Admonition type="danger" className="mt-4">
          Deleting data, disabling row-level security, weakening a policy, or terminating a database
          process can cause data loss or a security incident. Do not let an automated routine
          perform these changes.
        </Admonition>
        <p className="text-foreground-light mt-4">
          Escalate to{' '}
          <Link href="/dashboard/support/new" className="text-brand-link hover:underline">
            Support
          </Link>{' '}
          when you cannot access the diagnostic source, the evidence points to a platform failure,
          or a safe fix needs a permission you do not have. Include the project reference, timestamp
          with time zone, error code, request ID, and sanitized evidence. Do not include passwords,
          API keys, or personal data.
        </p>
        <hr className="my-7" aria-hidden />
        <TroubleshootingFilter
          keywords={keywords}
          products={products}
          errors={errors}
          className="mb-8"
        />
        <TroubleshootingListController />
        <TroubleshootingFilterEmptyState />
        <div id={TROUBLESHOOTING_CONTAINER_ID} className="@container/troubleshooting">
          <h2 className="sr-only">Matching troubleshooting entries</h2>
          <ul className="grid @4xl/troubleshooting:grid-cols-[78%_15%_7%]">
            {troubleshootingEntries.map((entry) => (
              <li
                key={entry.data.database_id}
                className="grid grid-cols-subgrid @4xl/troubleshooting:col-span-3"
              >
                <TroubleshootingPreview entry={entry} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SidebarSkeleton>
  )
}

export const metadata: Metadata = {
  title: `${metadataTitle || 'Supabase'} | Troubleshooting`,
  alternates: {
    canonical: `${PROD_URL}/guides/troubleshooting`,
    types: mdAlternate('troubleshooting'),
  },
}
