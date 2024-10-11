import dayjs from 'dayjs'
import { noop } from 'lodash'
import Image from 'next/image'
import { PropsWithChildren, memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AiIconAnimation, Badge, cn, markdownComponents } from 'ui'

import { useProfile } from 'lib/profile'
import { DiffType } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { AiMessagePre } from 'components/interfaces/SQLEditor/AiAssistantPanel/AiMessagePre'
import { useAppStateSnapshot } from 'state/app-state'

interface MessageProps {
  name?: string
  role: 'function' | 'system' | 'user' | 'assistant' | 'data' | 'tool'
  content?: string
  createdAt?: number
  isDebug?: boolean
  isSelected?: boolean
  action?: React.ReactNode
  context?: { entity: string; schemas: string[] }
  onDiff?: (type: DiffType, s: string) => void
}

export const Message = memo(function Message({
  name,
  role,
  content,
  createdAt,
  isDebug,
  isSelected = false,
  context,
  children,
  action = <></>,
  onDiff = noop,
}: PropsWithChildren<MessageProps>) {
  const { profile } = useProfile()

  const icon = useMemo(() => {
    return role === 'assistant' ? (
      <AiIconAnimation
        loading={content === 'Thinking...'}
        className="[&>div>div]:border-black dark:[&>div>div]:border-white"
      />
    ) : (
      <div className="relative border shadow-lg w-8 h-8 rounded-full overflow-hidden">
        <Image
          src={`https://github.com/${profile?.username}.png` || ''}
          width={30}
          height={30}
          alt="avatar"
          className="relative"
        />
      </div>
    )
  }, [content, profile?.username, role])

  const formattedContext =
    context !== undefined
      ? Object.entries(context)
          .map(([key, value]) => {
            return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${Array.isArray(value) ? value.join(', ') : value}`
          })
          .join(' • ')
      : undefined

  if (!content) return null

  return (
    <div className="flex flex-col py-4 gap-4 border-t px-5 text-foreground-light text-sm">
      <div className="flex justify-between items-center">
        <div className="flex gap-x-3 items-center">
          {icon}

          <div className="flex flex-col -gap-y-1">
            <div className="flex items-center gap-x-3">
              <span className="text-sm">
                {role === 'assistant' ? 'Assistant' : name ? name : 'You'}
              </span>
              {createdAt && (
                <span className="text-xs text-foreground-muted">{dayjs(createdAt).fromNow()}</span>
              )}
            </div>
            {role === 'user' && context !== undefined && (
              <span className="text-xs text-foreground-lighter">{formattedContext}</span>
            )}
          </div>

          {isDebug && <Badge variant="warning">Debug request</Badge>}
        </div>{' '}
        {action}
      </div>

      <ReactMarkdown
        className="gap-x-2.5 gap-y-3 flex flex-col [&>*>code]:text-xs [&>*>*>code]:text-xs"
        remarkPlugins={[remarkGfm]}
        components={{
          ...markdownComponents,
          pre: (props: any) => {
            return (
              <AiMessagePre
                onDiff={onDiff}
                className={cn(
                  'transition',
                  isSelected ? '[&>div>pre]:!border-stronger [&>div>pre]:!bg-surface-200' : ''
                )}
              >
                {props.children[0].props.children}
              </AiMessagePre>
            )
          },
          ol: (props: any) => {
            return <ol className="flex flex-col gap-y-1">{props.children}</ol>
          },
          h3: (props: any) => {
            return <h3 className="underline">{props.children}</h3>
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {children}
    </div>
  )
})
