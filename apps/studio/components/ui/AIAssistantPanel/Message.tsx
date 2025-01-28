import { User } from 'lucide-react'
import { createContext, PropsWithChildren, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Components } from 'react-markdown/lib/ast-to-react'
import remarkGfm from 'remark-gfm'

import { AiIconAnimation, cn, markdownComponents, WarningIcon } from 'ui'
import { Heading3, InlineCode, Link, ListItem, MarkdownPre, OrderedList } from './MessageMarkdown'

interface MessageContextType {
  isLoading: boolean
  readOnly?: boolean
}
export const MessageContext = createContext<MessageContextType>({ isLoading: false })

const baseMarkdownComponents: Partial<Components> = {
  ol: OrderedList,
  li: ListItem,
  h3: Heading3,
  code: InlineCode,
  a: Link,
  pre: MarkdownPre,
}

interface MessageProps {
  role: 'function' | 'system' | 'user' | 'assistant' | 'data' | 'tool'
  content?: string
  isLoading: boolean
  readOnly?: boolean
  action?: React.ReactNode
  variant?: 'default' | 'warning'
}

export const Message = function Message({
  role,
  content,
  isLoading,
  readOnly,
  children,
  action = null,
  variant = 'default',
}: PropsWithChildren<MessageProps>) {
  const isUser = role === 'user'
  const allMarkdownComponents = useMemo(
    () => ({ ...markdownComponents, ...baseMarkdownComponents }),
    []
  )

  if (!content) return null

  return (
    <MessageContext.Provider value={{ isLoading, readOnly }}>
      <div
        className={cn(
          'mb-5 text-foreground-light text-sm',
          isUser && 'text-foreground',
          variant === 'warning' && 'bg-warning-200'
        )}
      >
        {children}

        {variant === 'warning' && <WarningIcon className="w-6 h-6" />}

        {action}

        <div className="flex gap-4 w-auto overflow-hidden">
          {isUser ? (
            <figure className="w-5 h-5 shrink-0 bg-foreground rounded-full flex items-center justify-center">
              <User size={16} strokeWidth={1.5} className="text-background" />
            </figure>
          ) : (
            <AiIconAnimation size={20} className="text-foreground-muted shrink-0" />
          )}
          <ReactMarkdown
            className="space-y-5 flex-1 [&>*>code]:text-xs [&>*>*>code]:text-xs min-w-0 [&_li]:space-y-4"
            remarkPlugins={[remarkGfm]}
            components={allMarkdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </MessageContext.Provider>
  )
}
