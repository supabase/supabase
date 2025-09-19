import { Pencil, Trash2 } from 'lucide-react'
import { type PropsWithChildren } from 'react'

import { ButtonTooltip } from '../ButtonTooltip'

export function MessageActions({ children }: PropsWithChildren<{}>) {
  return (
    <div className="flex items-center gap-4 mt-2 mb-1">
      <span className="h-0.5 w-5 bg-muted" />
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">{children}</div>
    </div>
  )
}
function MessageActionsEdit({ onClick, tooltip }: { onClick: () => void; tooltip: string }) {
  return (
    <ButtonTooltip
      type="text"
      icon={<Pencil size={14} strokeWidth={1.5} />}
      onClick={onClick}
      className="text-foreground-light hover:text-foreground p-1 rounded"
      aria-label={tooltip}
      tooltip={{
        content: {
          side: 'bottom',
          text: tooltip,
        },
      }}
    />
  )
}
MessageActions.Edit = MessageActionsEdit

function MessageActionsDelete({ onClick }: { onClick: () => void }) {
  return (
    <ButtonTooltip
      type="text"
      icon={<Trash2 size={14} strokeWidth={1.5} />}
      tooltip={{ content: { side: 'bottom', text: 'Delete message' } }}
      onClick={onClick}
      className="text-foreground-light hover:text-foreground p-1 rounded"
      title="Delete message"
      aria-label="Delete message"
    />
  )
}
MessageActions.Delete = MessageActionsDelete
