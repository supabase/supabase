import { motion } from 'framer-motion'
import { PropsWithChildren } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn, markdownComponents, WarningIcon } from 'ui'
import CollapsibleCodeBlock from './CollapsibleCodeBlock'
import { SqlSnippet } from './SqlSnippet'

interface MessageProps {
  id: string
  role: 'function' | 'system' | 'user' | 'assistant' | 'data' | 'tool'
  content?: string
  isLoading: boolean
  readOnly?: boolean
  action?: React.ReactNode
  variant?: 'default' | 'warning'
}

export const Message = function Message({
  id,
  role,
  content,
  isLoading,
  readOnly,
  children,
  action = null,
  variant = 'default',
}: PropsWithChildren<MessageProps>) {
  const isUser = role === 'user'

  if (!content) return null

  return (
    <motion.div
      layout="position"
      initial={{ y: 5, opacity: 0, scale: 0.99 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      className="w-full flex flex-col"
    >
      {children}
      <div
        className={cn(
          'text-foreground-light text-sm mb max-w-full mb-6',
          variant === 'warning' && 'bg-warning-200',
          isUser ? 'px-5 py-3 rounded-lg bg-background-muted w-fit self-end' : 'mb-6'
        )}
      >
        {variant === 'warning' && <WarningIcon className="w-6 h-6" />}

        {action}

        <ReactMarkdown
          className="gap-x-2.5 gap-y-4 flex flex-col [&>*>code]:text-xs [&>*>*>code]:text-xs"
          remarkPlugins={[remarkGfm]}
          components={{
            ...markdownComponents,
            pre: (props: any) => {
              return readOnly ? (
                <div className="mb-1 -mt-2">
                  <CollapsibleCodeBlock
                    value={props.children[0].props.children[0]}
                    language="sql"
                    hideLineNumbers
                  />
                </div>
              ) : (
                <SqlSnippet
                  readOnly={readOnly}
                  isLoading={isLoading}
                  sql={props.children[0].props.children}
                />
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
      </div>
    </motion.div>
  )
}
