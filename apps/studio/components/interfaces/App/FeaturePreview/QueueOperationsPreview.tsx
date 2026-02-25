import { useParams } from 'common'
import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

import { InlineLink } from '@/components/ui/InlineLink'

export const QueueOperationsPreview = () => {
  const { ref = '_' } = useParams()

  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground-light text-sm mb-4">
        Queue your table edits in the{' '}
        <InlineLink href={`/project/${ref}/editor`}>Table Editor</InlineLink> and review all pending
        changes before saving them to your database. This gives you more control over when changes
        are committed, allowing you to batch multiple edits and review them together.
      </p>
      <Image
        src={`${BASE_PATH}/img/previews/queue-operations-table-preview.png`}
        width={1296}
        height={900}
        alt="queue-operations-preview"
        className="rounded border"
      />
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Queue cell edits in the Table Editor instead of saving them immediately</li>
          <li>Show a panel to review all pending changes before committing them</li>
          <li>Allow you to cancel individual changes or save all changes at once</li>
        </ul>
      </div>
    </div>
  )
}
