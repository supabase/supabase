import dayjs from 'dayjs'
import { noop } from 'lodash'
import Image from 'next/image'
import { PropsWithChildren, memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AiIconAnimation, Badge, cn, markdownComponents, WarningIcon } from 'ui'

import { DiffType } from 'components/interfaces/SQLEditor/SQLEditor.types'
import { useProfile } from 'lib/profile'
import { MessagePre } from './MessagePre'

interface MessageProps {
  name?: string
  role: 'function' | 'system' | 'user' | 'assistant' | 'data' | 'tool'
  content?: string
  createdAt?: number
  isDebug?: boolean
  isSelected?: boolean
  action?: React.ReactNode
  context?: { entity: string; schemas: string[]; tables: string[] }
  onDiff?: (type: DiffType, s: string) => void
  variant?: 'default' | 'warning'
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
  action = null,
  variant = 'default',
  onDiff = noop,
}: PropsWithChildren<MessageProps>) {
  const { profile } = useProfile()
  const isUser = role === 'user'

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
          .filter(([_, value]) => value.length > 0)
          .map(([key, value]) => {
            return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${Array.isArray(value) ? value.join(', ') : value}`
          })
          .join(' • ')
      : undefined

  if (!content) return null

  return (
    <div
      className={cn(
        'flex flex-col py-4 gap-4 px-5 text-foreground-light text-sm border-t first:border-0',
        variant === 'warning' && 'bg-warning-200',
        isUser && 'bg-default'
      )}
    >
      <div className="flex justify-between items-center">
        <div className="flex gap-x-3 items-center">
          {variant === 'warning' ? <WarningIcon className="w-6 h-6" /> : icon}

          <div className="flex flex-col -gap-y-1">
            <div className="flex items-center gap-x-3">
              <span className="text-sm">{!isUser ? 'Assistant' : name ? name : 'You'}</span>
              {createdAt && (
                <span
                  className={cn(
                    'text-xs text-foreground-muted',
                    variant === 'warning' && 'text-warning-500'
                  )}
                >
                  {dayjs(createdAt).fromNow()}
                </span>
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
        className="gap-x-2.5 gap-y-4 flex flex-col [&>*>code]:text-xs [&>*>*>code]:text-xs"
        remarkPlugins={[remarkGfm]}
        components={{
          ...markdownComponents,
          pre: (props: any) => {
            return (
              <MessagePre
                onDiff={onDiff}
                className={cn(
                  'transition [&>div>pre]:max-w-full',
                  isSelected ? '[&>div>pre]:!border-stronger [&>div>pre]:!bg-surface-200' : ''
                )}
              >
                {props.children[0].props.children}
              </MessagePre>
            )
          },
          ol: (props: any) => {
            return <ol className="flex flex-col gap-y-4">{props.children}</ol>
          },
          li: (props: any) => {
            return <li className="[&>pre]:mt-2">{props.children}</li>
          },
          h3: (props: any) => {
            return <h3 className="underline">{props.children}</h3>
          },
          code: (props: any) => {
            return <code className={cn('text-xs', props.className)}>{props.children}</code>
          },
        }}
      >
        {content}
      </ReactMarkdown>
      {children}
    </div>
  )
})
