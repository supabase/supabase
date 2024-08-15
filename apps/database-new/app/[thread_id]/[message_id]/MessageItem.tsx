'use client'

import type { Message as MessageItem } from 'ai/react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { cn } from 'ui'

interface MessageItemProps {
  message: MessageItem
  isLatest: boolean
  times: {
    hoursFromNow: number
    formattedTimeFromNow: string
    formattedCreatedAt: string
  }
}

const MessageItem = ({ message, isLatest, times }: MessageItemProps) => {
  const { thread_id } = useParams()
  // using the local state for run loading
  const isLoading = false

  const { hoursFromNow, formattedTimeFromNow, formattedCreatedAt } = times

  // chat shown as selected when url matches
  const isSelected = usePathname().includes(message.id)

  return (
    <Link
      className={cn(
        'group',
        'transition flex w-full gap-x-5 px-4 xl:px-8 hover:bg-surface-200/50 cursor-pointer border-r',
        isSelected && 'bg-surface-200',
        isSelected ? 'border-r-foreground' : 'border-r border-r-transparent'
      )}
      href={`/${thread_id}/${message.id}`}
    >
      <div className="flex flex-col justify-between items-center relative top-3">
        <div
          className={cn(
            'transition w-2.5 h-2.5 mt-[1px] ml-[1px] rounded-full border',
            isSelected
              ? 'bg-dbnew border-dbnew'
              : 'bg-transparent border-foreground-muted group-hover:border-foreground'
          )}
        />

        {isLoading && (
          <span
            className={cn(
              'absolute w-4 h-4 -top-0.5',
              'after:content-spinner after:t-0 after:block after:absolute after:h-4 after:w-4 after:border-r after:border-r-dbnew after:rounded-[50%] after:rotate-45 z-10',
              'animate-spin'
            )}
          >
            <div className="absolute border w-4 h-4 rounded-full z-0" />
          </span>
        )}

        {/* Node line*/}
        {!isLatest && <div className="border-l border-strong flex-grow" />}
      </div>

      <div className="flex w-full flex-col gap-y-2 py-4">
        <div className="group relative">
          <span className="z-10 absolute top-0 -left-[8px]">
            <svg viewBox="0 0 8 13" height="13" width="8">
              <path
                className={
                  // 'transition fill-background-surface-100 border'
                  isSelected
                    ? 'transition stroke-border fill-background-surface-100 stroke-border-default'
                    : 'transition stroke-border fill-background-surface-100 stroke-border-default'
                }
                d="M1.533,2.568L8,11.193V0L2.812,0C1.042,0,0.474,1.156,1.533,2.568z"
              />
            </svg>
          </span>
          <div
            title={message.content}
            className={cn(
              'cursor-pointer transition relative overflow-hidden',
              'w-full rounded-lg rounded-tl-none',
              'bg-alternative',
              'border',
              isSelected ? 'bg-surface-100' : 'bg-surface-100 group-hover:bg-surface-200'
            )}
          >
            <p
              className={cn(
                'transition p-4 text-xs',
                isSelected ? 'text-foreground' : 'text-light group-hover:text-foreground'
              )}
            >
              {message.content}
            </p>
            {isLoading && <div className="chat-shimmering-loader w-full h-0.5 absolute bottom-0" />}
          </div>
        </div>
        {isSelected && (
          <p
            className={cn(
              'transition-all',
              isSelected ? 'h-inherit opacity-100' : 'h-0 opacity-0',
              'font-mono text-xs text-foreground-lighter'
            )}
          >
            Sent {hoursFromNow > 6 ? `on ${formattedCreatedAt}` : formattedTimeFromNow}
          </p>
        )}
      </div>
    </Link>
  )
}

export default MessageItem
