import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { FC, useState } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { IconUpload, IconCheck, IconClipboard } from 'ui'

import { useParams, useStore } from 'hooks'
import { EdgeFunctionsResponse } from 'data/edge-functions/edge-functions-query'

interface Props {
  fn: EdgeFunctionsResponse
}

const EdgeFunctionsRow: FC<Props> = ({ fn }) => {
  const router = useRouter()
  const { ref } = useParams()
  const { ui } = useStore()
  const [isCopied, setIsCopied] = useState(false)

  const restUrl = ui.selectedProject?.restUrl
  const restUrlTld = new URL(restUrl as string).hostname.split('.').pop()
  const functionUrl = `https://${ref}.functions.supabase.${restUrlTld}/${fn.slug}`

  return (
    <div
      key={fn.id}
      className={[
        'border border-scale-500 border-t-0 first:rounded-t first:border-t last:rounded-b',
        'bg-scale-100 dark:bg-scale-300 py-6 px-6 flex items-center justify-between',
        'hover:border-t hover:-mt-[1px] first:!mt-0 cursor-pointer',
        'hover:bg-scale-200 dark:hover:bg-scale-500 hover:border-scale-500 dark:hover:border-scale-700',
      ].join(' ')}
      onClick={() => router.push(`/project/${ref}/functions/${fn.id}`)}
    >
      <div className="space-y-1">
        <p className="text-sm">{fn.name}</p>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-scale-1000">{functionUrl}</p>
          <button
            type="button"
            className="text-scale-900 hover:text-scale-1200 transition"
            onClick={(event: any) => {
              function onCopy(value: any) {
                setIsCopied(true)
                navigator.clipboard.writeText(value).then()
                setTimeout(function () {
                  setIsCopied(false)
                }, 3000)
              }
              event.stopPropagation()
              onCopy(functionUrl)
            }}
          >
            {isCopied ? (
              <div className="text-brand-900">
                <IconCheck size={14} strokeWidth={3} />
              </div>
            ) : (
              <div className="relative">
                <div className="block">
                  <IconClipboard size={14} />
                </div>
              </div>
            )}
          </button>
        </div>
      </div>
      <div className="space-y-1 flex flex-col items-end">
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <p className="text-sm">Deployment {fn.version}</p>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                'border border-scale-200',
              ].join(' ')}
            >
              <span className="text-xs text-scale-1200">Deployment history coming soon</span>
            </div>
          </Tooltip.Content>
        </Tooltip.Root>
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <div className="flex items-center space-x-2">
              <IconUpload size={14} strokeWidth={1.5} className="text-scale-1000" />
              <p className="text-sm text-scale-1000">{dayjs(fn.updated_at).fromNow()}</p>
            </div>
          </Tooltip.Trigger>
          <Tooltip.Content side="bottom">
            <Tooltip.Arrow className="radix-tooltip-arrow" />
            <div
              className={[
                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                'border border-scale-200',
              ].join(' ')}
            >
              <span className="text-xs text-scale-1200">
                Last updated on {dayjs(fn.updated_at).format('DD MMM, YYYY HH:mm')}
              </span>
            </div>
          </Tooltip.Content>
        </Tooltip.Root>
      </div>
    </div>
  )
}

export default EdgeFunctionsRow
