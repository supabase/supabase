import { useParams } from 'common'
import Image from 'next/image'

import { useIsExplorerEnabled } from './FeaturePreviewContext'
import { InlineLink } from '@/components/ui/InlineLink'
import { BASE_PATH } from '@/lib/constants'

export const ExplorerPreview = () => {
  const { ref } = useParams()
  const isExplorerEnabled = useIsExplorerEnabled()

  return (
    <div className="flex flex-col gap-y-4">
      <p className="text-sm text-foreground-light">
        The Explorer is a unified workspace for interacting with your database and logs via SQL,
        chat and a new feature we are calling Notebooks.{' '}
        <InlineLink
          href={isExplorerEnabled ? `/project/${ref}/explorer` : `/project/${ref}/sql/new`}
        >
          Explorer
        </InlineLink>{' '}
        is an evolution of the SQL Editor and will replace it when the flag is enabled.
      </p>

      <Image
        src={`${BASE_PATH}/img/previews/explorer-preview.png`}
        width={1296}
        height={900}
        alt="explorer-preview"
        className="rounded-sm border"
      />

      <p className="text-sm text-foreground-light">
        Notebooks aim to replace Snippets and Custom Reports. They can contain one or many SQL
        queries with surrounding markdown content. You can query both your own database and project
        logs which means they can be used for observability, growth tracking, recurring tasks that
        need extra context etc. They can be managed and run in Studio as well as by the Supabase
        Assistant and later your own agent via code or MCP. Snippets are <em>not</em> visible in
        Explorer, we are instead looking at a migration path from Snippets -&gt; Notebooks if
        needed.
      </p>
      <p className="text-sm text-foreground-light">
        Explorer is a glimpse at a future where reports and insights are generated on demand,
        personalized to your needs, with Notebooks being the first primitive.
      </p>

      <div className="space-y-2">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            Replace the existing SQL Editor with the new{' '}
            <InlineLink
              href={isExplorerEnabled ? `/project/${ref}/explorer` : `/project/${ref}/sql/new`}
            >
              Explorer
            </InlineLink>
            .
            <ul className="list-disc pl-6 text-sm text-foreground-light">
              <li>
                We're looking to replace the SQL Editor with the Explorer in the long term, but for
                now it lives alongside the SQL Editor, toggleable via this feature preview.
              </li>
            </ul>
          </li>
          <li>Enable managing of Notebooks through both the dashboard and the Assistant.</li>
        </ul>
      </div>
    </div>
  )
}
