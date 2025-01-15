import { User } from 'lucide-react'
import {
  PropsWithChildren,
  memo,
  useMemo,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Components } from 'react-markdown/lib/ast-to-react'

import {
  AiIconAnimation,
  cn,
  CodeBlock,
  markdownComponents,
  WarningIcon,
  type CodeBlockLang,
} from 'ui'
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

interface MessageContextType {
  isLoading: boolean
  readOnly?: boolean
}

const MessageContext = createContext<MessageContextType>({ isLoading: false })

const MemoizedQueryBlock = memo(
  ({
    sql,
    title,
    xAxis,
    yAxis,
    isChart,
    isLoading,
    runQuery,
  }: {
    sql: string
    title: string
    xAxis?: string
    yAxis?: string
    isChart: boolean
    isLoading: boolean
    runQuery: boolean
  }) => (
    <DebouncedComponent
      delay={500}
      value={sql}
      fallback={
        <div className="bg-surface-100 border-overlay rounded border shadow-sm px-3 py-2 text-xs">
          Writing SQL...
        </div>
      }
    >
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
)
MemoizedQueryBlock.displayName = 'MemoizedQueryBlock'

const MarkdownPre = ({ children }: any) => {
  const { isLoading, readOnly } = useContext(MessageContext)

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
          <MemoizedQueryBlock
            sql={sql}
            title={title}
            xAxis={xAxis}
            yAxis={yAxis}
            isChart={isChart}
            isLoading={isLoading}
            runQuery={runQuery}
          />
        )
      ) : (
        <CodeBlock
          hideLineNumbers
          value={children[0].props.children[0]}
          language={language as CodeBlockLang}
          className={cn(
            'max-h-96 max-w-none block border rounded !bg-transparent !py-3 !px-3.5 prose dark:prose-dark text-foreground',
            '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap [&>code]:block [&>code>span]:text-foreground'
          )}
        />
      )}
    </div>
  )
}

const OrderedList = memo(({ children }: { children: ReactNode }) => (
  <ol className="flex flex-col gap-y-4">{children}</ol>
))
OrderedList.displayName = 'OrderedList'

const ListItem = memo(({ children }: { children: ReactNode }) => (
  <li className="[&>pre]:mt-2">{children}</li>
))
ListItem.displayName = 'ListItem'

const Heading3 = memo(({ children }: { children: ReactNode }) => (
  <h3 className="underline">{children}</h3>
))
Heading3.displayName = 'Heading3'

const InlineCode = memo(({ className, children }: { className?: string; children: ReactNode }) => (
  <code className={cn('text-xs', className)}>{children}</code>
))
InlineCode.displayName = 'InlineCode'

const Link = memo(({ href, children }: { href?: string; children: ReactNode }) => (
  <a
    target="_blank"
    rel="noopener noreferrer"
    href={href}
    className="underline transition underline-offset-2 decoration-foreground-lighter hover:decoration-foreground text-foreground"
  >
    {children}
  </a>
))
Link.displayName = 'Link'

const baseMarkdownComponents: Partial<Components> = {
  ol: OrderedList,
  li: ListItem,
  h3: Heading3,
  code: InlineCode,
  a: Link,
  pre: MarkdownPre,
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
    () => ({
      ...markdownComponents,
      ...baseMarkdownComponents,
    }),
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
