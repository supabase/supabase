import { useRouter } from 'next/router'
import { memo, ReactNode, useContext } from 'react'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useFlag } from 'hooks/ui/useFlag'
import { TelemetryActions } from 'lib/constants/telemetry'
import { useProfile } from 'lib/profile'
import { cn, CodeBlock, CodeBlockLang } from 'ui'
import { DebouncedComponent } from '../DebouncedComponent'
import { QueryBlock } from '../QueryBlock/QueryBlock'
import { AssistantSnippetProps } from './AIAssistant.types'
import { identifyQueryType } from './AIAssistant.utils'
import CollapsibleCodeBlock from './CollapsibleCodeBlock'
import { MessageContext } from './Message'

export const OrderedList = memo(({ children }: { children: ReactNode }) => (
  <ol className="flex flex-col gap-y-4">{children}</ol>
))
OrderedList.displayName = 'OrderedList'

export const ListItem = memo(({ children }: { children: ReactNode }) => (
  <li className="[&>pre]:mt-2">{children}</li>
))
ListItem.displayName = 'ListItem'

export const Heading3 = memo(({ children }: { children: ReactNode }) => (
  <h3 className="underline">{children}</h3>
))
Heading3.displayName = 'Heading3'

export const InlineCode = memo(
  ({ className, children }: { className?: string; children: ReactNode }) => (
    <code className={cn('text-xs', className)}>{children}</code>
  )
)
InlineCode.displayName = 'InlineCode'

export const Link = memo(({ href, children }: { href?: string; children: ReactNode }) => (
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

const MemoizedQueryBlock = memo(
  ({
    sql,
    title,
    xAxis,
    yAxis,
    isChart,
    isLoading,
    isDraggable,
    runQuery,
    onRunQuery,
  }: {
    sql: string
    title: string
    xAxis?: string
    yAxis?: string
    isChart: boolean
    isLoading: boolean
    isDraggable: boolean
    runQuery: boolean
    onRunQuery: (queryType: 'select' | 'mutation') => void
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
          view: isChart ? 'chart' : 'table',
        }}
        showSql={!isChart}
        isChart={isChart}
        isLoading={isLoading}
        draggable={isDraggable}
        runQuery={runQuery}
        onRunQuery={onRunQuery}
      />
    </DebouncedComponent>
  )
)
MemoizedQueryBlock.displayName = 'MemoizedQueryBlock'

export const MarkdownPre = ({ children }: { children: any }) => {
  const router = useRouter()
  const { profile } = useProfile()
  const { isLoading, readOnly } = useContext(MessageContext)
  const { mutate: sendEvent } = useSendEventMutation()
  const supportSQLBlocks = useFlag('reportsV2')

  const canCreateSQLSnippet = useCheckPermissions(PermissionAction.CREATE, 'user_content', {
    resource: { type: 'sql', owner_id: profile?.id },
    subject: { id: profile?.id },
  })

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
  const isDraggableToReports =
    supportSQLBlocks && canCreateSQLSnippet && router.pathname.endsWith('/reports/[id]')

  const onRunQuery = async (queryType: 'select' | 'mutation') => {
    sendEvent({
      action: TelemetryActions.ASSISTANT_SUGGESTION_RUN_QUERY_CLICKED,
      properties: {
        queryType,
        ...(queryType === 'mutation' ? { category: identifyQueryType(sql) ?? 'unknown' } : {}),
      },
    })
  }

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
            isDraggable={isDraggableToReports}
            runQuery={runQuery}
            onRunQuery={onRunQuery}
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
