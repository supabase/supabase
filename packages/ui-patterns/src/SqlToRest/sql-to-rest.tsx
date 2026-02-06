'use client'

import Editor, { useMonaco } from '@monaco-editor/react'
import {
  formatCurl,
  formatHttp,
  HttpRequest,
  ParsingError,
  processSql,
  RenderError,
  renderHttp,
  renderSupabaseJs,
  Statement,
  SupabaseJsQuery,
  UnimplementedError,
  UnsupportedError,
} from '@supabase/sql-to-rest'
import { ChevronUp, GitPullRequest } from 'lucide-react'
import type { editor } from 'monaco-editor'
import { useTheme } from 'next-themes'
import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import Markdown from 'react-markdown'
import { format } from 'sql-formatter'
import { cn, CodeBlock, Collapsible, Tabs } from 'ui'
import { Alert } from 'ui/src/components/shadcn/ui/alert'

import { assumptions } from './assumptions'
import { BaseUrlDialog } from './base-url-dialog'
import { faqs } from './faqs'
import { transformRenderer } from './syntax-highlighter/transform-renderer'
import { ResultBundle } from './util'

export interface SqlToRestProps {
  defaultValue?: string
  defaultBaseUrl?: string
}

export default function SqlToRest({
  defaultValue,
  defaultBaseUrl = 'http://localhost:54321/rest/v1',
}: SqlToRestProps) {
  const monaco = useMonaco()
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme?.includes('dark') ?? true

  useLayoutEffect(() => {
    if (monaco) {
      const lightMode = getTheme(false)
      const darkMode = getTheme(true)
      monaco.editor.defineTheme('supabase-light', lightMode)
      monaco.editor.defineTheme('supabase-dark', darkMode)
    }
  }, [monaco])

  const [sql, setSql] = useState(defaultValue ?? '')
  const [statement, setStatement] = useState<Statement>()
  const [currentLanguage, setCurrentLanguage] = useState('curl')

  const [httpRequest, setHttpRequest] = useState<HttpRequest>()
  const [jsQuery, setJsQuery] = useState<SupabaseJsQuery>()

  const [parsingError, setParsingError] = useState<ParsingError>()
  const [unimplementedError, setUnimplementedError] = useState<UnimplementedError>()
  const [unsupportedError, setUnsupportedError] = useState<UnsupportedError>()
  const [httpRenderError, setHttpRenderError] = useState<RenderError>()
  const [supabaseJsRenderError, setSupabaseJsRenderError] = useState<RenderError>()

  const [isBaseUrlDialogOpen, setIsBaseUrlDialogOpen] = useState(false)
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl)

  const baseUrlObject = useMemo(() => {
    try {
      return new URL(baseUrl)
    } catch (err) {
      return undefined
    }
  }, [baseUrl])

  const codeBlockRenderer = useMemo(
    () =>
      transformRenderer({
        search: (text) => !!baseUrlObject && text.includes(baseUrlObject.host),
        wrapper: ({ children }) => (
          <span
            className="cursor-pointer border-b border-dotted border-neutral-500"
            onClick={() => setIsBaseUrlDialogOpen(true)}
          >
            {children}
          </span>
        ),
      }),
    [baseUrlObject]
  )

  const rawHttp = useMemo(() => {
    if (!httpRequest) {
      return
    }
    return formatHttp(baseUrl, httpRequest)
  }, [httpRequest, baseUrl])

  const curlCommand = useMemo(() => {
    if (!httpRequest) {
      return
    }
    return formatCurl(baseUrl, httpRequest)
  }, [httpRequest, baseUrl])

  const jsCommand = useMemo(() => {
    if (!jsQuery) {
      return
    }
    const { code } = jsQuery
    return code
  }, [jsQuery])

  const relevantFaqs = useMemo(() => {
    if (!statement) {
      return []
    }

    switch (currentLanguage) {
      case 'http':
      case 'curl': {
        if (!httpRequest) {
          return []
        }

        const result: ResultBundle = {
          type: 'http',
          language: currentLanguage,
          statement,
          ...httpRequest,
        }

        return faqs.filter((faq) => faq.condition(result))
      }
      case 'js': {
        if (!jsQuery) {
          return []
        }

        const result: ResultBundle = {
          type: 'supabase-js',
          language: currentLanguage,
          statement,
          ...jsQuery,
        }

        return faqs.filter((faq) => faq.condition(result))
      }
      default:
        return []
    }
  }, [currentLanguage, statement, httpRequest, jsQuery])

  const relevantAssumptions = useMemo(() => {
    if (!statement) {
      return []
    }

    switch (currentLanguage) {
      case 'http':
      case 'curl': {
        if (!httpRequest) {
          return []
        }

        const result: ResultBundle = {
          type: 'http',
          language: currentLanguage,
          statement,
          ...httpRequest,
        }

        return assumptions.filter((a) => a.condition(result)).flatMap((a) => a.assumptions(result))
      }
      case 'js': {
        if (!jsQuery) {
          return []
        }

        const result: ResultBundle = {
          type: 'supabase-js',
          language: currentLanguage,
          statement,
          ...jsQuery,
        }

        return assumptions.filter((a) => a.condition(result)).flatMap((a) => a.assumptions(result))
      }
      default:
        return []
    }
  }, [currentLanguage, statement, httpRequest, jsQuery])

  const process = useCallback(async (sql: string) => {
    setSql(sql)

    try {
      const statement = await processSql(sql)
      const httpRequest = await renderHttp(statement)
      const jsQuery = await renderSupabaseJs(statement)

      setParsingError(undefined)
      setUnimplementedError(undefined)
      setUnsupportedError(undefined)
      setHttpRenderError(undefined)
      setSupabaseJsRenderError(undefined)

      setStatement(statement)
      setHttpRequest(httpRequest)
      setJsQuery(jsQuery)
    } catch (error) {
      setParsingError(undefined)
      setUnimplementedError(undefined)
      setUnsupportedError(undefined)
      setHttpRenderError(undefined)
      setSupabaseJsRenderError(undefined)

      if (error instanceof ParsingError) {
        setParsingError(error)
      } else if (error instanceof UnimplementedError) {
        setUnimplementedError(error)
      } else if (error instanceof UnsupportedError) {
        setUnsupportedError(error)
      } else if (error instanceof RenderError) {
        if (error.renderer === 'http') {
          setHttpRenderError(error)
        } else if (error.renderer === 'supabase-js') {
          setSupabaseJsRenderError(error)
        } else {
          console.error(error)
        }
      } else {
        console.error(error)
      }
    }
  }, [])

  // Process initial value only
  useEffect(() => {
    process(sql)
  }, [process])

  return (
    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 mt-4">
      <div className="flex flex-col gap-4">
        <div className="font-medium">Enter SQL to translate</div>
        <div
          className={cn('h-96 py-4 border rounded-md', isDark ? 'bg-[#1f1f1f]' : 'bg-[#f0f0f0]')}
        >
          <Editor
            language="pgsql"
            theme={isDark ? 'supabase-dark' : 'supabase-light'}
            value={sql}
            options={{
              tabSize: 2,
              minimap: {
                enabled: false,
              },
              fontSize: 13,
            }}
            onMount={async (editor, monaco) => {
              // Register pgsql formatter
              monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
                async provideDocumentFormattingEdits(model) {
                  const currentCode = editor.getValue()
                  const formattedCode = format(currentCode, {
                    language: 'postgresql',
                    keywordCase: 'lower',
                  })
                  return [
                    {
                      range: model.getFullModelRange(),
                      text: formattedCode,
                    },
                  ]
                },
              })

              // Format on cmd+s
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
                await editor.getAction('editor.action.formatDocument')?.run()
              })

              // Run format on the initial value
              await editor.getAction('editor.action.formatDocument')?.run()
            }}
            onChange={async (sql) => {
              if (!sql) {
                return
              }
              await process(sql)
            }}
          />
        </div>

        {parsingError && (
          <Alert className="text-red-900">
            {parsingError.message}. {parsingError.hint}
          </Alert>
        )}
        {unsupportedError && (
          <Alert className="text-red-900">
            <div>
              {unsupportedError.message}. {unsupportedError.hint}
            </div>
            <div className="prose text-sm mt-2">
              PostgREST doesn't support this query. If you're sure the syntax is correct and are
              unable to modify it, wrap it in a stored procedure and call it using the{' '}
              <a href="https://postgrest.org/en/v12/references/api/stored_procedures.html#stored-procedures">
                RPC
              </a>{' '}
              endpoint.
            </div>
          </Alert>
        )}
        {unimplementedError && (
          <Alert className="text-orange-1000">
            {unimplementedError.message}.
            <div className="mt-2 text-white flex gap-1 leading-6">
              <GitPullRequest className="inline-block" width={16} />
              <a
                href="https://github.com/supabase-community/sql-to-rest/issues/new/choose"
                target="_blank"
                rel="noopener noreferrer"
              >
                Create a PR
              </a>
            </div>
          </Alert>
        )}
      </div>
      <BaseUrlDialog
        defaultValue={baseUrl}
        onChange={(value) => setBaseUrl(value)}
        open={isBaseUrlDialogOpen}
        onOpenChange={(open) => setIsBaseUrlDialogOpen(open)}
      />

      <div
        className={cn(
          'flex flex-col gap-4',
          parsingError || unsupportedError || unimplementedError
            ? 'opacity-25 pointer-events-none'
            : ''
        )}
      >
        <div className="font-medium">Choose language to translate to</div>
        <Tabs activeId={currentLanguage} onChange={(id: string) => setCurrentLanguage(id)}>
          <Tabs.Panel id="curl" label="cURL" className="flex flex-col gap-4">
            {httpRenderError && <Alert className="text-red-900">{httpRenderError.message}</Alert>}
            <CodeBlock
              language="curl"
              hideLineNumbers
              className={cn(
                'self-stretch  overflow-y-hidden',
                httpRenderError || !baseUrlObject ? 'opacity-25 pointer-events-none' : ''
              )}
              renderer={codeBlockRenderer}
            >
              {curlCommand}
            </CodeBlock>
          </Tabs.Panel>
          <Tabs.Panel id="http" label="HTTP" className="flex flex-col gap-4">
            {httpRenderError && <Alert className="text-red-900">{httpRenderError.message}</Alert>}
            <CodeBlock
              language="http"
              hideLineNumbers
              className={cn(
                'self-stretch overflow-y-hidden',
                httpRenderError ? 'opacity-25 pointer-events-none' : ''
              )}
              renderer={codeBlockRenderer}
            >
              {rawHttp}
            </CodeBlock>
          </Tabs.Panel>
          <Tabs.Panel id="js" label="JavaScript" className="flex flex-col gap-4">
            {supabaseJsRenderError && (
              <Alert className="text-red-900">{supabaseJsRenderError.message}</Alert>
            )}
            <CodeBlock
              language="js"
              hideLineNumbers
              className={cn(
                'self-stretch overflow-y-hidden',
                supabaseJsRenderError ? 'opacity-25 pointer-events-none' : ''
              )}
              renderer={codeBlockRenderer}
            >
              {jsCommand}
            </CodeBlock>
          </Tabs.Panel>
        </Tabs>
        <div
          className={cn(
            'flex flex-col gap-4',
            ((currentLanguage === 'http' || currentLanguage === 'curl') && httpRenderError) ||
              (currentLanguage === 'js' && supabaseJsRenderError)
              ? 'opacity-25 pointer-events-none'
              : ''
          )}
        >
          {relevantAssumptions.length > 0 && (
            <div>
              <h3 className="my-1 text-base text-inherit">Assumptions</h3>
              <ol className="my-0 text-foreground">
                {relevantAssumptions.map((assumption) => (
                  <li>
                    <Markdown className="text-sm">{assumption}</Markdown>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {relevantFaqs.length > 0 && (
            <>
              <h3 className="my-1 text-base text-inherit">FAQs</h3>
              {relevantFaqs.map((faq) => (
                <Collapsible
                  key={faq.id}
                  className="flex flex-col items-stretch justify-start bg-surface-100 rounded border border-default px-4"
                >
                  <Collapsible.Trigger asChild>
                    <button type="button" className="flex justify-between items-center p-3">
                      <Markdown
                        className="text-sm text-left"
                        components={{
                          p: ({ children }: PropsWithChildren) => <p className="m-0">{children}</p>,
                        }}
                      >
                        {faq.question}
                      </Markdown>
                      <ChevronUp className="transition data-open-parent:rotate-0 data-closed-parent:rotate-180" />
                    </button>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <div className="text-foreground flex flex-col justify-start items-center px-3 pb-4">
                      <Markdown
                        className="text-sm"
                        components={{
                          code: (props: any) => <CodeBlock hideLineNumbers {...props} />,
                        }}
                      >
                        {faq.answer}
                      </Markdown>
                    </div>
                  </Collapsible.Content>
                </Collapsible>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// TODO: this was copied from studio - find a way to share it between sites
function getTheme(isDarkMode: boolean): editor.IStandaloneThemeData {
  return {
    base: isDarkMode ? 'vs-dark' : 'vs', // can also be vs-dark or hc-black
    inherit: true, // can also be false to completely replace the builtin rules
    rules: [
      {
        token: '',
        background: isDarkMode ? '1f1f1f' : 'f0f0f0',
        foreground: isDarkMode ? 'd4d4d4' : '444444',
      },
      { token: 'string.sql', foreground: '24b47e' },
      { token: 'comment', foreground: '666666' },
      { token: 'predefined.sql', foreground: isDarkMode ? 'D4D4D4' : '444444' },
    ],
    colors: { 'editor.background': isDarkMode ? '#1f1f1f' : '#f0f0f0' },
  }
}
