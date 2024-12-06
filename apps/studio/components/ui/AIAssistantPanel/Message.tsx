import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { PropsWithChildren } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { AiIconAnimation, cn, CodeBlock, markdownComponents, WarningIcon } from 'ui'
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
          components={{
            ...markdownComponents,
            pre: (props: any) => {
              const language = props.children[0].props.className?.replace('language-', '') || 'sql'

              return (
                <div className="w-auto -ml-[36px] overflow-x-hidden">
                  {language === 'sql' ? (
                    readOnly ? (
                      <CollapsibleCodeBlock
                        value={props.children[0].props.children[0]}
                        language="sql"
                        hideLineNumbers
                      />
                    ) : (
                      <SqlSnippet
                        readOnly={readOnly}
                        isLoading={isLoading}
                        sql={props.children[0].props.children}
                      />
                    )
                  ) : (
                    <CodeBlock
                      hideLineNumbers
                      value={props.children[0].props.children}
                      language={language}
                      className={cn(
                        'max-h-96 max-w-none block border rounded !bg-transparent !py-3 !px-3.5 prose dark:prose-dark text-foreground',
                        '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap [&>code]:block [&>code>span]:text-foreground'
                      )}
                    />
                  )}
                </div>
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
