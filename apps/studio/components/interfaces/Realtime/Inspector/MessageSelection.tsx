import { useParams } from 'common'
import CopyButton from 'components/ui/CopyButton'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { X } from 'lucide-react'
import { useMemo } from 'react'
import { Button, cn } from 'ui'

import type { LogData } from './Messages.types'
import { SelectedRealtimeMessagePanel } from './SelectedRealtimeMessagePanel'

export interface MessageSelectionProps {
  log: LogData | null
  onClose: () => void
}

const MessageSelection = ({ log, onClose }: MessageSelectionProps) => {
  const selectionText = useMemo(() => {
    return JSON.stringify(log, null, 2)
  }, [log])

  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { mutate: sendEvent } = useSendEventMutation()

  return (
    <div
      className={cn('relative flex h-full flex-grow flex-col border-l overflow-y-scroll bg-200')}
    >
      <div
        className={cn(
          'absolute flex h-full w-full flex-col items-center justify-center gap-2 bg-200 text-center opacity-0 transition-all',
          log ? 'z-0 opacity-0' : 'z-10 opacity-100'
        )}
      >
        <div
          className={cn(
            'flex w-full max-w-sm scale-95 flex-col items-center justify-center gap-6 text-center opacity-0 transition-all delay-300 duration-500',
            log ? 'mt-0 scale-95 opacity-0' : 'mt-8 scale-100 opacity-100'
          )}
        >
          <div className="relative flex h-4 w-32 items-center rounded border border-default px-2">
            <div className="h-0.5 w-2/3 rounded-full bg-overlay-hover"></div>
            <div className="absolute right-1 -bottom-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-sm text-foreground">Select a message</h3>
            <p className="text-xs text-foreground-lighter">
              Click on a message on the left to view details.
            </p>
          </div>
        </div>
      </div>
      <div className="relative h-px flex-grow">
        <div className="pt-4 flex flex-col gap-4">
          <div className="px-4 flex flex-row justify-between items-center">
            <div className="transition">
              <CopyButton
                text={selectionText}
                type="default"
                title="Copy log to clipboard"
                onClick={() => {
                  sendEvent({
                    action: 'realtime_inspector_copy_message_clicked',
                    groups: { project: ref ?? 'Unknown', organization: org?.slug ?? 'Unknown' },
                  })
                }}
              />
            </div>
            <Button
              type="text"
              className="cursor-pointer transition hover:text-scale-1200 h-8 w-8 px-0 py-0 flex items-center justify-center"
              onClick={onClose}
            >
              <X size={14} strokeWidth={2} className="text-scale-900" />
            </Button>
          </div>
          <div className="h-px w-full bg-scale-600 rounded" />
        </div>
        <div className="flex flex-col space-y-6 py-4">
          {log && <SelectedRealtimeMessagePanel log={log} />}
        </div>
      </div>
    </div>
  )
}

export default MessageSelection
