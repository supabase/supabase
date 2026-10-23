import dayjs from 'dayjs'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { IssueActorAvatar } from './IssueActorAvatar'
import { IssueDocumentView } from './IssueDocumentView'
import { getActorDescription } from './Issues.utils'
import type { IssueActor, IssueDocument } from '@/data/issues/issue-schema'

export const IssuePost = ({
  id,
  actor,
  createdAt,
  document,
}: {
  id: string
  actor: IssueActor
  createdAt: string
  document: IssueDocument
}) => (
  <div className="relative pl-9">
    <div className="min-w-0 rounded-md border bg-muted">
      <div className="relative flex flex-wrap items-center gap-2 border-b px-4 py-3 text-sm">
        <div className="absolute -left-9 top-1/2 -translate-y-1/2">
          <IssueActorAvatar actor={actor} />
        </div>
        <span className="min-w-0 flex-1 text-foreground">{getActorDescription(actor)}</span>
        <TimestampInfo
          className="shrink-0 text-sm text-foreground-lighter"
          utcTimestamp={createdAt}
          label={dayjs(createdAt).fromNow()}
        />
      </div>
      <div className="overflow-hidden rounded-b-md p-4">
        <IssueDocumentView id={id} document={document} />
        {document.cells.length === 0 && (
          <p className="text-sm text-foreground-lighter">No description provided.</p>
        )}
      </div>
    </div>
  </div>
)
