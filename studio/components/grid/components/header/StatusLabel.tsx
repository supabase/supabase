import { useState, FC, useEffect } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { IconLoader, IconCheck } from '@supabase/ui'
import { SupabaseGridQueue } from '../../constants'

interface Props {}

const StatusLabel: FC<Props> = ({}) => {
  const [status, setStatus] = useState<string>()

  useEffect(() => {
    let isMounted = true
    let timer: number | null

    SupabaseGridQueue.on('active', () => {
      if (timer) clearTimeout(timer)

      if (isMounted) setStatus('saving')
    })
    SupabaseGridQueue.on('idle', () => {
      if (timer) clearTimeout(timer)
      timer = window.setTimeout(() => setStatus(undefined), 4000)

      if (isMounted) setStatus('saved')
    })

    return () => {
      isMounted = false
      if (timer) clearTimeout(timer)
    }
  }, [])

  return (
    <div className="sb-grid-status-label flex items-center justify-center">
      {status === 'saving' ? (
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <IconLoader className="animate-spin mx-1 text-scale-1100" size={14} strokeWidth={2} />
          </Tooltip.Trigger>
          <Tooltip.Content side="left">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'bg-scale-100 rounded py-1 px-2 leading-none shadow',
                'border-scale-200 border',
              ].join(' ')}
            >
              <span className="text-scale-1200 text-xs">Saving changes...</span>
            </div>
          </Tooltip.Content>
        </Tooltip.Root>
      ) : status === 'saved' ? (
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <IconCheck className="text-brand-900 mx-1" size={14} strokeWidth={3} />
          </Tooltip.Trigger>
          <Tooltip.Content side="left">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'bg-scale-100 rounded py-1 px-2 leading-none shadow',
                'border-scale-200 border ',
              ].join(' ')}
            >
              <span className="text-scale-1200 text-xs">All changes saved</span>
            </div>
          </Tooltip.Content>
        </Tooltip.Root>
      ) : (
        <></>
      )}

      {!status && (
        <div className="sb-grid-status-label__no-msg">
          <div></div>
        </div>
      )}
    </div>
  )
}
export default StatusLabel
