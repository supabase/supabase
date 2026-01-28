import Image from 'next/image'

import { BASE_PATH } from 'lib/constants'

export const QueueOperationsPreview = () => {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground-light text-sm mb-4">
        Queue your table edits and review all pending changes before saving them to your database.
        This gives you more control over when changes are committed, allowing you to batch multiple
        edits and review them together.
      </p>
      <div className="bg-yellow-300/15 border-l-4 border-yellow-500 p-3 text-yellow-1100 text-sm rounded mb-2">
        <strong>Note:</strong> We are currently working to add all CRUD operations to the queue.
        Right now, only cell edits are supported.
      </div>
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
