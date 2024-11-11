import dayjs from 'dayjs'
import { noop } from 'lodash'
import Image from 'next/image'
import { PropsWithChildren } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AiIconAnimation, Badge, cn, markdownComponents, WarningIcon } from 'ui'
import { SqlSnippet } from './SqlSnippet'
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
  isLoading?: boolean
  action?: React.ReactNode
  context?: { entity: string; schemas: string[]; tables: string[] }
  onDiff?: (type: DiffType, s: string) => void
  variant?: 'default' | 'warning'
}

export const Message = function Message({
  name,
  role,
  content,
  createdAt,
  isDebug,
  isLoading,
  isSelected = false,
  context,
  children,
  action = null,
  variant = 'default',
  onDiff = noop,
}: PropsWithChildren<MessageProps>) {
  const { profile } = useProfile()
  const isUser = role === 'user'

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
    <div className="w-full flex flex-col">
      {children}
      <div
        className={cn(
          'text-foreground-light text-sm mb max-w-full mb-3',
          variant === 'warning' && 'bg-warning-200',
          isUser ? 'px-4 py-2 rounded-lg bg-background-muted w-fit self-end' : 'mb-6'
        )}
      >
        {variant === 'warning' && <WarningIcon className="w-6 h-6" />}

        {isDebug && <Badge variant="warning">Debug request</Badge>}
        {action}

        <ReactMarkdown
          className="gap-x-2.5 gap-y-4 flex flex-col [&>*>code]:text-xs [&>*>*>code]:text-xs"
          remarkPlugins={[remarkGfm]}
          components={{
            ...markdownComponents,
            pre: (props: any) => {
              return <SqlSnippet isLoading={isLoading} sql={props.children[0].props.children} />
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
        {/* {role === 'user' && context !== undefined && (
        <span className="text-xs text-foreground-lighter">{formattedContext}</span>
      )} */}
      </div>
    </div>
  )
}
