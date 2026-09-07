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
        The Explorer is a new unified workspace for querying your data and chatting with the
        Assistant, and is an early preview of where we're heading with the SQL Editor.
      </p>
      <p className="text-sm text-foreground-light">
        Notebooks are the first new feature of the Explorer — mix query cells and markdown notes in
        a single document, so your queries and context stay together. Use them to write runbooks,
        document incidents, build reusable reports, and more!
      </p>

      <Image
        src={`${BASE_PATH}/img/previews/explorer-preview.png`}
        width={1296}
        height={900}
        alt="explorer-preview"
        className="rounded-sm border"
      />

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
