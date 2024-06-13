'use client'

import 'chartjs-adapter-date-fns'

import { PGlite } from '@electric-sql/pglite'
import { Editor } from '@monaco-editor/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/components/shadcn/ui/tabs'
import { nanoid } from 'ai'
import { useChat } from 'ai/react'
import Chart from 'chart.js/auto'
import { AnimatePresence, LazyMotion, m } from 'framer-motion'
import { ArrowUp, Square } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Chart as ChartWrapper } from 'react-chartjs-2'
import { ErrorBoundary } from 'react-error-boundary'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { format } from 'sql-formatter'
import { AiIconAnimation, markdownComponents } from 'ui'
import { Button } from 'ui/src/components/shadcn/ui/button'
import SchemaGraph from '~/components/schema/graph'
import { useTablesQuery } from '~/data/tables/tables-query'
import { useReportSuggestions } from '~/lib/hooks'

const loadFramerFeatures = () => import('./framer-features').then((res) => res.default)

// React's double-rendering in dev mode causes pglite errors
// Temp: storing single instance in module scope
export let db: PGlite = new PGlite('idb://local')

export default function Page() {
  const [migrationSql, setMigrationSql] = useState(
    '-- Migrations will appear here as you chat with Supabase AI'
  )
  const [tab, setTab] = useState('diagram')
  const [brainstormIdeas] = useState(false)
  const { reports } = useReportSuggestions(db, { enabled: brainstormIdeas })

  const { data: tables, refetch } = useTablesQuery({ schemas: ['public'], includeColumns: true })

  const { messages, input, setInput, handleInputChange, append, stop, isLoading } = useChat({
    api: 'api/chat',
    maxToolRoundtrips: 10,
    // Provide the LLM with the current schema before the chat starts
    initialMessages: [
      {
        id: nanoid(),
        role: 'assistant',
        content: '',
        toolInvocations: [
          {
            toolCallId: nanoid(),
            toolName: 'getDatabaseSchema',
            args: {},
            result: tables,
          },
        ],
      },
    ],
    async onToolCall({ toolCall }) {
      console.log('tool call', toolCall)
      switch (toolCall.toolName) {
        case 'getDatabaseSchema': {
          const { data: tables, error } = await refetch()

          // TODO: handle this error in the UI
          if (error) {
            throw error
          }

          return tables
        }
        case 'brainstormReports': {
          return {
            success: true,
            message: 'Reports have been brainstormed. Relay this info to the user.',
          }
        }
        case 'executeSql': {
          try {
            const { sql } = toolCall.args as any
            console.log(sql)
            const results = await db.exec(sql)

            setMigrationSql((s) => {
              const newSql = (s + '\n' + sql).trim()
              return format(newSql, {
                language: 'postgresql',
                keywordCase: 'lower',
                identifierCase: 'lower',
                dataTypeCase: 'lower',
                functionCase: 'lower',
              })
            })

            const { data: tables, error } = await refetch()

            // TODO: handle this error in the UI
            if (error) {
              throw error
            }

            return {
              queryResults: results,
              updatedSchema: tables,
            }
          } catch (err) {
            if (err instanceof Error) {
              console.log(err.message)
              return { success: false, error: err.message }
            }
            throw err
          }
        }
        case 'generateChart': {
          const { config } = toolCall.args as any

          // Validate that the chart can be rendered without error
          const canvas = document.createElement('canvas', {})
          canvas.className = 'invisible'
          document.body.appendChild(canvas)

          try {
            const chart = new Chart(canvas, config)
            chart.destroy()
            return {
              success: true,
              message:
                "The chart has been generated and displayed to the user above. Acknowledge the user's request.",
            }
          } catch (err) {
            if (err instanceof Error) {
              return { success: false, error: err.message }
            }
            throw err
          } finally {
            canvas.remove()
          }
        }
        case 'switchTab': {
          const { tab } = toolCall.args as any

          setTab(tab)

          return {
            success: true,
            message: `The UI successfully switch to the '${tab}' tab. Acknowledge the user's request.`,
          }
        }
      }
    },
  })

  const lastMessage = messages.at(-1)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nextMessageId = useMemo(() => nanoid(), [messages])

  const scrollRef = useRef<HTMLDivElement>()
  const prevScrollHeightRef = useRef<number>()

  const scrollToBottom = useCallback(() => {
    const scrollElement = scrollRef.current
    if (scrollElement) {
      scrollElement.scrollTo({ top: scrollElement.scrollHeight })
    }
  }, [])

  return (
    <LazyMotion features={loadFramerFeatures}>
      <div className="w-full h-full flex p-6 gap-8">
        <Tabs
          className="flex-1 h-full flex flex-col items-stretch"
          value={tab}
          onValueChange={(tab) => setTab(tab)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="diagram">Diagram</TabsTrigger>
            <TabsTrigger value="migrations">Migrations</TabsTrigger>
          </TabsList>
          <TabsContent value="diagram" className="h-full">
            <SchemaGraph schema="public" />
          </TabsContent>
          <TabsContent value="migrations" className="h-full py-4 rounded-md bg-[#1e1e1e]">
            <Editor
              language="pgsql"
              value={migrationSql}
              theme="vs-dark"
              options={{
                tabSize: 2,
                minimap: {
                  enabled: false,
                },
                fontSize: 13,
                readOnly: true,
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
                  await editor.getAction('editor.action.formatDocument').run()
                })

                // Run format on the initial value
                await editor.getAction('editor.action.formatDocument').run()
              }}
            />
          </TabsContent>
        </Tabs>

        <div className="flex-1 h-full flex flex-col items-stretch">
          <div
            className="flex-1 flex flex-col items-center overflow-y-auto"
            ref={(element) => {
              if (element) {
                scrollRef.current = element

                const resizeObserver = new ResizeObserver(() => {
                  if (element.scrollHeight !== prevScrollHeightRef.current) {
                    prevScrollHeightRef.current = element.scrollHeight
                    console.log('resize scroll')
                    element.scrollTo({
                      top: element.scrollHeight - element.clientHeight,
                      behavior: 'smooth',
                    })
                  }
                })

                for (const child of Array.from(element.children)) {
                  resizeObserver.observe(child)
                }
              }
            }}
          >
            {messages.some((message) => message.role === 'user') ? (
              <div className="flex flex-col gap-4 w-full max-w-4xl p-10">
                {messages
                  .filter(
                    (message) =>
                      message.content ||
                      // Don't include tool calls that don't have an associated UI
                      !message.toolInvocations?.every((t) => t.toolName !== 'generateChart')
                  )
                  .map((message) => {
                    switch (message.role) {
                      case 'user':
                        return (
                          <m.div
                            key={message.id}
                            layoutId={message.id}
                            variants={{
                              hidden: {
                                opacity: 0,
                                y: 10,
                              },
                              show: {
                                opacity: 1,
                                y: 0,
                              },
                            }}
                            initial="hidden"
                            animate="show"
                            className="self-end px-5 py-2.5 text-base rounded-full bg-neutral-100"
                          >
                            {message.content}
                          </m.div>
                        )
                      case 'assistant':
                        return (
                          <div
                            key={message.id}
                            className="self-stretch flex flex-col items-stretch gap-6"
                          >
                            {message.content && (
                              <ReactMarkdown
                                remarkPlugins={[
                                  remarkGfm,
                                  [remarkMath, { singleDollarTextMath: false }],
                                ]}
                                rehypePlugins={[[rehypeKatex, { output: 'html' }]]}
                                components={{ ...markdownComponents, img: () => null }}
                                className="prose [&_.katex-display>.katex]:text-left"
                              >
                                {message.content}
                              </ReactMarkdown>
                            )}
                            {message.toolInvocations?.map((toolInvocation) => {
                              switch (toolInvocation.toolName) {
                                case 'generateChart': {
                                  if (!('result' in toolInvocation)) {
                                    return undefined
                                  }

                                  if ('error' in toolInvocation.result) {
                                    return (
                                      <div
                                        key={toolInvocation.toolCallId}
                                        className="bg-destructive-300 px-6 py-4 rounded-md"
                                      >
                                        Error loading chart
                                      </div>
                                    )
                                  }

                                  const { type, data, options } = toolInvocation.args.config
                                  return (
                                    <ErrorBoundary
                                      key={toolInvocation.toolCallId}
                                      fallbackRender={() => (
                                        <div className="bg-destructive-300 px-6 py-4 rounded-md">
                                          Error loading chart
                                        </div>
                                      )}
                                    >
                                      <m.div
                                        className="relative w-full max-w-2xl h-[50vw] max-h-96 my-8"
                                        variants={{
                                          hidden: {
                                            opacity: 0,
                                          },
                                          show: {
                                            opacity: 1,
                                          },
                                        }}
                                        initial="hidden"
                                        animate="show"
                                      >
                                        <ChartWrapper
                                          className="max-w-full max-h-full"
                                          type={type}
                                          data={data}
                                          options={{
                                            ...options,
                                            maintainAspectRatio: false,
                                          }}
                                        />
                                      </m.div>
                                    </ErrorBoundary>
                                  )
                                }
                              }
                            })}
                          </div>
                        )
                    }
                  })}
                <AnimatePresence>
                  {isLoading && (
                    <m.div
                      className="-translate-x-12 flex gap-4 justify-start items-center"
                      variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1 },
                      }}
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                    >
                      <m.div layoutId="ai-loading-icon">
                        <AiIconAnimation loading />
                      </m.div>
                      {lastMessage &&
                        (lastMessage.role === 'user' ||
                          (lastMessage.role === 'assistant' && !lastMessage.content)) && (
                          <m.div
                            layout
                            className="text-neutral-400 italic"
                            variants={{
                              hidden: { opacity: 0 },
                              show: { opacity: 1, transition: { delay: 1.5 } },
                            }}
                            initial="hidden"
                            animate="show"
                          >
                            Working on it...
                          </m.div>
                        )}
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex-1 w-full max-w-4xl flex flex-col gap-10 justify-center items-center">
                <m.h3 layout className="text-2xl font-light">
                  What would you like to create?
                </m.h3>
                <div>
                  {brainstormIdeas && (
                    <>
                      {reports ? (
                        <m.div
                          className="flex flex-row gap-6 flex-wrap justify-center items-start"
                          variants={{
                            show: {
                              transition: {
                                staggerChildren: 0.05,
                              },
                            },
                          }}
                          initial="hidden"
                          animate="show"
                        >
                          {reports.map((report) => (
                            <m.div
                              key={report.name}
                              layoutId={`report-suggestion-${report.name}`}
                              className="w-64 h-32 flex flex-col overflow-ellipsis rounded-md cursor-pointer"
                              onMouseDown={() =>
                                append({ role: 'user', content: report.description })
                              }
                              variants={{
                                hidden: { scale: 0 },
                                show: { scale: 1 },
                              }}
                            >
                              <div className="p-4 bg-neutral-200 text-sm rounded-t-md text-neutral-600 font-bold text-center">
                                {report.name}
                              </div>
                              <div className="flex-1 p-4 flex flex-col justify-center border border-neutral-200 text-neutral-500 text-xs font-normal italic rounded-b-md text-center overflow-hidden">
                                {report.description}
                              </div>
                            </m.div>
                          ))}
                        </m.div>
                      ) : (
                        <m.div
                          className="flex flex-row gap-4 justify-center items-center"
                          variants={{
                            hidden: {
                              opacity: 0,
                              y: -10,
                            },
                            show: {
                              opacity: 1,
                              y: 0,
                              transition: {
                                delay: 0.5,
                              },
                            },
                          }}
                          initial="hidden"
                          animate="show"
                        >
                          <m.div layoutId="ai-loading-icon">
                            <AiIconAnimation loading />
                          </m.div>
                          <h3 className="text-lg italic font-light text-neutral-500">
                            Brainstorming some ideas
                          </h3>
                        </m.div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-2 pb-2 relative">
            <form
              className="flex items-center py-2 px-3 rounded-full bg-neutral-100 w-full max-w-4xl"
              onSubmit={(e) => {
                // Manually manage message submission so that we can control its ID
                // We want to control the ID so that we can perform layout animations via `layoutId`
                // (see hidden dummy message above)
                e.preventDefault()
                append({
                  id: nextMessageId,
                  role: 'user',
                  content: input,
                })
                setInput('')
                scrollToBottom()
              }}
            >
              {/*
               * This is a hidden dummy message acting as an animation anchor
               * before the real message is added to the chat.
               *
               * The animation starts in this element's position and moves over to
               * the location of the real message after submit.
               *
               * It works by sharing the same `layoutId` between both message elements
               * which framer motion requires to animate between them.
               */}
              {input && (
                <m.div
                  layoutId={nextMessageId}
                  className="absolute invisible -top-12 px-5 py-2.5 text-base rounded-full bg-neutral-100"
                >
                  {input}
                </m.div>
              )}
              <input
                id="input"
                name="prompt"
                autoComplete="off"
                className="flex-grow border-none focus-visible:ring-0 text-base bg-inherit placeholder:text-neutral-400"
                value={input}
                onChange={handleInputChange}
                placeholder="Message Supabase AI"
                autoFocus
              />
              <Button
                className="rounded-full w-8 h-8 p-1.5 text-white bg-neutral-800"
                type="submit"
                onClick={(e) => {
                  if (isLoading) {
                    e.preventDefault()
                    stop()
                  }
                }}
                disabled={!isLoading && !input}
              >
                {isLoading ? (
                  <Square fill="white" strokeWidth={0} className="w-3.5 h-3.5" />
                ) : (
                  <ArrowUp />
                )}
              </Button>
            </form>
            <div className="text-xs text-neutral-500">
              AI can make mistakes. Check important information.
            </div>
          </div>
        </div>
      </div>
    </LazyMotion>
  )
}
