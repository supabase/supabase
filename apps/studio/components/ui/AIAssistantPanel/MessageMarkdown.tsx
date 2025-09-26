import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { memo, ReactNode, useEffect, useMemo, useRef } from 'react'

import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import {
  Button,
  cn,
  CodeBlock,
  CodeBlockLang,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  DialogTrigger,
} from 'ui'
import { EdgeFunctionBlock } from '../EdgeFunctionBlock/EdgeFunctionBlock'
import { AssistantSnippetProps } from './AIAssistant.types'
import { CollapsibleCodeBlock } from './CollapsibleCodeBlock'
import { DisplayBlockRenderer } from './DisplayBlockRenderer'
import { defaultUrlTransform } from './Message.utils'

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

export const Hyperlink = memo(({ href, children }: { href?: string; children: ReactNode }) => {
  const isExternalURL = !href?.startsWith('https://supabase.com/dashboard')
  const safeUrl = defaultUrlTransform(href ?? '')
  const isSafeUrl = safeUrl.length > 0

  if (!isSafeUrl) {
    return <span className="text-foreground">{children}</span>
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <span
          className={cn(
            '!m-0 text-foreground cursor-pointer transition',
            'underline underline-offset-2 decoration-foreground-muted hover:decoration-foreground-lighter'
          )}
        >
          {children}
        </span>
      </DialogTrigger>
      <DialogContent size="small">
        <DialogHeader className="border-b">
          <DialogTitle>Verify the link before navigating</DialogTitle>
        </DialogHeader>

        <DialogSection className="flex flex-col">
          <p className="text-sm text-foreground-light">
            This link will take you to the following URL:
          </p>
          <p className="text-sm text-foreground">{safeUrl}</p>
          <p className="text-sm text-foreground-light mt-2">Are you sure you want to head there?</p>
        </DialogSection>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="default" className="opacity-100">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button asChild type="primary" className="opacity-100">
              {isExternalURL ? (
                <a href={safeUrl} target="_blank" rel="noreferrer noopener">
                  Head to link
                </a>
              ) : (
                <Link href={safeUrl}>Head to link</Link>
              )}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
Hyperlink.displayName = 'Hyperlink'

export const MarkdownPre = ({
  children,
  id,
  isLoading,
  readOnly,
}: {
  children: any
  id: string
  isLoading: boolean
  readOnly?: boolean
}) => {
  // [Joshen] Using a ref as this data doesn't need to trigger a re-render
  const chartConfig = useRef<ChartConfig>({
    view: 'table',
    type: 'bar',
    xKey: '',
    yKey: '',
    cumulative: false,
  })

  const language = children[0].props.className?.replace('language-', '') || 'sql'
  const rawContent = children[0].props.children[0]
  const propsMatch = rawContent.match(/(?:--|\/\/)\s*props:\s*(\{[^}]+\})/)

  const snippetProps: AssistantSnippetProps = useMemo(() => {
    try {
      if (propsMatch) {
        return JSON.parse(propsMatch[1])
      }
    } catch {}
    return {}
  }, [propsMatch])

  const { xAxis, yAxis } = snippetProps
  const snippetId = snippetProps.id
  const title = snippetProps.title || (language === 'edge' ? 'Edge Function' : 'SQL Query')
  const isChart = snippetProps.isChart === 'true'
  // Strip props from the content for both SQL and edge functions
  const cleanContent = rawContent.replace(/(?:--|\/\/)\s*props:\s*\{[^}]+\}/, '').trim()

  const toolCallId = String(snippetId ?? id)

  useEffect(() => {
    chartConfig.current = {
      ...chartConfig.current,
      view: isChart ? 'chart' : 'table',
      xKey: xAxis ?? '',
      yKey: yAxis ?? '',
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snippetProps])

  return (
    <div className="w-auto overflow-x-hidden not-prose my-4 ">
      {language === 'edge' ? (
        <EdgeFunctionBlock
          label={title}
          code={cleanContent}
          functionName={snippetProps.name || 'my-function'}
          showCode={!readOnly}
        />
      ) : language === 'sql' ? (
        readOnly ? (
          <CollapsibleCodeBlock value={cleanContent} language="sql" hideLineNumbers />
        ) : isLoading ? (
          <div className="my-4 rounded-lg border bg-surface-75 heading-meta h-9 px-3 text-foreground-light flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Writing SQL...
          </div>
        ) : (
          <DisplayBlockRenderer
            messageId={id}
            toolCallId={toolCallId}
            initialArgs={{
              sql: cleanContent,
              label: title,
              isWriteQuery: false,
              view: isChart ? 'chart' : 'table',
              xAxis: xAxis ?? '',
              yAxis: yAxis ?? '',
            }}
            onError={() => {}}
            showConfirmFooter={false}
            onChartConfigChange={(config) => {
              chartConfig.current = { ...config }
            }}
          />
        )
      ) : (
        <CodeBlock
          hideLineNumbers
          value={cleanContent}
          language={language as CodeBlockLang}
          className={cn(
            'my-4 max-h-96 max-w-none block border rounded !bg-transparent !py-3 !px-3.5 prose dark:prose-dark text-foreground',
            '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap [&>code]:block [&>code>span]:text-foreground'
          )}
        />
      )}
    </div>
  )
}
