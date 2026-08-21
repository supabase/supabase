import { ExternalLink, GitPullRequest } from 'lucide-react'

import { Confirm } from './Confirm'
import type { ConfirmFooterApprovalState } from './Confirm.utils'

export function PullRequestRenderer({
  title,
  body,
  patch,
  url,
  number,
  confirmState,
  onApprove,
  onDeny,
}: {
  title: string
  body?: string
  patch: string
  url?: string
  number?: number
  confirmState?: ConfirmFooterApprovalState
  onApprove?: () => void
  onDeny?: () => void
}) {
  return (
    <Confirm
      className="my-4"
      state={confirmState}
      message="Assistant wants to open this pull request"
      cancelLabel="Skip"
      confirmLabel="Open PR"
      confirmLabelLoading="Opening..."
      onCancel={onDeny}
      onConfirm={onApprove}
    >
      <div className="space-y-2 bg-surface-100 p-4">
        <div className="flex items-start gap-2">
          <GitPullRequest size={16} className="mt-0.5 shrink-0 text-foreground-light" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{title}</p>
            {body && (
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground-light">{body}</p>
            )}
          </div>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-brand-link hover:underline"
          >
            View pull request{number ? ` #${number}` : ''} <ExternalLink size={12} />
          </a>
        )}
        {!url && (
          <pre className="max-h-64 overflow-auto rounded border bg-surface-200 p-3 text-xs text-foreground-light">
            {patch}
          </pre>
        )}
      </div>
    </Confirm>
  )
}
