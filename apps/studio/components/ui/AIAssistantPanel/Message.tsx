import { User } from 'lucide-react'
import { PropsWithChildren, memo, useMemo, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

import { AiIconAnimation, cn, CodeBlock, markdownComponents, WarningIcon } from 'ui'
import { QueryBlock } from '../QueryBlock/QueryBlock'
import CollapsibleCodeBlock from './CollapsibleCodeBlock'
import { DebouncedComponent } from '../DebouncedComponent'

interface MessageProps {
  role: 'function' | 'system' | 'user' | 'assistant' | 'data' | 'tool'
  content?: string
  isLoading: boolean
  readOnly?: boolean
  action?: React.ReactNode
  variant?: 'default' | 'warning'
}

type AssistantSnippetProps = {
  title: string
  runQuery: 'true' | 'false'
  isChart?: 'true' | 'false'
  xAxis?: string
  yAxis?: string
}

const MarkdownPre = ({
  children,
  readOnly,
  isLoading,
}: {
  children: any
  readOnly?: boolean
  isLoading: boolean
}) => {
  useEffect(() => {
    return () => {
      console.log('unmounting')
    }
  }, [])

  const language = children[0].props.className?.replace('language-', '') || 'sql'
  const rawSql = language === 'sql' ? children[0].props.children : undefined
  const formatted = (rawSql || [''])[0]
  const propsMatch = formatted.match(/--\s*props:\s*(\{[^}]+\})/)

  const snippetProps: AssistantSnippetProps = propsMatch ? JSON.parse(propsMatch[1]) : {}
  const { xAxis, yAxis } = snippetProps
  const title = snippetProps.title || 'SQL Query'
  const isChart = snippetProps.isChart === 'true'
  const runQuery = snippetProps.runQuery === 'true'
  const sql = formatted?.replace(/--\s*props:\s*\{[^}]+\}/, '').trim()

  return (
    <div className="w-auto -ml-[36px] overflow-x-hidden">
      {language === 'sql' ? (
        readOnly ? (
          <CollapsibleCodeBlock
            value={children[0].props.children[0]}
            language="sql"
            hideLineNumbers
          />
        ) : (
          <DebouncedComponent delay={500} value={sql}>
            <QueryBlock
              lockColumns
              label={title}
              sql={sql}
              chartConfig={{
                type: 'bar',
                cumulative: false,
                xKey: xAxis ?? '',
                yKey: yAxis ?? '',
              }}
              isChart={isChart}
              isLoading={isLoading}
              runQuery={runQuery}
            />
          </DebouncedComponent>
        )
      ) : (
        <CodeBlock
          hideLineNumbers
          value={children[0].props.children}
          language={language}
          className={cn(
            'max-h-96 max-w-none block border rounded !bg-transparent !py-3 !px-3.5 prose dark:prose-dark text-foreground',
            '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap [&>code]:block [&>code>span]:text-foreground'
          )}
        />
      )}
    </div>
  )
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
  useEffect(() => {
    return () => {
      console.log('unmounting parent')
    }
  }, [])

  const isUser = role === 'user'

  const allMarkdownComponents = useMemo(
    (): Components => ({
      ...markdownComponents,
      pre: (props: any) => {
        const PreComponent = useMemo(
          () => (preProps: any) => (
            <MarkdownPre readOnly={readOnly} isLoading={isLoading}>
              {preProps.children}
            </MarkdownPre>
          ),
          [readOnly, isLoading]
        )
        return <PreComponent {...props} />
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
      a: (props: any) => {
        return (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={props.href}
            className="underline transition underline-offset-2 decoration-foreground-lighter hover:decoration-foreground text-foreground"
          >
            {props.children}
          </a>
        )
      },
    }),
    [readOnly]
  )

  if (!content) return null

  return (
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
  )
}
