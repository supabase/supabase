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
      <Image
        src={`${BASE_PATH}/img/previews/explorer-preview.png`}
        width={1296}
        height={900}
        alt="explorer-preview"
        className="rounded-sm border"
      />

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
        <p className="text-sm">Feedback</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>
            How was the transition from SQL Editor to Explorer? What can we do to help ease that
            transition?
          </li>
          <li>
            What do you use Snippets for and how would they translate to Notebooks? What other use
            cases are you using / plan to use Notebooks for?
          </li>
          <li>
            How has Notebooks or interacting with the Assistant changed your approach to
            observability/debugging? Does chatting with your logs feel natural? What can we improve?
          </li>
        </ul>
      </div>
    </div>
  )
}
