import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import SubprocessorUpdatesForm from '~/components/SubprocessorUpdatesForm'
import { Download } from 'lucide-react'
import { NextSeo } from 'next-seo'
import { Button } from 'ui'

/**
 * TO UPDATE THE SUBPROCESSOR LIST:
 * 1. Drop the new dated PDF into `apps/www/public/legal/subprocessor-list/`
 *    (filename in `Month-D-YYYY.pdf` format, e.g. `September-1-2026.pdf`).
 * 2. Change the single `CURRENT_PDF` constant below (both `file` and `displayDate`).
 * This constant is the ONLY thing that needs to change on each update.
 */
const CURRENT_PDF = {
  file: 'June-1-2026.pdf',
  displayDate: 'June 1, 2026',
}

const PDF_PATH = `/legal/subprocessor-list/${CURRENT_PDF.file}`

const meta = {
  title: 'Subprocessor List',
  description: 'The list of third-party sub-processors Supabase uses to provide its services.',
}

// NOTE: This page is intentionally HIDDEN for now — it is not linked from the Legal Hub
// index (`pages/legal/index.tsx`) or any navigation. It is also marked noindex/nofollow
// so search engines do not index it while it is in draft. Remove `noindex`/`nofollow` and
// add a link from the Legal Hub index when Legal is ready to publish it.
export default function SubprocessorListPage() {
  return (
    <DefaultLayout>
      <NextSeo {...meta} noindex nofollow />
      <PageHeader
        breadcrumb={
          <PageBreadcrumb
            items={[
              { label: 'Legal', href: '/legal' },
              { label: 'Customer Legal Resources', href: '/legal#customer-legal-resources' },
            ]}
          />
        }
        h1="Subprocessor List"
        subheader="The third-party sub-processors Supabase engages to help provide its services. This list is updated as our sub-processors change."
      />
      <SectionContainer className="prose">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="mt-0 mb-0">Current sub-processors</h2>
            <span className="text-sm text-foreground-lighter">
              Effective {CURRENT_PDF.displayDate}
            </span>
          </div>

          <p className="mt-0">
            Review the current list of Supabase sub-processors below, or{' '}
            <a href={PDF_PATH} target="_blank" rel="noopener noreferrer">
              download the PDF
            </a>
            .
          </p>

          <div className="not-prose">
            <Button asChild variant="default" icon={<Download />}>
              <a href={PDF_PATH} download target="_blank" rel="noopener noreferrer">
                Download PDF ({CURRENT_PDF.displayDate})
              </a>
            </Button>
          </div>

          {/* Inline PDF preview. Download link above is the accessible fallback. */}
          <div className="not-prose w-full overflow-hidden rounded-lg border bg-surface-75">
            <iframe
              src={PDF_PATH}
              title={`Supabase Subprocessor List (${CURRENT_PDF.displayDate})`}
              className="h-[70vh] w-full"
            />
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start gap-4">
          <SubprocessorUpdatesForm />
        </div>
      </SectionContainer>
    </DefaultLayout>
  )
}
