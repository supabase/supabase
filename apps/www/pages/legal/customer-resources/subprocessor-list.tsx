import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import SubprocessorUpdatesForm from '~/components/SubprocessorUpdatesForm'
import { FileText } from 'lucide-react'
import { NextSeo } from 'next-seo'
import { Badge } from 'ui'

/**
 * TO ADD A NEW SUBPROCESSOR LIST VERSION:
 * 1. Drop the new dated PDF into `apps/www/public/legal/subprocessor-list/`
 *    (filename in `Month-D-YYYY.pdf` format, e.g. `December-1-2026.pdf`).
 * 2. Add a new entry (`file` and `displayDate`) at the TOP of `SUBPROCESSOR_LIST_VERSIONS`.
 * Keep the list newest first. Earlier versions stay listed, one download button each.
 */
const SUBPROCESSOR_LIST_VERSIONS = [
  {
    file: 'October-12-2026.pdf',
    displayDate: 'October 12, 2026',
  },
  {
    file: 'June-1-2026.pdf',
    displayDate: 'June 1, 2026',
  },
]

const PDF_BASE_PATH = '/legal/subprocessor-list'

const meta = {
  title: 'Subprocessor List',
  description: 'The list of third-party sub-processors Supabase uses to provide its services.',
}

export default function SubprocessorListPage() {
  return (
    <DefaultLayout>
      <NextSeo {...meta} />
      <PageHeader
        breadcrumb={
          <PageBreadcrumb
            items={[
              { label: 'Legal', href: '/legal' },
              { label: 'Privacy Resources', href: '/legal#privacy-resources' },
            ]}
          />
        }
        h1="Subprocessor List"
        subheader="The third-party sub-processors Supabase engages to help provide its services are indicated in the latest linked Subprocessor List available below. This page is updated with an updated Subprocessor List as our sub-processors change. You can subscribe to receive notifications of updates to this page, below."
      />
      <SectionContainer className="prose">
        <div className="divide-y divide-border">
          {SUBPROCESSOR_LIST_VERSIONS.map(({ file, displayDate }) => (
            <div key={file} className="flex items-center gap-3 py-4">
              <FileText size={15} className="shrink-0 text-foreground-muted" />
              <a
                href={`${PDF_BASE_PATH}/${file}`}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground-light transition-colors hover:text-foreground hover:underline"
              >
                Subprocessor List
              </a>
              <Badge>Updated {displayDate}</Badge>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start gap-4">
          <SubprocessorUpdatesForm />
        </div>
      </SectionContainer>
    </DefaultLayout>
  )
}
