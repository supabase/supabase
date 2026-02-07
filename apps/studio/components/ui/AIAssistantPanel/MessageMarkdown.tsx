import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  isValidElement,
  memo,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
} from 'react'
import type { StreamdownProps } from 'streamdown'

import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import {
  Button,
  cn,
  CodeBlock,
  CodeBlockLang,
  markdownComponents,
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

const Streamdown = dynamic<StreamdownProps>(
  () => import('streamdown').then((mod) => mod.Streamdown),
  { ssr: false }
)

// Streamdown splits ordered lists with complex content (e.g. code blocks) into
// separate <ol> elements. The `start` attribute preserves semantics for screen
// readers, while `counterReset` is what actually fixes the visible numbering —
// the prose config (tailwind.config.js) uses a custom CSS counter named "item"
// with `listStyleType: 'none'`, so the `start` attribute alone has no visual effect.
export const OrderedList = memo(({ children, start }: { children?: ReactNode; start?: number }) => (
  <ol
    className="flex flex-col gap-y-4"
    start={start}
    style={start !== undefined ? { counterReset: `item ${start - 1}` } : undefined}
  >
    {children}
  </ol>
))
OrderedList.displayName = 'OrderedList'

export const ListItem = memo(({ children }: { children?: ReactNode }) => (
  <li className="[&>pre]:mt-2">{children}</li>
))
ListItem.displayName = 'ListItem'

export const Heading3 = memo(({ children }: { children?: ReactNode }) => (
  <h3 className="underline">{children}</h3>
))
Heading3.displayName = 'Heading3'

export const InlineCode = memo(
  ({ className, children }: { className?: string; children?: ReactNode }) => (
    <code className={cn('text-xs', className)}>{children}</code>
  )
)
InlineCode.displayName = 'InlineCode'

export const Hyperlink = memo(({ href, children }: { href?: string; children?: ReactNode }) => {
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

const baseMarkdownComponents = {
  ol: OrderedList,
  li: ListItem,
  h3: Heading3,
  code: InlineCode,
  a: Hyperlink,
  img: ({ src }: JSX.IntrinsicElements['img']) => (
    <span className="text-foreground-light font-mono">[Image: {src}]</span>
  ),
}

export function MessageMarkdown({
  id,
  isLoading,
  readOnly,
  className,
  children,
}: {
  id: string
  isLoading: boolean
  readOnly?: boolean
  className?: string
  children: ReactNode
}) {
  const markdownSource = useMemo(() => {
    if (typeof children === 'string') {
      return children
    }

    if (Array.isArray(children)) {
      return children.filter((child): child is string => typeof child === 'string').join('')
    }

    return ''
  }, [children])

  const allMarkdownComponents = useMemo(
    () => ({
      ...markdownComponents,
      ...baseMarkdownComponents,
      pre: (props: JSX.IntrinsicElements['pre']) => (
        <MarkdownPre id={id} isLoading={isLoading} readOnly={readOnly}>
          {props.children}
        </MarkdownPre>
      ),
    }),
    [id, isLoading, readOnly]
  )

  return (
    <Streamdown className={className} components={allMarkdownComponents}>
      {markdownSource}
    </Streamdown>
  )
}

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

  const childArray = Array.isArray(children) ? children : [children]
  const codeElement = childArray.find((child): child is ReactElement => isValidElement(child))
  const codeProps = codeElement?.props || {}
  const language = codeProps.className?.replace('language-', '') || 'sql'
  const codeChildren = codeProps.children
  const rawContent = Array.isArray(codeChildren)
    ? codeChildren.map((node) => (typeof node === 'string' ? node : '')).join('')
    : typeof codeChildren === 'string'
      ? codeChildren
      : ''
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

  if (!codeElement) {
    return <pre className="w-auto overflow-x-auto not-prose my-4">{children}</pre>
  }

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
